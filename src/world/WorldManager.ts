// world/WorldManager.ts
import { Chunk, RegionType, CHUNK_CONFIG } from './Types';
import { VoidGenerator } from './generators/VoidGenerator';
import { RuinsGenerator } from './generators/RuinsGenerator';
import { BossAltarGenerator } from './generators/BossAltarGenerator';

export class WorldManager {
	private chunks = new Map<string, Chunk>();
	private loadDistance = 3;

	private generators = {
		[RegionType.VOID]: new VoidGenerator(),
		[RegionType.RUINS]: new RuinsGenerator(),
		[RegionType.BOSS_ALTAR]: new BossAltarGenerator()
	};

	update(playerX: number, playerY: number) {
		const playerChunk = this.worldToChunk(playerX, playerY);

		// Загружаем чанки вокруг игрока
		for (let x = playerChunk.x - this.loadDistance; x <= playerChunk.x + this.loadDistance; x++) {
			for (let y = playerChunk.y - this.loadDistance; y <= playerChunk.y + this.loadDistance; y++) {
				this.loadChunk(x, y);
			}
		}

		// Выгружаем дальние чанки
		for (const [key, chunk] of this.chunks.entries()) {
			const distance = Math.sqrt(
				(chunk.x - playerChunk.x) ** 2 + (chunk.y - playerChunk.y) ** 2
			);
			if (distance > this.loadDistance + 2) {
				this.chunks.delete(key);
			}
		}
	}

	private loadChunk(chunkX: number, chunkY: number) {
		const key = `${chunkX},${chunkY}`;

		if (this.chunks.has(key)) return;

		const regionType = this.getRegionType(chunkX, chunkY);
		const generator = this.generators[regionType];
		const chunk = generator.generate(chunkX, chunkY);

		this.chunks.set(key, chunk);
	}

	private getRegionType(chunkX: number, chunkY: number): RegionType {
		// Центральная область - пустота
		const distanceFromCenter = Math.sqrt(chunkX ** 2 + chunkY ** 2);
		if (distanceFromCenter < 3) return RegionType.VOID;

		// Алтари боссов в определённых позициях
		const bossAltars = [
			{ x: 3, y: 0 }, { x: 0, y: 3 },
			{ x: -3, y: 0 }, { x: 0, y: -3 }
		];

		for (const altar of bossAltars) {
			if (chunkX === altar.x && chunkY === altar.y) {
				return RegionType.BOSS_ALTAR;
			}
		}

		// Всё остальное - руины
		return RegionType.RUINS;
	}

	worldToGrid(worldX: number, worldY: number) {
		const chunk = this.worldToChunk(worldX, worldY);
		const chunkData = this.getChunk(chunk.x, chunk.y);

		if (!chunkData) return null;

		// Исправляем для отрицательных координат
		const chunkWorldX = chunk.x * CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE;
		const chunkWorldY = chunk.y * CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE;

		const localX = Math.floor((worldX - chunkWorldX) / CHUNK_CONFIG.TILE_SIZE);
		const localY = Math.floor((worldY - chunkWorldY) / CHUNK_CONFIG.TILE_SIZE);

		// Проверяем границы
		if (localX < 0 || localX >= CHUNK_CONFIG.SIZE || localY < 0 || localY >= CHUNK_CONFIG.SIZE) {
			return null;
		}

		const globalTileX = chunk.x * CHUNK_CONFIG.SIZE + localX;
		const globalTileY = chunk.y * CHUNK_CONFIG.SIZE + localY;

		return {
			chunkX: chunk.x,
			chunkY: chunk.y,
			tileX: localX,
			tileY: localY,
			globalTileX,
			globalTileY
		};
	}

	gridToWorld(globalTileX: number, globalTileY: number) {
		const chunkX = Math.floor(globalTileX / CHUNK_CONFIG.SIZE);
		const chunkY = Math.floor(globalTileY / CHUNK_CONFIG.SIZE);
		const localX = globalTileX % CHUNK_CONFIG.SIZE;
		const localY = globalTileY % CHUNK_CONFIG.SIZE;

		return {
			x: chunkX * CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE + localX * CHUNK_CONFIG.TILE_SIZE,
			y: chunkY * CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE + localY * CHUNK_CONFIG.TILE_SIZE
		};
	}

	isTilePassable(globalTileX: number, globalTileY: number): boolean {
		const chunkX = Math.floor(globalTileX / CHUNK_CONFIG.SIZE);
		const chunkY = Math.floor(globalTileY / CHUNK_CONFIG.SIZE);
		const localX = globalTileX % CHUNK_CONFIG.SIZE;
		const localY = globalTileY % CHUNK_CONFIG.SIZE;

		const chunk = this.getChunk(chunkX, chunkY);
		if (!chunk) return false;

		return chunk.passableGrid[localX]?.[localY] || false;
	}

	// Новая функция для проверки проходимости по мировым координатам
	isWorldPositionPassable(worldX: number, worldY: number): boolean {
		const gridPos = this.worldToGrid(worldX, worldY);
		if (!gridPos) return false;
		return this.isTilePassable(gridPos.globalTileX, gridPos.globalTileY);
	}

	private worldToChunk(worldX: number, worldY: number) {
		// Исправляем для отрицательных координат
		const chunkX = Math.floor(worldX / (CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE));
		const chunkY = Math.floor(worldY / (CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE));

		return { x: chunkX, y: chunkY };
	}

	getChunk(chunkX: number, chunkY: number): Chunk | null {
		return this.chunks.get(`${chunkX},${chunkY}`) || null;
	}

	getActiveChunks(): Chunk[] {
		return Array.from(this.chunks.values());
	}

	// Новый метод для получения всех проходимых соседей (для A*)
	getPassableNeighbors(globalTileX: number, globalTileY: number): { x: number, y: number }[] {
		const neighbors = [];
		const directions = [
			{ dx: -1, dy: 0 }, { dx: 1, dy: 0 },
			{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }
		];

		for (const dir of directions) {
			const newX = globalTileX + dir.dx;
			const newY = globalTileY + dir.dy;

			if (this.isTilePassable(newX, newY)) {
				neighbors.push({ x: newX, y: newY });
			}
		}

		return neighbors;
	}
}
