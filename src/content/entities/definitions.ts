import type { Team } from '../../types/Team';
import type { Weapon } from '../../items/Weapon';
import type { Chip } from '../../items/Chip';
import type { Modifier } from '../../items/modifiers/Modifier';
import { ShotgunWeapon } from '../../items/weapons/ShotgunWeapon';
import { LaserGunWeapon } from '../../items/weapons/LaserGunWeapon';
import { PistolWeapon } from '../../items/weapons/PistolWeapon';
import { DamageMultModifier, MulticastModifier } from '../../items/modifiers/catalog';
import { BossCannonWeapon } from '../../items/weapons/BossCannonWeapon';
import { RebirthChip } from '../../items/chips/RebirthChip';

/**
 * Декларативные определения сущностей («конвейер»: описание -> EntityFactory).
 *
 * Всё, чем является сущность, описывается данными: характеристики, внешность,
 * профиль поведения (ИИ), снаряжение и спецификация босса. Новые враги и боссы
 * добавляются записью в реестр без новых классов сущностей.
 */

/** Вид поведения сущности, управляемого контроллером конвейера. */
export type AiKind =
	/** Голова червя: направленное движение с волной и залпами по цели. */
	| 'worm'
	/** Турель: не движется, поворачивает ствол и бьёт по линии видимости. */
	| 'turret'
	/** Полноценный FSM-враг: покой/патруль, аггро с памятью, атака по архетипу, поводок и возврат. */
	| 'enemy'
	/** Сегмент тела: держится позади лидера на заданной дистанции. */
	| 'follower'
	/** Неподвижная сущность без поведения. */
	| 'stationary'
	/** Дружественный NPC: прогуливается вокруг дома, не воюет. */
	| 'settler';

/**
 * Профиль поведения: параметры контроллера conвейера.
 * Необязательные поля зависят от kind.
 */
export interface AiProfile {
	kind: AiKind;
	/** Дистанция обнаружения цели для преследования (chaser, worm). */
	aggroRange?: number;
	/** Дистанция открытия огня (chaser, worm). */
	fireRange?: number;
	/** Интервал пересчёта пути в кадрах (chaser). */
	repathInterval?: number;
	/** Амплитуда поперечной волны движения головы, радианы (worm). */
	waveAmplitude?: number;
	/** Частота волны: приращение фазы за кадр (worm). */
	waveFrequency?: number;
	/** Дистанция, которую сегмент держит до лидера (follower). */
	followDistance?: number;
	/** Архетип поведения FSM-врага (enemy, по умолчанию chaser). */
	behavior?: EnemyBehavior;
	/** Максимальное удаление от точки спавна в погоне; дальше — возврат (enemy). */
	leashRange?: number;
	/** Радиус блуждания в покое вокруг точки спавна (enemy). */
	wanderRadius?: number;
	/** Доля HP, ниже которой трусливый враг убегает (timid). */
	fleeBelow?: number;
	/** Радиус срабатывания самоподрыва камикадзе, px. */
	explodeTrigger?: number;
	/** Радиус поражения взрыва камикадзе, px. */
	explodeRadius?: number;
	/** Урон взрыва камикадзе. */
	explodeDamage?: number;
	/** Множитель скорости в рывке камикадзе. */
	chargeSpeedMult?: number;
	/** Фазы босса: переключаются по порогу доли HP (turret). */
	phases?: AiPhase[];
}

/**
 * Архетип поведения FSM-врага (этап 10 «жизнь вражеского AI»):
 * - chaser: преследует в упор и стреляет на ходу;
 * - kiter: держит дистанцию огня, отходит, если подошли вплотную;
 * - kamikaze: разгоняется и взрывается рядом с целью, погибая сам;
 * - timid: воюет как kiter, но на низком HP убегает и возвращается домой.
 */
export type EnemyBehavior = 'chaser' | 'kiter' | 'kamikaze' | 'timid';

/**
 * Фаза босса-турели: применяется, когда доля HP впервые опускается до hpBelow.
 * Множители и паттерн относительны к базовым характеристикам оружия.
 */
export interface AiPhase {
	/** Порог доли HP (1 = полная шкала, 0.3 = ниже 30%). */
	hpBelow: number;
	/** Число снарядов залпа (заменяет weapon.shots). */
	shots?: number;
	/** Сектор веера залпа в радианах (заменяет weapon.shotSpread). */
	spread?: number;
	/** Множитель темпа стрельбы: <1 — чаще (меняет weapon.fireRate). */
	fireRateMult?: number;
	/** Множитель урона (weapon.damageMultiplier). */
	damageMult?: number;
	/** Перекраска тела босса в фазе (colorOverride). */
	color?: string;
}

/** Внешность сущности: примитив канваса и цвета. */
export interface AppearanceSpec {
	shape: 'rect' | 'circle';
	/** Характерный размер в пикселях (сторона квадрата или диаметр). */
	size: number;
	color: string;
	/** Цвет обводки (опционально). */
	outline?: string;
	/** Показывать полоску HP над сущностью. */
	showHpBar?: boolean;
}

/** Снаряжение сущности: фабрики предметов (создаются при спавне). */
export interface LoadoutSpec {
	/** Фабрика оружия-оболочки. */
	weapon?: () => Weapon;
	/**
	 * Заменяющие модификаторы слотов оружия (по умолчанию — стартовый
	 * набор самого оружия). Пустые слоты остаются дырками.
	 */
	modifiers?: () => Modifier[];
	/** Фабрики чипов (кладутся в первые свободные слоты). */
	chips?: (() => Chip)[];
}

/** Спецификация босса: тело из сегментов и постановка появления. */
export interface BossSpec {
	/** Титул босса (имя-табличка и строки призыва). */
	title: string;
	/** Число сегментов тела позади головы (0 — босс без тела). */
	segments: number;
	/** Дистанция между сегментами в пикселях. */
	segmentGap?: number;
	/** id определения сегмента (по умолчанию `${id}_segment`). */
	segmentDef?: string;
	/** Строки катсцены при призыве (по умолчанию — стандартные). */
	summonLines?: string[];
}

/** Полное декларативное описание сущности для конвейера. */
export interface EntityDefinition {
	id: string;
	name: string;
	hp: number;
	speed: number;
	/** Размер хитбокса (и базы внешности) в пикселях. */
	size: number;
	team: Team;
	solid?: boolean;
	targetable?: boolean;
	persistent?: boolean;
	/** Опыт за убийство (для прогрессии игрока). */
	experience?: number;
	/**
	 * Схема управления при переходе на это тело (перерождение):
	 * 'topdown' по умолчанию, 'tank' — W вперёд, A/D поворот.
	 */
	controlScheme?: 'topdown' | 'tank';
	appearance: AppearanceSpec;
	ai?: AiProfile;
	loadout?: LoadoutSpec;
	boss?: BossSpec;
	/** Категория журнала: враг, босс или NPC (нет — не попадает в журнал). */
	journal?: 'enemy' | 'boss' | 'npc';
	/** Лор-описание для журнала. */
	description?: string;
}

/**
 * Реестр определений. Ключ равен id определения.
 * Новые сущности добавляются сюда; классы сущностей для них не нужны.
 */
export const ENTITY_DEFINITIONS: Record<string, EntityDefinition> = {
	/** Рядовой моб клана ржавых: преследует и стреляет из дробовика. */
	rust_grunt: {
		id: 'rust_grunt',
		journal: 'enemy',
		description: 'Пехота клана ржавых: бывший шахтёрский персонал, закованный в сварные доспехи. Держится группами, стреляет очередями из обрезанных дробовиков и не задаёт вопросов.',
		name: 'Ржавый боец',
		hp: 12,
		speed: 1.2,
		size: 8,
		team: 'enemy',
		experience: 5,
		appearance: { shape: 'rect', size: 8, color: '#f90', showHpBar: true },
		ai: {
			kind: 'enemy',
			behavior: 'chaser',
			aggroRange: 500,
			fireRange: 400,
			repathInterval: 60,
			leashRange: 1500,
			wanderRadius: 180,
		},
		loadout: { weapon: () => new ShotgunWeapon() },
	},

	/**
	 * БОСС-ЭТАЛОН конвейера: направленный червь из головы и сегментов.
	 * Голова идёт волной к цели и бьёт залпами из корпусной пушки;
	 * сегменты тянутся следом и гибнут вместе с головой.
	 * Чип перерождения в снаряжении: босс играбелен через ControlSwitch.
	 */
	rust_worm: {
		id: 'rust_worm',
		journal: 'boss',
		description: 'Механический червь пустоты: сегментированный бурильный комплекс, сорвавшийся с привязки. Пробивает руины насквозь, реагирует на вибрацию шагов. Пробуждается только у алтаря.',
		name: 'Ржавый червь',
		hp: 350,
		speed: 1.7,
		size: 24,
		team: 'enemy',
		experience: 120,
		controlScheme: 'tank',
		appearance: {
			shape: 'circle',
			size: 24,
			color: '#b45309',
			outline: '#fbbf24',
			showHpBar: true,
		},
		ai: {
			kind: 'worm',
			aggroRange: 600,
			fireRange: 420,
			waveAmplitude: 0.5,
			waveFrequency: 0.05,
		},
		loadout: {
			weapon: () => new BossCannonWeapon(),
			chips: [() => new RebirthChip()],
		},
		boss: {
			title: 'РЖАВЫЙ ЧЕРВЬ',
			segments: 6,
			segmentGap: 26,
		},
	},

	/** Осколочный моб равнины: быстрый боец с лазером. */
	glass_shard: {
		id: 'glass_shard',
		journal: 'enemy',
		description: 'Оживший осколок стеклянной равнины: медленно плывёт к цели и бьёт лучом преломлённого света. Красив, тих и совершенно равнодушен к тому, что вы дышите.',
		name: 'Стеклянный осколок',
		hp: 10,
		speed: 1.6,
		size: 8,
		team: 'enemy',
		experience: 6,
		appearance: { shape: 'rect', size: 8, color: '#a5f3fc', showHpBar: true },
		ai: {
			kind: 'enemy',
			behavior: 'timid',
			aggroRange: 520,
			fireRange: 380,
			repathInterval: 50,
			leashRange: 1400,
			wanderRadius: 200,
			fleeBelow: 0.4,
		},
		loadout: { weapon: () => new LaserGunWeapon() },
	},

	/** Ближний моб равнины: очень быстрый, слабый, с пистолетом. */
	glass_wisp: {
		id: 'glass_wisp',
		journal: 'enemy',
		description: 'Стеклянный блик: быстрая искра отражений, рождается там, где свет ломается о дюны. Нападает роем, сгорает от одного меткого попадания.',
		name: 'Стеклянный блик',
		hp: 6,
		speed: 2.4,
		size: 6,
		team: 'enemy',
		experience: 4,
		appearance: { shape: 'circle', size: 6, color: '#e0f2fe', showHpBar: true },
		ai: {
			kind: 'enemy',
			behavior: 'kiter',
			aggroRange: 600,
			fireRange: 300,
			repathInterval: 40,
			leashRange: 1600,
			wanderRadius: 240,
		},
		loadout: { weapon: () => new PistolWeapon() },
	},

	/** Поселенец: дружелюбный NPC восстановленных домов и города. */
	settler: {
		id: 'settler',
		journal: 'npc',
		description: 'Поселенец восстановленных домов: один из тех, кто решился жить среди руин. Чинит стены, разводит грибницы и охотно делится новостями — но не выходит за порог без необходимости.',
		name: 'Поселенец',
		hp: 30,
		speed: 0.6,
		size: 9,
		team: 'player',
		appearance: { shape: 'circle', size: 9, color: '#93c5fd', showHpBar: false },
		ai: { kind: 'settler' },
		loadout: { weapon: () => new PistolWeapon() },
	},

	/** Моб ледяных полей: медленный стрелок, держит дистанцию. */
	ice_shard: {
		id: 'ice_shard',
		journal: 'enemy',
		description: 'Ледяной осколок: вмороженный в торос обломок дозиметрической вышки поля. Накопив холод, бросается в атаку и рассыпается ледяным взрывом.',
		name: 'Ледяной осколок',
		hp: 12,
		speed: 1.4,
		size: 8,
		team: 'enemy',
		experience: 6,
		appearance: { shape: 'rect', size: 8, color: '#bfdbfe', showHpBar: true },
		ai: {
			kind: 'enemy',
			behavior: 'kamikaze',
			aggroRange: 500,
			repathInterval: 30,
			leashRange: 1400,
			wanderRadius: 160,
			explodeTrigger: 34,
			explodeRadius: 70,
			explodeDamage: 18,
			chargeSpeedMult: 1.8,
		},
		loadout: { weapon: () => new LaserGunWeapon() },
	},

	/**
	 * БОСС-ЭТАЛОН «турель»: Стеклянный страж не движется, держит ствол на
	 * цели и бьёт лучевыми залпами. Второй эталон поведения конвейера.
	 */
	glass_warden: {
		id: 'glass_warden',
		journal: 'boss',
		description: 'Стеклянный страж: неподвижная турель-хранительница равнины, собранная из цельного монолита. Не преследует — не нужно: её залпы достают всё, что движется в прямой видимости.',
		name: 'Стеклянный страж',
		hp: 300,
		speed: 0,
		size: 22,
		team: 'enemy',
		experience: 100,
		controlScheme: 'tank',
		appearance: {
			shape: 'circle',
			size: 22,
			color: '#0ea5e9',
			outline: '#e0f2fe',
			showHpBar: true,
		},
		ai: {
			kind: 'turret',
			fireRange: 480,
			phases: [
				{ hpBelow: 1 },
				{ hpBelow: 0.6, shots: 3, spread: 0.5, fireRateMult: 0.75 },
				{
					hpBelow: 0.3,
					shots: 8,
					spread: Math.PI * 2 * (7 / 8),
					fireRateMult: 0.6,
					damageMult: 1.25,
					color: '#f87171',
				},
			],
		},
		loadout: {
			weapon: () => new LaserGunWeapon(),
			modifiers: () => [new DamageMultModifier(), new MulticastModifier(2, 0.4)],
			chips: [() => new RebirthChip()],
		},
		boss: { title: 'СТЕКЛЯННЫЙ СТРАЖ', segments: 0 },
	},

	/** Сегмент тела червя: следует за лидером, урон не наносит. */
	rust_worm_segment: {
		id: 'rust_worm_segment',
		name: 'Сегмент червя',
		hp: 60,
		speed: 2.2,
		size: 16,
		team: 'enemy',
		appearance: { shape: 'circle', size: 16, color: '#92400e', showHpBar: true },
		ai: { kind: 'follower', followDistance: 26 },
	},
};

/**
 * Возвращает определение сущности по id.
 * @param id - Идентификатор определения в реестре
 * @returns Определение сущности
 * @throws Error, если определения нет в реестре
 */
export function getEntityDefinition(id: string): EntityDefinition {
	const definition = ENTITY_DEFINITIONS[id];
	if (!definition) {
		throw new Error(`Unknown entity definition: ${id}`);
	}
	return definition;
}
