export enum TileType {
	EMPTY = 0,
	WALL = 1,
	ROCK = 2,
	BUILDING = 3,
	WATER = 4
}

export enum RegionType {
	VOID = 'void',
	RUINS = 'ruins',
	BOSS_ALTAR = 'boss_altar',
	SETTLEMENT = 'settlement',
	// FOREST = 'forest'
}

export interface Chunk {
	x: number;
	y: number;
	tiles: TileType[][];
	regionType: RegionType;
	passableGrid: boolean[][];
	generation: number;
}

export const CHUNK_CONFIG = {
	SIZE: 20,
	TILE_SIZE: 32,
	FULL_SIZE: 640,
	HALF_SIZE: 16
};
