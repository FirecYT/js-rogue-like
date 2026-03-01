import { Chunk, TileType, RegionType, CHUNK_CONFIG } from '../Types';

/**
 * Базовый генератор чанков: пустой чанк, установка тайла, проходимость, преобразование координат.
 */
export abstract class BaseGenerator {
	/**
	 * Генерирует чанк по координатам.
	 * @param chunkX - X чанка
	 * @param chunkY - Y чанка
	 * @returns Чанк
	 */
	abstract generate(chunkX: number, chunkY: number): Chunk;

	/**
	 * Создаёт пустой проходимый чанк с regionType VOID.
	 * @param chunkX - X чанка
	 * @param chunkY - Y чанка
	 * @returns Чанк
	 */
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

	/**
	 * Устанавливает тайл в чанке и обновляет passableGrid.
	 * @param chunk - Чанк
	 * @param x - Локальная X
	 * @param y - Локальная Y
	 * @param tileType - Тип тайла
	 */
	protected setTile(chunk: Chunk, x: number, y: number, tileType: TileType): void {
		if (x >= 0 && x < CHUNK_CONFIG.SIZE && y >= 0 && y < CHUNK_CONFIG.SIZE) {
			chunk.tiles[x][y] = tileType;
			chunk.passableGrid[x][y] = this.isPassable(tileType);
		}
	}

	/**
	 * Проходимы ли тайлы EMPTY, ROCK, BUILDING.
	 * @param tileType - Тип тайла
	 * @returns true, если проходим
	 */
	protected isPassable(tileType: TileType): boolean {
		return [TileType.EMPTY, TileType.ROCK, TileType.BUILDING].includes(tileType);
	}

	/**
	 * Преобразует мировые координаты в номер чанка и локальные индексы тайла.
	 * @param worldX - Мировая X
	 * @param worldY - Мировая Y
	 * @returns { chunkX, chunkY, tileX, tileY }
	 */
	protected worldToChunkPos(worldX: number, worldY: number): { chunkX: number; chunkY: number; tileX: number; tileY: number } {
		return {
			chunkX: Math.floor(worldX / (CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE)),
			chunkY: Math.floor(worldY / (CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE)),
			tileX: Math.floor((worldX % (CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE)) / CHUNK_CONFIG.TILE_SIZE),
			tileY: Math.floor((worldY % (CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE)) / CHUNK_CONFIG.TILE_SIZE)
		};
	}

	/**
	 * Преобразует чанк и локальный тайл в мировые координаты (верхний левый угол тайла).
	 * @param chunkX - X чанка
	 * @param chunkY - Y чанка
	 * @param tileX - Локальная X тайла
	 * @param tileY - Локальная Y тайла
	 * @returns { x, y }
	 */
	protected chunkToWorldPos(chunkX: number, chunkY: number, tileX: number, tileY: number): { x: number; y: number } {
		return {
			x: chunkX * CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE + tileX * CHUNK_CONFIG.TILE_SIZE,
			y: chunkY * CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE + tileY * CHUNK_CONFIG.TILE_SIZE
		};
	}
}
