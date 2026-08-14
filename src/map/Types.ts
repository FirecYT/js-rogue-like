export const TILES = {
	EMPTY: 0,
	FLOOR: 1,
	WALL: 2,
	ROCK: 3,
	BUILDING: 4,
	WATER: 5,
};

export interface TileDef {
	id: number;
	name: string;
	passable: boolean;
	opaque: boolean;
}

export const TILE_DEFS: TileDef[] = [
	{ id: TILES.EMPTY, name: 'empty', passable: true, opaque: true },
	{ id: TILES.FLOOR, name: 'floor', passable: true, opaque: true },
	{ id: TILES.WALL, name: 'wall', passable: false, opaque: false },
	{ id: TILES.ROCK, name: 'rock', passable: true, opaque: false },
	{ id: TILES.BUILDING, name: 'building', passable: true, opaque: true },
	{ id: TILES.WATER, name: 'water', passable: false, opaque: true },
];
