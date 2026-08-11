import {
	OptimizedChunk,
	RegionType,
	CHUNK_CONFIG,
	TileType,
	getTile,
	isPassable,
	serializeChunk,
	deserializeChunk,
} from './Types';
import { VoidGenerator } from './generators/VoidGenerator';
import { RuinsGenerator } from './generators/RuinsGenerator';
import { BossAltarGenerator } from './generators/BossAltarGenerator';
import { eventBus } from '../events/EventBus';
import { SettlementGenerator } from './generators/SettlementGenerator';

/**
 * Менеджер мира: загрузка/выгрузка чанков, генерация по типу региона,
 * координаты тайлов, проходимость, соседи, рейкаст.
 * @remarks Работает с OptimizedChunk для оптимизации памяти и поддержки мультиплеера.
 */
export class WorldManager {
	private chunks = new Map<string, OptimizedChunk>();

	private generators = {
		[RegionType.VOID]: new VoidGenerator(),
		[RegionType.RUINS]: new RuinsGenerator(),
		[RegionType.BOSS_ALTAR]: new BossAltarGenerator(),
		[RegionType.SETTLEMENT]: new SettlementGenerator(),
	};

	/**
	 * Загружает чанки в радиусе от игрока и выгружает далёкие.
	 * @param playerX - Мировая X игрока
	 * @param playerY - Мировая Y игрока
	 * @param loadHalfDistanceX - Полуширина загрузки в чанках по X
	 * @param loadHalfDistanceY - Полувысота загрузки в чанках по Y
	 * @emits chunkUnloaded при выгрузке чанка
	 */
	update(
		playerX: number,
		playerY: number,
		loadHalfDistanceX: number,
		loadHalfDistanceY: number
	): void {
		const playerChunk = this.worldToChunk(playerX, playerY);

		// Загрузка чанков в радиусе
		for (
			let x = playerChunk.x - loadHalfDistanceX;
			x <= playerChunk.x + loadHalfDistanceX;
			x++
		) {
			for (
				let y = playerChunk.y - loadHalfDistanceY;
				y <= playerChunk.y + loadHalfDistanceY;
				y++
			) {
				this.loadChunk(x, y);
			}
		}

		// Выгрузка далёких чанков
		for (const [key, chunk] of this.chunks.entries()) {
			const distanceX = Math.abs(chunk.x - playerChunk.x);
			const distanceY = Math.abs(chunk.y - playerChunk.y);

			if (
				distanceX > loadHalfDistanceX + 2 ||
				distanceY > loadHalfDistanceY + 2
			) {
				this.chunks.delete(key);
				eventBus.emit('chunkUnloaded', {
					chunkX: chunk.x,
					chunkY: chunk.y,
				});
			}
		}
	}

	/**
	 * Загружает или генерирует чанк по координатам.
	 * @param chunkX - X чанка
	 * @param chunkY - Y чанка
	 */
	private loadChunk(chunkX: number, chunkY: number) {
		const key = `${chunkX},${chunkY}`;

		if (this.chunks.has(key)) return;

		const regionType = this.getRegionType(chunkX, chunkY);
		const generator = this.generators[regionType];

		// Генерация с детерминированным seed для мультиплеера
		const seed = this.getChunkSeed(chunkX, chunkY);
		const chunk = generator.generate(chunkX, chunkY, seed);

		this.chunks.set(key, chunk);
	}

	/**
	 * Вычисляет детерминированный seed для чанка по его координатам.
	 * @param chunkX - X чанка
	 * @param chunkY - Y чанка
	 * @returns Seed для генерации
	 */
	private getChunkSeed(chunkX: number, chunkY: number): number {
		// Простой хэш координат для детерминированной генерации
		// В продакшене можно использовать более надёжный алгоритм
		return ((chunkX * 73856093) ^ (chunkY * 19349663) ^ 0x9e3779b9) >>> 0;
	}

	/**
	 * Определяет тип региона для чанка по его координатам.
	 * @param chunkX - X чанка
	 * @param chunkY - Y чанка
	 * @returns Тип региона
	 */
	private getRegionType(chunkX: number, chunkY: number): RegionType {
		if (Math.abs(chunkX) < 2) return RegionType.VOID;
		if (Math.abs(chunkY) < 2) return RegionType.VOID;

		const distanceFromCenter = Math.sqrt(chunkX ** 2 + chunkY ** 2);
		if (distanceFromCenter < 3) return RegionType.VOID;

		const bossAltars = [
			{ x: 3, y: 0 },
			{ x: 0, y: 3 },
			{ x: -3, y: 0 },
			{ x: 0, y: -3 },
			{ x: 16, y: 16 },
		];

		for (const altar of bossAltars) {
			if (chunkX === altar.x && chunkY === altar.y) {
				return RegionType.BOSS_ALTAR;
			}
		}

		// Детерминированный выбор между RUINS и SETTLEMENT
		const seed = this.getChunkSeed(chunkX, chunkY);
		return [RegionType.RUINS, RegionType.SETTLEMENT][
			seed % 2
		] as RegionType;
	}

	/**
	 * Преобразует мировые координаты в координаты тайла и чанка.
	 * @param worldX - Мировая координата X
	 * @param worldY - Мировая координата Y
	 * @returns Объект с координатами или null, если чанк не загружен
	 */
	worldToGrid(
		worldX: number,
		worldY: number
	): {
		chunkX: number;
		chunkY: number;
		tileX: number;
		tileY: number;
		globalTileX: number;
		globalTileY: number;
	} | null {
		const chunk = this.worldToChunk(worldX, worldY);
		const chunkData = this.getChunk(chunk.x, chunk.y);

		if (!chunkData) return null;

		const chunkWorldX =
			chunk.x * CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE;
		const chunkWorldY =
			chunk.y * CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE;

		const localX = Math.floor(
			(worldX - chunkWorldX) / CHUNK_CONFIG.TILE_SIZE
		);
		const localY = Math.floor(
			(worldY - chunkWorldY) / CHUNK_CONFIG.TILE_SIZE
		);

		if (
			localX < 0 ||
			localX >= CHUNK_CONFIG.SIZE ||
			localY < 0 ||
			localY >= CHUNK_CONFIG.SIZE
		) {
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
			globalTileY,
		};
	}

	/**
	 * Преобразует глобальные координаты тайла в мировые координаты (верхний левый угол).
	 * @param globalTileX - Глобальная координата тайла по X
	 * @param globalTileY - Глобальная координата тайла по Y
	 * @returns Мировые координаты { x, y }
	 */
	gridToWorld(
		globalTileX: number,
		globalTileY: number
	): { x: number; y: number } {
		const chunkX = Math.floor(globalTileX / CHUNK_CONFIG.SIZE);
		const chunkY = Math.floor(globalTileY / CHUNK_CONFIG.SIZE);

		let localX = globalTileX % CHUNK_CONFIG.SIZE;
		let localY = globalTileY % CHUNK_CONFIG.SIZE;

		if (localX < 0) localX += CHUNK_CONFIG.SIZE;
		if (localY < 0) localY += CHUNK_CONFIG.SIZE;

		return {
			x:
				chunkX * CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE +
				localX * CHUNK_CONFIG.TILE_SIZE,
			y:
				chunkY * CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE +
				localY * CHUNK_CONFIG.TILE_SIZE,
		};
	}

	/**
	 * Проверяет, проходим ли тайл с заданными глобальными координатами.
	 * @param globalTileX - Глобальная координата тайла по X
	 * @param globalTileY - Глобальная координата тайла по Y
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

		return isPassable(chunk, localX, localY);
	}

	/**
	 * Проверяет, проходима ли мировая позиция (по соответствующему тайлу).
	 * @param worldX - Мировая координата X
	 * @param worldY - Мировая координата Y
	 * @returns true, если позиция проходима
	 */
	isWorldPositionPassable(worldX: number, worldY: number): boolean {
		const gridPos = this.worldToGrid(worldX, worldY);
		if (!gridPos) return false;
		return this.isTilePassable(gridPos.globalTileX, gridPos.globalTileY);
	}

	/**
	 * Преобразует мировые координаты в координаты чанка.
	 * @param worldX - Мировая координата X
	 * @param worldY - Мировая координата Y
	 * @returns Координаты чанка { x, y }
	 */
	private worldToChunk(worldX: number, worldY: number) {
		const chunkX = Math.floor(
			worldX / (CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE)
		);
		const chunkY = Math.floor(
			worldY / (CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE)
		);

		return { x: chunkX, y: chunkY };
	}

	/**
	 * Возвращает чанк по координатам или null.
	 * @param chunkX - X чанка
	 * @param chunkY - Y чанка
	 * @returns Чанк или null
	 */
	getChunk(chunkX: number, chunkY: number): OptimizedChunk | null {
		return this.chunks.get(`${chunkX},${chunkY}`) || null;
	}

	/**
	 * Возвращает все загруженные чанки.
	 * @returns Массив оптимизированных чанков
	 */
	getActiveChunks(): OptimizedChunk[] {
		return Array.from(this.chunks.values());
	}

	/**
	 * Возвращает проходимых соседей тайла (8 направлений).
	 * @param globalTileX - Глобальная координата тайла по X
	 * @param globalTileY - Глобальная координата тайла по Y
	 * @returns Массив координат проходимых соседних тайлов
	 * @remarks Диагональные соседи возвращаются только если оба ортогональных соседа проходимы
	 */
	getPassableNeighbors(
		globalTileX: number,
		globalTileY: number
	): { x: number; y: number }[] {
		const neighbors: { x: number; y: number }[] = [];
		const directions = [
			{ dx: -1, dy: 0 },
			{ dx: 1, dy: 0 },
			{ dx: 0, dy: -1 },
			{ dx: 0, dy: 1 },
			{ dx: -1, dy: -1 },
			{ dx: 1, dy: -1 },
			{ dx: -1, dy: 1 },
			{ dx: 1, dy: 1 },
		];

		for (const dir of directions) {
			const newX = globalTileX + dir.dx;
			const newY = globalTileY + dir.dy;

			// Для диагоналей: проверяем, что оба ортогональных соседа проходимы
			if (dir.dx !== 0 && dir.dy !== 0) {
				const horX = globalTileX + dir.dx;
				const horY = globalTileY;
				const verX = globalTileX;
				const verY = globalTileY + dir.dy;
				if (
					!this.isTilePassable(horX, horY) ||
					!this.isTilePassable(verX, verY)
				) {
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
	 * Возвращает индекс текстуры стены по битовой маске соседей того же типа.
	 * @param chunk - Чанк
	 * @param x - Локальная координата тайла по X
	 * @param y - Локальная координата тайла по Y
	 * @param tileType - Тип тайла стены
	 * @returns Индекс 0..15 для авто-тайлинга
	 * @remarks Биты: 1=верх, 2=право, 4=низ, 8=лево
	 */
	getWallTextureIndex(
		chunk: OptimizedChunk,
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
	 * Проверяет, есть ли у тайла сосед с заданным типом (в том числе в соседнем чанке).
	 * @param chunk - Чанк
	 * @param x - Локальная координата тайла по X
	 * @param y - Локальная координата тайла по Y
	 * @param dx - Смещение по оси X
	 * @param dy - Смещение по оси Y
	 * @param tileType - Тип тайла для проверки
	 * @returns true, если соседний тайл имеет указанный тип
	 */
	hasWallNeighbor(
		chunk: OptimizedChunk,
		x: number,
		y: number,
		dx: number,
		dy: number,
		tileType: TileType
	): boolean {
		const neighborX = x + dx;
		const neighborY = y + dy;

		// Проверка в пределах текущего чанка
		if (
			neighborX >= 0 &&
			neighborX < CHUNK_CONFIG.SIZE &&
			neighborY >= 0 &&
			neighborY < CHUNK_CONFIG.SIZE
		) {
			return getTile(chunk, neighborX, neighborY) === tileType;
		}

		// Проверка в соседнем чанке
		const globalTileX = chunk.x * CHUNK_CONFIG.SIZE + neighborX;
		const globalTileY = chunk.y * CHUNK_CONFIG.SIZE + neighborY;

		const neighborChunk = this.getChunk(
			Math.floor(globalTileX / CHUNK_CONFIG.SIZE),
			Math.floor(globalTileY / CHUNK_CONFIG.SIZE)
		);

		if (!neighborChunk) return false;

		const localX =
			((globalTileX % CHUNK_CONFIG.SIZE) + CHUNK_CONFIG.SIZE) %
			CHUNK_CONFIG.SIZE;
		const localY =
			((globalTileY % CHUNK_CONFIG.SIZE) + CHUNK_CONFIG.SIZE) %
			CHUNK_CONFIG.SIZE;

		return getTile(neighborChunk, localX, localY) === tileType;
	}

	/**
	 * Рейкаст: проверка отрезка на столкновение со стенами.
	 * @param startX - Начальная координата по оси X
	 * @param startY - Начальная координата по оси Y
	 * @param endX - Конечная координата по оси X
	 * @param endY - Конечная координата по оси Y
	 * @param maxDistance - Максимальная дистанция проверки (опционально)
	 * @returns Результат рейкаста: был ли хит, дистанция, точка и нормаль
	 */
	raycast(
		startX: number,
		startY: number,
		endX: number,
		endY: number,
		maxDistance?: number
	): {
		hit: boolean;
		distance: number;
		point?: { x: number; y: number };
		normal?: { x: number; y: number };
	} {
		const dx = endX - startX;
		const dy = endY - startY;
		const distance = Math.hypot(dx, dy);

		const actualDistance =
			maxDistance !== undefined
				? Math.min(distance, maxDistance)
				: distance;

		if (actualDistance === 0) {
			return { hit: false, distance: 0 };
		}

		// Шаг 4 пикселя для баланса точности и производительности
		const steps = Math.ceil(actualDistance / 4);
		const stepX = (dx / distance) * 4;
		const stepY = (dy / distance) * 4;

		let prevX = startX;
		let prevY = startY;

		for (let i = 1; i <= steps; i++) {
			const x = startX + stepX * i;
			const y = startY + stepY * i;

			if (!this.isWorldPositionPassable(x, y)) {
				const gridPos = this.worldToGrid(x, y);
				if (gridPos) {
					const normal = this.getWallNormal(
						gridPos.globalTileX,
						gridPos.globalTileY
					);
					return {
						hit: true,
						distance: Math.hypot(prevX - startX, prevY - startY),
						point: { x: prevX, y: prevY },
						normal: normal,
					};
				}
				return {
					hit: true,
					distance: Math.hypot(prevX - startX, prevY - startY),
					point: { x: prevX, y: prevY },
				};
			}

			prevX = x;
			prevY = y;
		}

		return {
			hit: false,
			distance: actualDistance,
		};
	}

	/**
	 * Возвращает нормаль стены (направление от стены к проходимому соседу).
	 * @param globalTileX - Глобальная координата тайла по оси X
	 * @param globalTileY - Глобальная координата тайла по оси Y
	 * @returns Нормаль как вектор { x, y }
	 */
	private getWallNormal(
		globalTileX: number,
		globalTileY: number
	): { x: number; y: number } {
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
	 * Проверяет видимость между двумя точками (нет стен на пути).
	 * @param startX - Начальная координата по оси X
	 * @param startY - Начальная координата по оси Y
	 * @param endX - Конечная координата по оси X
	 * @param endY - Конечная координата по оси Y
	 * @param maxDistance - Максимальная дистанция проверки (опционально)
	 * @returns true, если линия видимости не прерывается стеной
	 */
	hasLineOfSight(
		startX: number,
		startY: number,
		endX: number,
		endY: number,
		maxDistance?: number
	): boolean {
		const result = this.raycast(startX, startY, endX, endY, maxDistance);
		if (!result.hit) return true;

		const totalDistance = Math.hypot(endX - startX, endY - startY);
		return result.distance >= totalDistance - 5;
	}

	// ========================================================================
	// Методы для мультиплеера и сериализации
	// ========================================================================

	/**
	 * Сериализует все активные чанки для отправки клиенту.
	 * @returns Объект с сериализованными данными чанков
	 * @remarks Используется для синхронизации мира в мультиплеере
	 */
	serializeActiveChunks(): Record<string, ArrayBuffer> {
		const result: Record<string, ArrayBuffer> = {};
		for (const [key, chunk] of this.chunks.entries()) {
			result[key] = serializeChunk(chunk);
		}
		return result;
	}

	/**
	 * Десериализует и добавляет чанк из полученных данных.
	 * @param key - Ключ чанка в формате "x,y"
	 * @param buffer - ArrayBuffer с данными чанка
	 * @returns true, если чанк успешно добавлен
	 */
	deserializeAndAddChunk(key: string, buffer: ArrayBuffer): boolean {
		try {
			const chunk = deserializeChunk(buffer);
			this.chunks.set(key, chunk);
			return true;
		} catch (e) {
			console.error('Failed to deserialize chunk', key, e);
			return false;
		}
	}

	/**
	 * Получает структуры в заданной области чанка.
	 * @param chunk - Чанк для поиска
	 * @param x - Локальная координата по оси X
	 * @param y - Локальная координата по оси Y
	 * @returns Массив структур, содержащих точку (или пересекающих её)
	 */
	getStructuresAt(chunk: OptimizedChunk, x: number, y: number) {
		return chunk.structures.filter(
			(s) =>
				x >= s.bounds.x &&
				x < s.bounds.x + s.bounds.w &&
				y >= s.bounds.y &&
				y < s.bounds.y + s.bounds.h
		);
	}
}
