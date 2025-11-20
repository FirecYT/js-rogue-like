import { Chunk, RegionType, CHUNK_CONFIG, TileType } from './Types';
import { VoidGenerator } from './generators/VoidGenerator';
import { RuinsGenerator } from './generators/RuinsGenerator';
import { BossAltarGenerator } from './generators/BossAltarGenerator';

export class WorldManager {
	private chunks = new Map<string, Chunk>();
	private loadDistanceX = 2;
	private loadDistanceY = 1;

	private generators = {
		[RegionType.VOID]: new VoidGenerator(),
		[RegionType.RUINS]: new RuinsGenerator(),
		[RegionType.BOSS_ALTAR]: new BossAltarGenerator()
	};

	update(playerX: number, playerY: number) {
		const playerChunk = this.worldToChunk(playerX, playerY);

		// Загружаем чанки вокруг игрока
		for (let x = playerChunk.x - this.loadDistanceX; x <= playerChunk.x + this.loadDistanceX; x++) {
			for (let y = playerChunk.y - this.loadDistanceY; y <= playerChunk.y + this.loadDistanceY; y++) {
				this.loadChunk(x, y);
			}
		}

		// Выгружаем дальние чанки
		for (const [key, chunk] of this.chunks.entries()) {
			const distanceX = chunk.x - playerChunk.x;
			const distanceY = chunk.y - playerChunk.y;

			if (distanceX > this.loadDistanceX + 2) {
				this.chunks.delete(key);
			}

			if (distanceY > this.loadDistanceY + 2) {
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
			{ x: -3, y: 0 }, { x: 0, y: -3 },
			{ x: 16, y: 16 },
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

		// Исправляем для отрицательных координат
		let localX = globalTileX % CHUNK_CONFIG.SIZE;
		let localY = globalTileY % CHUNK_CONFIG.SIZE;

		if (localX < 0) localX += CHUNK_CONFIG.SIZE;
		if (localY < 0) localY += CHUNK_CONFIG.SIZE;

		return {
			x: chunkX * CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE + localX * CHUNK_CONFIG.TILE_SIZE,
			y: chunkY * CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE + localY * CHUNK_CONFIG.TILE_SIZE
		};
	}

	isTilePassable(globalTileX: number, globalTileY: number): boolean {
		const chunkX = Math.floor(globalTileX / CHUNK_CONFIG.SIZE);
		const chunkY = Math.floor(globalTileY / CHUNK_CONFIG.SIZE);

		// Исправляем для отрицательных координат
		let localX = globalTileX % CHUNK_CONFIG.SIZE;
		let localY = globalTileY % CHUNK_CONFIG.SIZE;

		if (localX < 0) localX += CHUNK_CONFIG.SIZE;
		if (localY < 0) localY += CHUNK_CONFIG.SIZE;

		const chunk = this.getChunk(chunkX, chunkY);
		if (!chunk) return false;

		return chunk.passableGrid[localX]?.[localY] || false;
	}

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

	getPassableNeighbors(globalTileX: number, globalTileY: number): { x: number, y: number }[] {
		const neighbors = [];
		const directions = [
			{ dx: -1, dy: 0 }, { dx: 1, dy: 0 },
			{ dx: 0, dy: -1 }, { dx: 0, dy: 1 },
			{ dx: -1, dy: -1 }, { dx: 1, dy: -1 },
			{ dx: -1, dy: 1 }, { dx: 1, dy: 1 }
		];

		for (const dir of directions) {
			const newX = globalTileX + dir.dx;
			const newY = globalTileY + dir.dy;

			if (dir.dx !== 0 && dir.dy !== 0) {
				const horX = globalTileX + dir.dx;
				const horY = globalTileY;
				const verX = globalTileX;
				const verY = globalTileY + dir.dy;
				if (!this.isTilePassable(horX, horY) || !this.isTilePassable(verX, verY)) {
					continue;
				}
			}

			if (this.isTilePassable(newX, newY)) {
				neighbors.push({ x: newX, y: newY });
			}
		}

		return neighbors;
	}

	getWallTextureIndex(
		chunk: Chunk,
		x: number,
		y: number,
		tileType: TileType
	): number {
		// Проверяем соседей в 4 направлениях
		const hasTop = this.hasWallNeighbor(chunk, x, y, 0, -1, tileType);
		const hasRight = this.hasWallNeighbor(chunk, x, y, 1, 0, tileType);
		const hasBottom = this.hasWallNeighbor(chunk, x, y, 0, 1, tileType);
		const hasLeft = this.hasWallNeighbor(chunk, x, y, -1, 0, tileType);

		// Вычисляем индекс по битовой маске
		let index = 0;
		if (hasTop) index |= 1;
		if (hasRight) index |= 2;
		if (hasBottom) index |= 4;
		if (hasLeft) index |= 8;

		return index;
	}

	hasWallNeighbor(
		chunk: Chunk,
		x: number,
		y: number,
		dx: number,
		dy: number,
		tileType: TileType
	): boolean {
		const neighborX = x + dx;
		const neighborY = y + dy;

		// Проверяем в пределах текущего чанка
		if (neighborX >= 0 && neighborX < CHUNK_CONFIG.SIZE &&
			neighborY >= 0 && neighborY < CHUNK_CONFIG.SIZE) {
			return chunk.tiles[neighborX][neighborY] === tileType;
		}

		// Если сосед за пределами чанка, проверяем через WorldManager
		const globalTileX = chunk.x * CHUNK_CONFIG.SIZE + neighborX;
		const globalTileY = chunk.y * CHUNK_CONFIG.SIZE + neighborY;

		const neighborChunk = this.getChunk(
			Math.floor(globalTileX / CHUNK_CONFIG.SIZE),
			Math.floor(globalTileY / CHUNK_CONFIG.SIZE)
		);

		if (!neighborChunk) return false;

		const localX = ((globalTileX % CHUNK_CONFIG.SIZE) + CHUNK_CONFIG.SIZE) % CHUNK_CONFIG.SIZE;
		const localY = ((globalTileY % CHUNK_CONFIG.SIZE) + CHUNK_CONFIG.SIZE) % CHUNK_CONFIG.SIZE;

		return neighborChunk.tiles[localX][localY] === tileType;
	}
}
