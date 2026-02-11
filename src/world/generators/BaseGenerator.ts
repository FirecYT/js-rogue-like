import { Chunk, TileType, RegionType, CHUNK_CONFIG } from '../Types';

export abstract class BaseGenerator {
	abstract generate(chunkX: number, chunkY: number): Chunk;

	protected createEmptyChunk(chunkX: number, chunkY: number): Chunk {
		const tiles: TileType[][] = [];
		const passableGrid: boolean[][] = [];

		for (let x = 0; x < CHUNK_CONFIG.SIZE; x++) {
			tiles[x] = [];
			passableGrid[x] = [];
			for (let y = 0; y < CHUNK_CONFIG.SIZE; y++) {
				tiles[x][y] = TileType.EMPTY;
				passableGrid[x][y] = true;
			}
		}

		return {
			x: chunkX,
			y: chunkY,
			tiles,
			regionType: RegionType.VOID,
			passableGrid,
			generation: 0
		};
	}

	protected setTile(chunk: Chunk, x: number, y: number, tileType: TileType) {
		if (x >= 0 && x < CHUNK_CONFIG.SIZE && y >= 0 && y < CHUNK_CONFIG.SIZE) {
			chunk.tiles[x][y] = tileType;
			chunk.passableGrid[x][y] = this.isPassable(tileType);
		}
	}

	protected isPassable(tileType: TileType): boolean {
		return [TileType.EMPTY, TileType.ROCK, TileType.BUILDING].includes(tileType);
	}

	protected worldToChunkPos(worldX: number, worldY: number) {
		return {
			chunkX: Math.floor(worldX / (CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE)),
			chunkY: Math.floor(worldY / (CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE)),
			tileX: Math.floor((worldX % (CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE)) / CHUNK_CONFIG.TILE_SIZE),
			tileY: Math.floor((worldY % (CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE)) / CHUNK_CONFIG.TILE_SIZE)
		};
	}

	protected chunkToWorldPos(chunkX: number, chunkY: number, tileX: number, tileY: number) {
		return {
			x: chunkX * CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE + tileX * CHUNK_CONFIG.TILE_SIZE,
			y: chunkY * CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE + tileY * CHUNK_CONFIG.TILE_SIZE
		};
	}
}
