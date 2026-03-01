import { BaseGenerator } from './BaseGenerator';
import { Chunk, TileType, RegionType, CHUNK_CONFIG } from '../Types';

/**
 * Генератор руин: здания с входами, стены, обломки (ROCK).
 */
export class RuinsGenerator extends BaseGenerator {
	/**
	 * @param chunkX - X чанка
	 * @param chunkY - Y чанка
	 * @returns Чанк с руинами
	 */
	generate(chunkX: number, chunkY: number): Chunk {
		const chunk = this.createEmptyChunk(chunkX, chunkY);
		chunk.regionType = RegionType.RUINS;
		this.generateBuildings(chunk);
		this.generateWalls(chunk);
		this.generateDebris(chunk);

		return chunk;
	}

	private generateBuildings(chunk: Chunk) {
		// Создаём несколько зданий
		const buildingCount = 2 + Math.floor(Math.random() * 3);

		for (let i = 0; i < buildingCount; i++) {
			const width = 3 + Math.floor(Math.random() * 3);
			const height = 3 + Math.floor(Math.random() * 3);
			const x = 1 + Math.floor(Math.random() * (CHUNK_CONFIG.SIZE - width - 2));
			const y = 1 + Math.floor(Math.random() * (CHUNK_CONFIG.SIZE - height - 2));

			this.generateRectangle(chunk, x, y, width, height, TileType.BUILDING);

			// Добавляем вход
			const entranceSide = Math.floor(Math.random() * 4);
			this.addBuildingEntrance(chunk, x, y, width, height, entranceSide);
		}
	}

	private generateWalls(chunk: Chunk) {
		// Создаём разрушенные стены
		for (let i = 0; i < 5; i++) {
			const horizontal = Math.random() > 0.5;
			const length = 3 + Math.floor(Math.random() * 6);

			if (horizontal) {
				const x = Math.floor(Math.random() * (CHUNK_CONFIG.SIZE - length));
				const y = Math.floor(Math.random() * CHUNK_CONFIG.SIZE);
				this.generateLine(chunk, x, y, length, 0, TileType.WALL);
			} else {
				const x = Math.floor(Math.random() * CHUNK_CONFIG.SIZE);
				const y = Math.floor(Math.random() * (CHUNK_CONFIG.SIZE - length));
				this.generateLine(chunk, x, y, 0, length, TileType.WALL);
			}
		}
	}

	private generateDebris(chunk: Chunk) {
		// Добавляем случайные камни и обломки
		for (let x = 0; x < CHUNK_CONFIG.SIZE; x++) {
			for (let y = 0; y < CHUNK_CONFIG.SIZE; y++) {
				if (chunk.tiles[x][y] === TileType.EMPTY && Math.random() < 0.1) {
					this.setTile(chunk, x, y, TileType.ROCK);
				}
			}
		}
	}

	private generateRectangle(chunk: Chunk, startX: number, startY: number, width: number, height: number, tileType: TileType) {
		for (let x = startX; x < startX + width; x++) {
			for (let y = startY; y < startY + height; y++) {
				this.setTile(chunk, x, y, tileType);
			}
		}
	}

	private generateLine(chunk: Chunk, startX: number, startY: number, deltaX: number, deltaY: number, tileType: TileType) {
		for (let i = 0; i < Math.max(deltaX, deltaY); i++) {
			const x = startX + (deltaX > 0 ? i : 0);
			const y = startY + (deltaY > 0 ? i : 0);
			this.setTile(chunk, x, y, tileType);
		}
	}

	private addBuildingEntrance(chunk: Chunk, x: number, y: number, width: number, height: number, side: number) {
		let entranceX = x;
		let entranceY = y;

		switch (side) {
			case 0: // top
				entranceX = x + Math.floor(width / 2);
				entranceY = y;
				break;
			case 1: // right
				entranceX = x + width - 1;
				entranceY = y + Math.floor(height / 2);
				break;
			case 2: // bottom
				entranceX = x + Math.floor(width / 2);
				entranceY = y + height - 1;
				break;
			case 3: // left
				entranceX = x;
				entranceY = y + Math.floor(height / 2);
				break;
		}

		this.setTile(chunk, entranceX, entranceY, TileType.EMPTY);
	}
}
