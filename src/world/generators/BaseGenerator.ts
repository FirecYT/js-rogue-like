import { 
	OptimizedChunk, 
	TileType, 
	RegionType, 
	CHUNK_CONFIG,
	createOptimizedChunk,
	setTile,
	isPassable,
	buildPassableMask,
	StructureType,
	ChunkStructure
} from '../Types';

/**
 * Простой LCG-генератор псевдослучайных чисел для детерминированной генерации.
 * @remarks Используется вместо Math.random() для мультиплеера и воспроизводимости.
 */
export class SeededRandom {
	private seed: number;

	constructor(seed: number) {
		this.seed = seed >>> 0; // ensure unsigned 32-bit
	}

	/** Возвращает число [0, 1) */
	next(): number {
		// LCG parameters from Numerical Recipes
		this.seed = (1664525 * this.seed + 1013904223) >>> 0;
		return this.seed / 0x100000000;
	}

	/** Возвращает целое число [min, max) */
	nextInt(min: number, max: number): number {
		return Math.floor(this.next() * (max - min)) + min;
	}

	/** Возвращает элемент из массива случайным образом */
	choice<T>(arr: T[]): T {
		return arr[this.nextInt(0, arr.length)];
	}

	/** Перемешивает массив (алгоритм Фишера-Йетса) */
	shuffle<T>(arr: T[]): T[] {
		const result = [...arr];
		for (let i = result.length - 1; i > 0; i--) {
			const j = this.nextInt(0, i + 1);
			[result[i], result[j]] = [result[j], result[i]];
		}
		return result;
	}

	/** Возвращает новый экземпляр с форкнутым seed (для под-генераторов) */
	branch(offset: number): SeededRandom {
		return new SeededRandom((this.seed + offset * 2654435761) >>> 0);
	}

	/**
	 * Возвращает текущий seed генератора (публичный доступ для сериализации/мультиплеера).
	 * @remarks Используется для передачи seed в OptimizedChunk.
	 */
	getSeed(): number {
		return this.seed;
	}
}

/**
 * Базовый генератор оптимизированных чанков.
 * @remarks Предоставляет утилиты для работы с плоскими массивами и структурами.
 */
export abstract class BaseGenerator {
	/**
	 * Генерирует чанк по координатам.
	 * @param chunkX - X чанка
	 * @param chunkY - Y чанка
	 * @param seed - Seed для детерминированной генерации (опционально)
	 * @returns Оптимизированный чанк
	 */
	abstract generate(chunkX: number, chunkY: number, seed?: number): OptimizedChunk;

	/**
	 * Создаёт пустой проходимый чанк с заданным regionType.
	 * @param chunkX - X чанка
	 * @param chunkY - Y чанка
	 * @param regionType - Тип региона
	 * @param seed - Seed для генерации
	 */
	protected createEmptyChunk(
		chunkX: number,
		chunkY: number,
		regionType: RegionType,
		seed: number
	): OptimizedChunk {
		return createOptimizedChunk(chunkX, chunkY, regionType, seed);
	}

	/**
	 * Устанавливает тайл в чанке (с обновлением поколения и кэша).
	 * @param chunk - Чанк
	 * @param x - Локальная X
	 * @param y - Локальная Y
	 * @param tileType - Тип тайла
	 */
	protected setTile(chunk: OptimizedChunk, x: number, y: number, tileType: TileType): void {
		setTile(chunk, x, y, tileType, true);
	}

	/**
	 * Заполняет прямоугольную область тайлами.
	 * @param chunk - Чанк
	 * @param x - Начальная X
	 * @param y - Начальная Y
	 * @param w - Ширина
	 * @param h - Высота
	 * @param tileType - Тип тайла
	 * @param hollow - Если true, заполняет только границы (для комнат со стенами)
	 */
	protected fillRect(
		chunk: OptimizedChunk,
		x: number,
		y: number,
		w: number,
		h: number,
		tileType: TileType,
		hollow = false
	): void {
		for (let dx = 0; dx < w; dx++) {
			for (let dy = 0; dy < h; dy++) {
				if (hollow && dx > 0 && dx < w - 1 && dy > 0 && dy < h - 1) {
					continue; // пропускаем внутренность для полых прямоугольников
				}
				this.setTile(chunk, x + dx, y + dy, tileType);
			}
		}
	}

	/**
	 * Рисует линию между двумя точками (алгоритм Брезенхема).
	 * @param chunk - Чанк
	 * @param x0 - Начальная X
	 * @param y0 - Начальная Y
	 * @param x1 - Конечная X
	 * @param y1 - Конечная Y
	 * @param tileType - Тип тайла для линии
	 */
	protected drawLine(
		chunk: OptimizedChunk,
		x0: number,
		y0: number,
		x1: number,
		y1: number,
		tileType: TileType
	): void {
		const dx = Math.abs(x1 - x0);
		const dy = Math.abs(y1 - y0);
		let x = x0;
		let y = y0;
		const sx = x0 < x1 ? 1 : -1;
		const sy = y0 < y1 ? 1 : -1;
		let err = dx - dy;

		while (true) {
			this.setTile(chunk, x, y, tileType);
			if (x === x1 && y === y1) break;
			const e2 = 2 * err;
			if (e2 > -dy) { err -= dy; x += sx; }
			if (e2 < dx) { err += dx; y += sy; }
		}
	}

	/**
	 * Проверяет, проходим ли тайл (использует кэш/маску чанка).
	 * @param chunk - Чанк
	 * @param x - Локальная X
	 * @param y - Локальная Y
	 */
	protected isPassable(chunk: OptimizedChunk, x: number, y: number): boolean {
		return isPassable(chunk, x, y);
	}

	/**
	 * Создаёт структуру и добавляет её в чанк.
	 * @param chunk - Чанк
	 * @param type - Тип структуры
	 * @param bounds - Границы структуры
	 * @param metadata - Метаданные (опционально)
	 * @returns ID созданной структуры
	 */
	protected addStructure(
		chunk: OptimizedChunk,
		type: StructureType,
		bounds: { x: number; y: number; w: number; h: number },
		metadata: Record<string, unknown> = {}
	): string {
		const id = `${type}_${chunk.structures.length}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
		const structure: ChunkStructure = { id, type, bounds, metadata };
		chunk.structures.push(structure);
		return id;
	}

	/**
	 * Проверяет, пересекается ли прямоугольник с уже существующими структурами.
	 * @param chunk - Чанк
	 * @param x - Начальная X нового прямоугольника
	 * @param y - Начальная Y нового прямоугольника
	 * @param w - Ширина
	 * @param h - Высота
	 * @param padding - Дополнительный отступ для проверки
	 */
	protected overlapsStructures(
		chunk: OptimizedChunk,
		x: number,
		y: number,
		w: number,
		h: number,
		padding = 1
	): boolean {
		for (const struct of chunk.structures) {
			const sx = struct.bounds.x - padding;
			const sy = struct.bounds.y - padding;
			const sw = struct.bounds.w + padding * 2;
			const sh = struct.bounds.h + padding * 2;

			if (x < sx + sw && x + w > sx && y < sy + sh && y + h > sy) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Создаёт инициализированный генератор случайных чисел для чанка.
	 * @param chunkX - X чанка
	 * @param chunkY - Y чанка
	 * @param seed - Базовый seed (по умолчанию комбинация координат)
	 */
	protected createRng(chunkX: number, chunkY: number, seed?: number): SeededRandom {
		if (seed !== undefined) {
			return new SeededRandom(seed);
		}
		// Детерминированный seed из координат
		const combined = ((chunkX * 73856093) ^ (chunkY * 19349663)) >>> 0;
		return new SeededRandom(combined);
	}

	/**
	 * Преобразует мировые координаты в координаты чанка и локальные координаты тайла.
	 * @param worldX - Мировая координата X
	 * @param worldY - Мировая координата Y
	 * @param chunkSize - Размер чанка в тайлах (по умолчанию из CHUNK_CONFIG)
	 */
	protected worldToChunkPos(
		worldX: number,
		worldY: number,
		chunkSize = CHUNK_CONFIG.SIZE
	): { chunkX: number; chunkY: number; tileX: number; tileY: number } {
		const worldTileX = Math.floor(worldX / CHUNK_CONFIG.TILE_SIZE);
		const worldTileY = Math.floor(worldY / CHUNK_CONFIG.TILE_SIZE);
		
		return {
			chunkX: Math.floor(worldTileX / chunkSize),
			chunkY: Math.floor(worldTileY / chunkSize),
			tileX: ((worldTileX % chunkSize) + chunkSize) % chunkSize,
			tileY: ((worldTileY % chunkSize) + chunkSize) % chunkSize
		};
	}

	/**
	 * Преобразует координаты чанка и локального тайла в мировые координаты.
	 * @param chunkX - X чанка
	 * @param chunkY - Y чанка
	 * @param tileX - Локальная X тайла
	 * @param tileY - Локальная Y тайла
	 */
	protected chunkToWorldPos(
		chunkX: number,
		chunkY: number,
		tileX: number,
		tileY: number
	): { x: number; y: number } {
		return {
			x: (chunkX * CHUNK_CONFIG.SIZE + tileX) * CHUNK_CONFIG.TILE_SIZE,
			y: (chunkY * CHUNK_CONFIG.SIZE + tileY) * CHUNK_CONFIG.TILE_SIZE
		};
	}

	/**
	 * Финализирует чанк: строит passableMask, очищает кэш, инкрементирует generation.
	 * @param chunk - Чанк для финализации
	 * @param buildMask - Построить ли битовую маску проходимости
	 */
	protected finalizeChunk(chunk: OptimizedChunk, buildMask = true): void {
		if (buildMask) {
			chunk.passableMask = buildPassableMask(chunk);
		}
		chunk._passableCache?.clear();
		chunk.generation++;
	}
}
