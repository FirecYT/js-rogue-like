import { LaserGunWeapon } from '../../items/weapons/LaserGunWeapon';
import { ShotgunWeapon } from '../../items/weapons/ShotgunWeapon';
import type { Weapon } from '../../items/Weapon';
import type { Modifier } from '../../items/modifiers/Modifier';
import {
	DamagePlusModifier,
	PierceModifier,
	MulticastModifier,
	ExplosiveEndModifier,
} from '../../items/modifiers/catalog';
import type { Chip } from '../../items/Chip';
import { DashChip } from '../../items/chips/DashChip';
import { TeleportChip } from '../../items/chips/TeleportChip';

/** Запись таблицы спавна региона: определение конвейера + вес. */
export interface RegionSpawnEntry {
	defId: string;
	weight: number;
}

/** Фабрика предмета лута/торговли. */
export type LootFactory = () => Weapon | Modifier | Chip;

/** Палитра региона: цвета процедурных тайлов пола и стен. */
export interface RegionPalette {
	/** Варианты цвета пола (выбираются хешем тайла). */
	floor: string[];
	/** Базовый цвет стены. */
	wall: string;
	/** Тёмная кромка стены. */
	wallDark: string;
	/** Цвет метки региона в HUD. */
	fog: string;
}

/** Прямоугольник региона в координатах чанков относительно чанка спавна. */
export interface RegionRect {
	x: number;
	y: number;
	w: number;
	h: number;
}

/** Id генератора чанков региона. */
export type RegionGeneratorId =
	| 'void'
	| 'ruins'
	| 'city'
	| 'bunker'
	| 'altar'
	| 'iced'
	| 'glass';

/**
 * Декларативное определение региона мира. Мир собран из регионов:
 * каждый регион занимает прямоугольник чанков (или весь мир как
 * fallback) и обслуживается своим генератором, палитрой, таблицей
 * спавна и структурами — как в Noita и оригинальной игре.
 */
export interface RegionDefinition {
	id: string;
	name: string;
	palette: RegionPalette;
	/** Прямоугольник чанков относительно спавна; null — регион по умолчанию. */
	rect: RegionRect | null;
	/** Генератор чанков региона. */
	generator: RegionGeneratorId;
	/** Таблица спавна мобов: id определений конвейера + веса. */
	spawns: RegionSpawnEntry[];
	/** Враги не спавнятся в регионе (безопасная зона). */
	safe?: boolean;
	/** Босс алтаря региона (для алтарных регионов). */
	bossDefId?: string;
	/** Пул лута для тайников, прилавков и структур. */
	loot: LootFactory[];
	/** Пол и стены рисуются спрайтами из images/, а не процедурной палитрой. */
	imageTiles?: boolean;
	/** Множитель плотности руин (0..1 от базовой) для руин-генератора. */
	ruinsDensity?: number;
	/** Шанс тайника с лутом на чанк (для регионов с редким лутом). */
	lootChance?: number;
}

/**
 * Реестр регионов. Порядок важен: первые конкретные прямоугольники,
 * последним — fallback-регион (rect: null). Раскладка зафиксирована
 * дизайн-решением: Void в центре, Ruins вокруг, City через 50 чанков
 * вверх, Bunker через 100 вправо от City, алтарь червя через 50 влево
 * от City, IcedFields через 200 влево от спавна, Стеклянная равнина
 * зеркально через 200 вправо.
 */
export const REGION_DEFINITIONS: Record<string, RegionDefinition> = {
	/** Ядро пустоты в центре мира: безопасная пустота. */
	void_core: {
		id: 'void_core',
		name: 'Пустота',
		palette: {
			floor: ['#101013'],
			wall: '#1c1c22',
			wallDark: '#0c0c0f',
			fog: '#6b7280',
		},
		rect: { x: -8, y: -8, w: 16, h: 16 },
		generator: 'void',
		spawns: [],
		safe: true,
		loot: [],
	},

	/** Город выживших: здания, дороги, дружелюбные NPC, без врагов. */
	city: {
		id: 'city',
		name: 'Город',
		palette: {
			floor: ['#33363b', '#2d3035', '#3a3d43'],
			wall: '#8a8f98',
			wallDark: '#4b5058',
			fog: '#e5e7eb',
		},
		rect: { x: -20, y: -70, w: 40, h: 40 },
		generator: 'city',
		spawns: [],
		safe: true,
		loot: [
			() => new ShotgunWeapon(),
			() => new DamagePlusModifier(),
			() => new DashChip(),
		],
	},

	/** Бункер справа от города: закрытые коридоры, охрана, богатый лут. */
	bunker: {
		id: 'bunker',
		name: 'Бункер',
		palette: {
			floor: ['#24262a', '#1f2124', '#2a2c31'],
			wall: '#5c636d',
			wallDark: '#33383f',
			fog: '#9ca3af',
		},
		rect: { x: 80, y: -70, w: 40, h: 40 },
		generator: 'bunker',
		spawns: [{ defId: 'rust_grunt', weight: 4 }],
		loot: [
			() => new LaserGunWeapon(),
			() => new MulticastModifier(2, 0.3),
			() => new ExplosiveEndModifier(),
			() => new ShotgunWeapon(),
		],
	},

	/** Алтарь механического червя влево от города. */
	worm_altar: {
		id: 'worm_altar',
		name: 'Алтарь червя',
		palette: {
			floor: ['#2f2622', '#292019', '#332a24'],
			wall: '#7c5a43',
			wallDark: '#4a3527',
			fog: '#f97316',
		},
		rect: { x: -106, y: -56, w: 12, h: 12 },
		generator: 'altar',
		spawns: [{ defId: 'rust_grunt', weight: 2 }],
		bossDefId: 'rust_worm',
		loot: [() => new PierceModifier(), () => new ShotgunWeapon()],
	},

	/** Ледяные поля влево от спавна: открытый снег и лёд. */
	iced_fields: {
		id: 'iced_fields',
		name: 'Ледяные поля',
		palette: {
			floor: ['#3b4c5c', '#354655', '#415262'],
			wall: '#7fa8bd',
			wallDark: '#4a6a80',
			fog: '#a5f3fc',
		},
		rect: { x: -230, y: -30, w: 60, h: 60 },
		generator: 'iced',
		spawns: [{ defId: 'ice_shard', weight: 3 }],
		loot: [
			() => new LaserGunWeapon(),
			() => new PierceModifier(),
			() => new TeleportChip(),
		],
	},

	/** Стеклянная равнина вправо от спавна: дюны, осколки, алтарь стража. */
	glass_plain: {
		id: 'glass_plain',
		name: 'Стеклянная равнина',
		palette: {
			floor: ['#31404a', '#2c3a44', '#36474f'],
			wall: '#9fb8c4',
			wallDark: '#5b7482',
			fog: '#67e8f9',
		},
		rect: { x: 170, y: -30, w: 60, h: 60 },
		generator: 'glass',
		spawns: [
			{ defId: 'glass_shard', weight: 3 },
			{ defId: 'glass_wisp', weight: 2 },
		],
		bossDefId: 'glass_warden',
		loot: [
			() => new LaserGunWeapon(),
			() => new MulticastModifier(2, 0.3),
			() => new ExplosiveEndModifier(),
			() => new TeleportChip(),
		],
	},

	/** Руины: регион по умолчанию вокруг ядра пустоты. */
	ruins: {
		id: 'ruins',
		name: 'Ржавые пустоши',
		palette: {
			floor: ['#2b2b2b', '#262626', '#2e2a26'],
			wall: '#6b7280',
			wallDark: '#374151',
			fog: '#d97706',
		},
		rect: null,
		generator: 'ruins',
		spawns: [
			{ defId: 'rust_grunt', weight: 3 },
			{ defId: 'rust_worm', weight: 0 },
		],
		loot: [
			() => new ShotgunWeapon(),
			() => new DamagePlusModifier(),
			() => new PierceModifier(),
			() => new DashChip(),
		],
		bossDefId: 'rust_worm',
		imageTiles: true,
		ruinsDensity: 1,
		lootChance: 0.12,
	},
};

/** Упорядоченный список регионов: конкретные раньше fallback. */
export const REGION_ORDER: string[] = [
	'void_core',
	'city',
	'bunker',
	'worm_altar',
	'iced_fields',
	'glass_plain',
	'ruins',
];

/**
 * Возвращает определение региона по id.
 * @param id - Идентификатор региона
 * @returns Определение региона
 * @throws Error, если региона нет в реестре
 */
export function getRegionDefinition(id: string): RegionDefinition {
	const definition = REGION_DEFINITIONS[id];
	if (!definition) {
		throw new Error(`Unknown region definition: ${id}`);
	}
	return definition;
}
