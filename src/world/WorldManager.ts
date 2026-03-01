import { Chunk, RegionType, CHUNK_CONFIG, TileType } from './Types';
import { VoidGenerator } from './generators/VoidGenerator';
import { RuinsGenerator } from './generators/RuinsGenerator';
import { BossAltarGenerator } from './generators/BossAltarGenerator';
import { eventBus } from '../events/EventBus';
import { SettlementGenerator } from './generators/SettlementGenerator';

/**
 * Менеджер мира: загрузка/выгрузка чанков, генерация по типу региона, координаты тайлов, проходимость, соседи, рейкаст.
 */
export class WorldManager {
	private chunks = new Map<string, Chunk>();

	private generators = {
		[RegionType.VOID]: new VoidGenerator(),
		[RegionType.RUINS]: new RuinsGenerator(),
		[RegionType.BOSS_ALTAR]: new BossAltarGenerator(),
		[RegionType.SETTLEMENT]: new SettlementGenerator()
	};

	/**
	 * Загружает чанки в радиусе от игрока и выгружает далёкие; испускает chunkUnloaded при выгрузке.
	 * @param playerX - Мировая X игрока
	 * @param playerY - Мировая Y игрока
	 * @param loadHalfDistanceX - Полуширина загрузки в чанках по X
	 * @param loadHalfDistanceY - Полувысота загрузки в чанках по Y
	 */
	update(playerX: number, playerY: number, loadHalfDistanceX: number, loadHalfDistanceY: number): void {
		const playerChunk = this.worldToChunk(playerX, playerY);

		for (let x = playerChunk.x - loadHalfDistanceX; x <= playerChunk.x + loadHalfDistanceX; x++) {
			for (let y = playerChunk.y - loadHalfDistanceY; y <= playerChunk.y + loadHalfDistanceY; y++) {
				this.loadChunk(x, y);
			}
		}

		for (const [key, chunk] of this.chunks.entries()) {
			const distanceX = Math.abs(chunk.x - playerChunk.x);
			const distanceY = Math.abs(chunk.y - playerChunk.y);

			if (distanceX > loadHalfDistanceX + 2 || distanceY > loadHalfDistanceY + 2) {
				this.chunks.delete(key);
				eventBus.emit('chunkUnloaded', { chunkX: chunk.x, chunkY: chunk.y });
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
		const distanceFromCenter = Math.sqrt(chunkX ** 2 + chunkY ** 2);
		if (distanceFromCenter < 3) return RegionType.VOID;

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

		return [RegionType.RUINS, RegionType.SETTLEMENT][Math.floor(Math.random()*2)];
	}

	/**
	 * Преобразует мировые координаты в координаты тайла и чанка.
	 * @param worldX - Мировая X
	 * @param worldY - Мировая Y
	 * @returns { chunkX, chunkY, tileX, tileY, globalTileX, globalTileY } или null, если вне загруженных чанков
	 */
	worldToGrid(worldX: number, worldY: number): { chunkX: number; chunkY: number; tileX: number; tileY: number; globalTileX: number; globalTileY: number } | null {
		const chunk = this.worldToChunk(worldX, worldY);
		const chunkData = this.getChunk(chunk.x, chunk.y);

		if (!chunkData) return null;

		const chunkWorldX = chunk.x * CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE;
		const chunkWorldY = chunk.y * CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE;

		const localX = Math.floor((worldX - chunkWorldX) / CHUNK_CONFIG.TILE_SIZE);
		const localY = Math.floor((worldY - chunkWorldY) / CHUNK_CONFIG.TILE_SIZE);

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

	/**
	 * Преобразует глобальные координаты тайла в мировые (верхний левый угол тайла).
	 * @param globalTileX - Глобальная X тайла
	 * @param globalTileY - Глобальная Y тайла
	 * @returns { x, y } в мировых координатах
	 */
	gridToWorld(globalTileX: number, globalTileY: number): { x: number; y: number } {
		const chunkX = Math.floor(globalTileX / CHUNK_CONFIG.SIZE);
		const chunkY = Math.floor(globalTileY / CHUNK_CONFIG.SIZE);

		let localX = globalTileX % CHUNK_CONFIG.SIZE;
		let localY = globalTileY % CHUNK_CONFIG.SIZE;

		if (localX < 0) localX += CHUNK_CONFIG.SIZE;
		if (localY < 0) localY += CHUNK_CONFIG.SIZE;

		return {
			x: chunkX * CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE + localX * CHUNK_CONFIG.TILE_SIZE,
			y: chunkY * CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE + localY * CHUNK_CONFIG.TILE_SIZE
		};
	}

	/**
	 * Проверяет, проходим ли тайл с заданными глобальными координатами.
	 * @param globalTileX - Глобальная X тайла
	 * @param globalTileY - Глобальная Y тайла
	 * @returns true, если тайл проходим
	 */
	isTilePassable(globalTileX: number, globalTileY: number): boolean {
		const chunkX = Math.floor(globalTileX / CHUNK_CONFIG.SIZE);
		const chunkY = Math.floor(globalTileY / CHUNK_CONFIG.SIZE);

		let localX = globalTileX % CHUNK_CONFIG.SIZE;
		let localY = globalTileY % CHUNK_CONFIG.SIZE;

		if (localX < 0) localX += CHUNK_CONFIG.SIZE;
		if (localY < 0) localY += CHUNK_CONFIG.SIZE;

		const chunk = this.getChunk(chunkX, chunkY);
		if (!chunk) return false;

		return chunk.passableGrid[localX]?.[localY] || false;
	}

	/**
	 * Проверяет, проходима ли мировая позиция (по соответствующему тайлу).
	 * @param worldX - Мировая X
	 * @param worldY - Мировая Y
	 * @returns true, если проходимо
	 */
	isWorldPositionPassable(worldX: number, worldY: number): boolean {
		const gridPos = this.worldToGrid(worldX, worldY);
		if (!gridPos) return false;
		return this.isTilePassable(gridPos.globalTileX, gridPos.globalTileY);
	}

	private worldToChunk(worldX: number, worldY: number) {
		const chunkX = Math.floor(worldX / (CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE));
		const chunkY = Math.floor(worldY / (CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE));

		return { x: chunkX, y: chunkY };
	}

	/**
	 * Возвращает чанк по координатам или null.
	 * @param chunkX - X чанка
	 * @param chunkY - Y чанка
	 * @returns Чанк или null
	 */
	getChunk(chunkX: number, chunkY: number): Chunk | null {
		return this.chunks.get(`${chunkX},${chunkY}`) || null;
	}

	/**
	 * Возвращает все загруженные чанки.
	 * @returns Массив чанков
	 */
	getActiveChunks(): Chunk[] {
		return Array.from(this.chunks.values());
	}

	/**
	 * Возвращает проходимых соседей тайла (8 направлений; диагональ только если оба ортогональных проходимы).
	 * @param globalTileX - Глобальная X тайла
	 * @param globalTileY - Глобальная Y тайла
	 * @returns Массив { x, y } глобальных координат соседних проходимых тайлов
	 */
	getPassableNeighbors(globalTileX: number, globalTileY: number): { x: number; y: number }[] {
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

	/**
	 * Возвращает индекс текстуры стены по битовой маске соседей того же типа (1=верх, 2=право, 4=низ, 8=лево).
	 * @param chunk - Чанк
	 * @param x - Локальная X тайла
	 * @param y - Локальная Y тайла
	 * @param tileType - Тип тайла стены
	 * @returns Индекс 0..15
	 */
	getWallTextureIndex(
		chunk: Chunk,
		x: number,
		y: number,
		tileType: TileType
	): number {
		const hasTop = this.hasWallNeighbor(chunk, x, y, 0, -1, tileType);
		const hasRight = this.hasWallNeighbor(chunk, x, y, 1, 0, tileType);
		const hasBottom = this.hasWallNeighbor(chunk, x, y, 0, 1, tileType);
		const hasLeft = this.hasWallNeighbor(chunk, x, y, -1, 0, tileType);

		let index = 0;
		if (hasTop) index |= 1;
		if (hasRight) index |= 2;
		if (hasBottom) index |= 4;
		if (hasLeft) index |= 8;

		return index;
	}

	/**
	 * Проверяет, есть ли у тайла (x, y) сосед (x+dx, y+dy) с заданным типом (в том числе в соседнем чанке).
	 * @param chunk - Чанк
	 * @param x - Локальная X
	 * @param y - Локальная Y
	 * @param dx - Смещение по X
	 * @param dy - Смещение по Y
	 * @param tileType - Тип тайла
	 * @returns true, если соседний тайл имеет тип tileType
	 */
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

		if (neighborX >= 0 && neighborX < CHUNK_CONFIG.SIZE &&
			neighborY >= 0 && neighborY < CHUNK_CONFIG.SIZE) {
			return chunk.tiles[neighborX][neighborY] === tileType;
		}

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

	/**
	 * Рейкаст: проверка отрезка на столкновение со стенами.
	 * @param startX - Начальная X
	 * @param startY - Начальная Y
	 * @param endX - Конечная X
	 * @param endY - Конечная Y
	 * @param maxDistance - Максимальная дистанция (опционально)
	 * @returns { hit, distance, point?, normal? }
	 */
	raycast(startX: number, startY: number, endX: number, endY: number, maxDistance?: number): {
		hit: boolean;
		distance: number;
		point?: { x: number; y: number };
		normal?: { x: number; y: number };
	} {
		const dx = endX - startX;
		const dy = endY - startY;
		const distance = Math.hypot(dx, dy);

		const actualDistance = maxDistance !== undefined ? Math.min(distance, maxDistance) : distance;

		if (actualDistance === 0) {
			return { hit: false, distance: 0 };
		}

		const steps = Math.ceil(actualDistance / 4);
		const stepX = dx / distance * 4;
		const stepY = dy / distance * 4;

		let prevX = startX;
		let prevY = startY;

		for (let i = 1; i <= steps; i++) {
			const x = startX + stepX * i;
			const y = startY + stepY * i;

			if (!this.isWorldPositionPassable(x, y)) {
				const gridPos = this.worldToGrid(x, y);
				if (gridPos) {
					const normal = this.getWallNormal(gridPos.globalTileX, gridPos.globalTileY);
					return {
						hit: true,
						distance: Math.hypot(prevX - startX, prevY - startY),
						point: { x: prevX, y: prevY },
						normal: normal
					};
				}
				return {
					hit: true,
					distance: Math.hypot(prevX - startX, prevY - startY),
					point: { x: prevX, y: prevY }
				};
			}

			prevX = x;
			prevY = y;
		}

		return {
			hit: false,
			distance: actualDistance
		};
	}

	/**
	 * Возвращает нормаль стены (направление от стены к проходимому соседу).
	 * @param globalTileX - Глобальная X тайла
	 * @param globalTileY - Глобальная Y тайла
	 * @returns { x, y } нормаль
	 */
	private getWallNormal(globalTileX: number, globalTileY: number): { x: number; y: number } {
		const hasLeft = this.isTilePassable(globalTileX - 1, globalTileY);
		const hasRight = this.isTilePassable(globalTileX + 1, globalTileY);
		const hasTop = this.isTilePassable(globalTileX, globalTileY - 1);
		const hasBottom = this.isTilePassable(globalTileX, globalTileY + 1);

		if (hasLeft && !hasRight) return { x: 1, y: 0 };
		if (hasRight && !hasLeft) return { x: -1, y: 0 };
		if (hasTop && !hasBottom) return { x: 0, y: 1 };
		if (hasBottom && !hasTop) return { x: 0, y: -1 };

		return { x: 0, y: -1 };
	}

	/**
	 * Проверяет видимость между двумя точками (нет стен на пути в пределах maxDistance).
	 * @param startX - Начальная X
	 * @param startY - Начальная Y
	 * @param endX - Конечная X
	 * @param endY - Конечная Y
	 * @param maxDistance - Максимальная дистанция (опционально)
	 * @returns true, если луч не упирается в стену или дистанция до препятствия >= длины отрезка − 5
	 */
	hasLineOfSight(startX: number, startY: number, endX: number, endY: number, maxDistance?: number): boolean {
		const result = this.raycast(startX, startY, endX, endY, maxDistance);
		if (!result.hit) return true;

		const totalDistance = Math.hypot(endX - startX, endY - startY);
		return result.distance >= totalDistance - 5;
	}
}
