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

/**
 * Запись таблицы спавна биома: определение конвейера + вес.
 */
export interface BiomeSpawnEntry {
	defId: string;
	weight: number;
}

/** Фабрика предмета лута/торговли. */
export type LootFactory = () => Weapon | Modifier | Chip;

/**
 * Палитра биома: цвета процедурных тайлов пола и стен.
 */
export interface BiomePalette {
	/** Варианты цвета пола (выбираются хешем тайла). */
	floor: string[];
	/** Базовый цвет стены. */
	wall: string;
	/** Тёмная кромка стены. */
	wallDark: string;
	/** Цвет метки зоны в HUD. */
	fog: string;
}

/**
 * Декларативное определение биома: палитра, плотность руин, таблица
 * спавна конвейера, шансы фич (алтарь/торговец/лут) и босс алтарей.
 */
export interface BiomeDefinition {
	id: string;
	name: string;
	palette: BiomePalette;
	/** Множитель плотности руин (0..1 от базовой). */
	ruinsDensity: number;
	/** Шанс алтаря на подходящий чанк руин. */
	altarChance: number;
	/** Шанс точки торговца на чанк. */
	traderChance: number;
	/** Шанс тайника с лутом на чанк. */
	lootChance: number;
	/** Таблица спавна мобов: id определений конвейера + веса. */
	spawns: BiomeSpawnEntry[];
	/** Босс алтарей биома (определение конвейера). */
	bossDefId: string;
	/** Пул лута для тайников и прилавка торговца. */
	loot: LootFactory[];
}

/**
 * Реестр биомов. Ключ равен id биома.
 */
export const BIOME_DEFINITIONS: Record<string, BiomeDefinition> = {
	/** Стартовые пустоши: ржавые руины, боевики клана ржавых. */
	rust_wastes: {
		id: 'rust_wastes',
		name: 'Ржавые пустоши',
		palette: {
			floor: ['#2b2b2b', '#262626', '#2e2a26'],
			wall: '#6b7280',
			wallDark: '#374151',
			fog: '#d97706',
		},
		ruinsDensity: 1,
		altarChance: 0.1,
		traderChance: 0.02,
		lootChance: 0.12,
		spawns: [
			{ defId: 'rust_grunt', weight: 3 },
			{ defId: 'rust_worm', weight: 0 },
		],
		bossDefId: 'rust_worm',
		loot: [
			() => new ShotgunWeapon(),
			() => new DamagePlusModifier(),
			() => new PierceModifier(),
			() => new DashChip(),
		],
	},

	/** Стеклянная равнина: бледные дюны, лучевые турели и осколки. */
	glass_plain: {
		id: 'glass_plain',
		name: 'Стеклянная равнина',
		palette: {
			floor: ['#31404a', '#2c3a44', '#36474f'],
			wall: '#9fb8c4',
			wallDark: '#5b7482',
			fog: '#67e8f9',
		},
		ruinsDensity: 0.7,
		altarChance: 0.1,
		traderChance: 0.02,
		lootChance: 0.14,
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
};

/**
 * Возвращает определение биома по id.
 * @param id - Идентификатор биома
 * @returns Определение биома
 * @throws Error, если биома нет в реестре
 */
export function getBiomeDefinition(id: string): BiomeDefinition {
	const definition = BIOME_DEFINITIONS[id];
	if (!definition) {
		throw new Error(`Unknown biome definition: ${id}`);
	}
	return definition;
}
