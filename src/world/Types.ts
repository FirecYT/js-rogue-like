/**
 * Типы тайлов мира.
 */
export enum TileType {
	EMPTY = 0,
	WALL = 1,
	ROCK = 2,
	BUILDING = 3,
	WATER = 4
}

/**
 * Типы регионов для генерации чанков.
 */
export enum RegionType {
	VOID = 'void',
	RUINS = 'ruins',
	BOSS_ALTAR = 'boss_altar',
	SETTLEMENT = 'settlement'
}

/**
 * Чанк мира: тайловая сетка и метаданные.
 */
export interface Chunk {
	/** Координата чанка по X */
	x: number;
	/** Координата чанка по Y */
	y: number;
	/** Двумерный массив типов тайлов [x][y] */
	tiles: TileType[][];
	/** Тип региона */
	regionType: RegionType;
	/** Сетка проходимости [x][y] */
	passableGrid: boolean[][];
	/** Номер поколения (для инвалидации кэша отрисовки) */
	generation: number;
}

/**
 * Конфигурация чанков: размеры и тайлы.
 */
export const CHUNK_CONFIG = {
	SIZE: 20,
	TILE_SIZE: 32,
	FULL_SIZE: 640,
	HALF_SIZE: 16
};
