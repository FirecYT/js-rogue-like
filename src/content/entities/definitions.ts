import type { Team } from '../../types/Team';
import type { Weapon } from '../../items/Weapon';
import type { Chip } from '../../items/Chip';
import type { Modifier } from '../../items/modifiers/Modifier';
import { ShotgunWeapon } from '../../items/weapons/ShotgunWeapon';
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
	/** Преследование цели с поиском пути и стрельбой (классический моб). */
	| 'chaser'
	/** Голова червя: направленное движение с волной и залпами по цели. */
	| 'worm'
	/** Сегмент тела: держится позади лидера на заданной дистанции. */
	| 'follower'
	/** Неподвижная сущность без поведения. */
	| 'stationary';

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
}

/**
 * Реестр определений. Ключ равен id определения.
 * Новые сущности добавляются сюда; классы сущностей для них не нужны.
 */
export const ENTITY_DEFINITIONS: Record<string, EntityDefinition> = {
	/** Рядовой моб клана ржавых: преследует и стреляет из дробовика. */
	rust_grunt: {
		id: 'rust_grunt',
		name: 'Ржавый боец',
		hp: 12,
		speed: 1.2,
		size: 8,
		team: 'enemy',
		experience: 5,
		appearance: { shape: 'rect', size: 8, color: '#f90', showHpBar: true },
		ai: { kind: 'chaser', aggroRange: 500, fireRange: 400, repathInterval: 60 },
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
