/**
 * Типы тайлов мира.
 * @remarks Значения 0-255, чтобы удобно хранить в Uint8Array
 */
export enum TileType {
	EMPTY = 0,
	WALL = 1,
	ROCK = 2,
	BUILDING = 3,
	WATER = 4,
}

/**
 * Типы регионов для генерации чанков.
 */
export enum RegionType {
	VOID = 'void',
	RUINS = 'ruins',
	BOSS_ALTAR = 'boss_altar',
	SETTLEMENT = 'settlement',
}

/**
 * Типы структур внутри чанка — «кирпичики» для процедурной генерации.
 */
export enum StructureType {
	ROOM = 'room',
	CORRIDOR = 'corridor',
	OBSTACLE_CLUSTER = 'obstacle_cluster',
	LOOT_ZONE = 'loot_zone',
	ENTRANCE = 'entrance',
	TRAP_AREA = 'trap_area',
	DECORATION = 'decoration',
}

/**
 * Структура внутри чанка: комната, коридор, зона с лутом и т.п.
 * Используется для логики генерации, навигации и сетевой синхронизации.
 */
export interface ChunkStructure {
	/** Уникальный идентификатор структуры (для мультиплеера и отладки) */
	id: string;
	/** Тип структуры */
	type: StructureType;
	/** Границы структуры в локальных координатах чанка */
	bounds: { x: number; y: number; w: number; h: number };
	/** Метаданные: сложность, лут-таблица, связи с другими структурами */
	metadata: {
		difficulty?: number;
		lootTable?: string;
		connections?: string[]; // IDs структур, к которым есть прямой проход
		seed?: number; // seed для внутренней генерации структуры
		[key: string]: unknown; // расширимость для будущих типов
	};
}

/**
 * Оптимизированный чанк мира.
 * @remarks Хранит данные в плоском буфере для экономии памяти и быстрого доступа.
 */
/**
 * Устаревший интерфейс чанка для обратной совместимости.
 * @deprecated Используется только для миграции старых данных.
 */
export interface LegacyChunk {
	x: number;
	y: number;
	tiles: TileType[][];
	regionType: RegionType;
	passableGrid: boolean[][];
	generation: number;
}

export interface OptimizedChunk {
	/** Координата чанка по оси X (в единицах чанков) */
	readonly x: number;
	/** Координата чанка по оси Y (в единицах чанков) */
	readonly y: number;
	/** Тип региона */
	readonly regionType: RegionType;
	/** Номер поколения — инкрементируется при любом изменении чанка (для инвалидации кэша) */
	generation: number;
	/** Seed для детерминированной генерации (важно для мультиплеера) */
	readonly seed: number;

	/** Плоский массив тайлов: индекс = x * SIZE + y, значение = TileType */
	tiles: Uint8Array;
	/** Размер чанка в тайлах (одна сторона, чанк квадратный) */
	readonly size: number;

	/** Структуры внутри чанка — для логики и процедурной генерации */
	structures: ChunkStructure[];

	/**
	 * Опциональная битовая маска проходимости: 1 бит на тайл.
	 * Если undefined — проходимость вычисляется на лету из tiles.
	 * @remarks Хранится как Uint8Array, где каждый байт = 8 тайлов по горизонтали.
	 * Индекс байта: Math.floor(y / 8), бит внутри: 1 << (y % 8)
	 */
	passableMask?: Uint8Array;

	/** Кэш для часто запрашиваемых проверок (опционально) */
	_passableCache?: Map<number, boolean>;
}

/**
 * Конфигурация чанков.
 * @remarks Размер уменьшен до 16×16 для оптимизации памяти и сетевой передачи.
 */
export const CHUNK_CONFIG = {
	/** Размер чанка в тайлах (одна сторона) */
	SIZE: 16,
	/** Размер тайла в пикселях */
	TILE_SIZE: 32,
	/** Полный размер чанка в пикселях */
	get FULL_SIZE(): number {
		return this.SIZE * this.TILE_SIZE;
	},
	/** Половина размера чанка в пикселях (для центрирования) */
	get HALF_SIZE(): number {
		return Math.floor(this.FULL_SIZE / 2);
	},
	/** Максимальное значение для TileType (для валидации) */
	MAX_TILE_TYPE: 255,
} as const;

// ============================================================================
// Утилиты для работы с OptimizedChunk
// ============================================================================

/**
 * Создаёт новый пустой оптимизированный чанк.
 * @param x - Координата чанка по X
 * @param y - Координата чанка по Y
 * @param regionType - Тип региона
 * @param seed - Seed для генерации (по умолчанию случайный)
 */
export function createOptimizedChunk(
	x: number,
	y: number,
	regionType: RegionType,
	seed = Math.floor(Math.random() * 0x7fffffff)
): OptimizedChunk {
	const size = CHUNK_CONFIG.SIZE;
	return {
		x,
		y,
		regionType,
		generation: 0,
		seed,
		tiles: new Uint8Array(size * size).fill(TileType.EMPTY),
		size,
		structures: [],
		passableMask: undefined,
		_passableCache: new Map(),
	};
}

/**
 * Получает тип тайла по локальным координатам.
 * @param chunk - Чанк
 * @param x - Локальная координата X (0..SIZE-1)
 * @param y - Локальная координата Y (0..SIZE-1)
 */
export function getTile(chunk: OptimizedChunk, x: number, y: number): TileType {
	if (x < 0 || x >= chunk.size || y < 0 || y >= chunk.size) {
		return TileType.EMPTY;
	}
	return chunk.tiles[x * chunk.size + y];
}

/**
 * Устанавливает тип тайла по локальным координатам.
 * @param chunk - Чанк
 * @param x - Локальная координата X
 * @param y - Локальная координата Y
 * @param tileType - Новый тип тайла
 * @param updateMask - Обновлять ли passableMask (по умолчанию true)
 */
export function setTile(
	chunk: OptimizedChunk,
	x: number,
	y: number,
	tileType: TileType,
	updateMask = true
): void {
	if (x < 0 || x >= chunk.size || y < 0 || y >= chunk.size) return;

	const index = x * chunk.size + y;
	if (chunk.tiles[index] !== tileType) {
		chunk.tiles[index] = tileType;
		chunk.generation++;
		chunk._passableCache?.clear();

		if (updateMask && chunk.passableMask) {
			updatePassableMask(chunk, x, y);
		}
	}
}

/**
 * Проверяет, проходим ли тайл.
 * @param chunk - Чанк
 * @param x - Локальная координата X
 * @param y - Локальная координата Y
 */
export function isPassable(
	chunk: OptimizedChunk,
	x: number,
	y: number
): boolean {
	if (x < 0 || x >= chunk.size || y < 0 || y >= chunk.size) return false;

	// Проверяем кэш
	const cacheKey = x * chunk.size + y;
	if (chunk._passableCache?.has(cacheKey)) {
		return chunk._passableCache.get(cacheKey) ?? true;
	}

	// Если есть битовая маска — используем её (TypeScript уже проверил выше, что она есть)
	if (chunk.passableMask) {
		const bytesPerRow = Math.ceil(chunk.size / 8);
		const byteIndex = Math.floor(y / 8);
		const bitIndex = y % 8;
		const maskIndex = x * bytesPerRow + byteIndex;
		const maskByte = chunk.passableMask[maskIndex];
		const isPass = (maskByte & (1 << bitIndex)) !== 0;
		chunk._passableCache?.set(cacheKey, isPass);
		return isPass;
	}

	// Иначе вычисляем из типа тайла
	const tileType = getTile(chunk, x, y);
	const passable = [
		TileType.EMPTY,
		TileType.ROCK,
		TileType.BUILDING,
	].includes(tileType);
	chunk._passableCache?.set(cacheKey, passable);
	return passable;
}

/**
 * Обновляет бит в passableMask для одного тайла.
 * @internal
 */
function updatePassableMask(chunk: OptimizedChunk, x: number, y: number): void {
	const mask = chunk.passableMask;
	if (!mask) return;

	const bytesPerRow = Math.ceil(chunk.size / 8);
	const byteIndex = Math.floor(y / 8);
	const bitIndex = y % 8;
	const maskIndex = x * bytesPerRow + byteIndex;

	const tileType = getTile(chunk, x, y);
	const isPassable = [
		TileType.EMPTY,
		TileType.ROCK,
		TileType.BUILDING,
	].includes(tileType);

	if (isPassable) {
		mask[maskIndex] |= 1 << bitIndex;
	} else {
		mask[maskIndex] &= ~(1 << bitIndex);
	}
}

/**
 * Создаёт битовую маску проходимости для чанка.
 * @param chunk - Чанк, для которого создать маску
 * @remarks Вызывать после генерации чанка, если планируется частая проверка проходимости.
 */
export function buildPassableMask(chunk: OptimizedChunk): Uint8Array {
	const bytesPerRow = Math.ceil(chunk.size / 8);
	const mask = new Uint8Array(chunk.size * bytesPerRow);

	for (let x = 0; x < chunk.size; x++) {
		for (let y = 0; y < chunk.size; y++) {
			const tileType = getTile(chunk, x, y);
			const isPass = [
				TileType.EMPTY,
				TileType.ROCK,
				TileType.BUILDING,
			].includes(tileType);
			if (isPass) {
				const byteIndex = Math.floor(y / 8);
				const bitIndex = y % 8;
				const maskIndex = x * bytesPerRow + byteIndex;
				mask[maskIndex] |= 1 << bitIndex;
			}
		}
	}

	return mask;
}

/**
 * Сериализует чанк в ArrayBuffer для сохранения или сетевой передачи.
 * @param chunk - Чанк для сериализации
 * @remarks Формат:
 * - 4 байта: x (int32)
 * - 4 байта: y (int32)
 * - 4 байта: regionType (как uint32, enum как строка хэшируется)
 * - 4 байта: generation (uint32)
 * - 4 байта: seed (uint32)
 * - 2 байта: size (uint16)
 * - N байт: tiles (Uint8Array, size*size)
 * - 2 байта: structuresCount (uint16)
 * - Для каждой структуры:
 *   - 16 байт: id (как 4x uint32, упрощённо)
 *   - 1 байт: type (enum index)
 *   - 8 байт: bounds (4x int16: x,y,w,h)
 *   - 4 байта: metadataLength (uint32)
 *   - M байт: metadata (JSON.stringify)
 * - 1 байт: hasPassableMask
 * - Если есть: passableMask.length (4 байта) + данные
 */
export function serializeChunk(chunk: OptimizedChunk): ArrayBuffer {
	const encoder = new TextEncoder();
	const regionTypeBytes = encoder.encode(chunk.regionType);

	// Простой хэш для regionType (в продакшене лучше использовать Map<string, number>)
	const regionTypeHash =
		[...regionTypeBytes].reduce((a, b) => (a << 5) - a + b, 0) >>> 0;

	// Считаем размер структур
	const structuresData: Uint8Array[] = [];
	for (const s of chunk.structures) {
		const idBytes = encoder.encode(s.id.padEnd(16, '\0').slice(0, 16));
		const typeIndex = Object.values(StructureType).indexOf(s.type);
		const bounds = new Int16Array([
			s.bounds.x,
			s.bounds.y,
			s.bounds.w,
			s.bounds.h,
		]);
		const metaJson = JSON.stringify(s.metadata);
		const metaBytes = encoder.encode(metaJson);

		const structBuf = new ArrayBuffer(16 + 1 + 8 + 4 + metaBytes.length);
		const structView = new DataView(structBuf);

		new Uint8Array(structBuf, 0, 16).set(idBytes);
		structView.setUint8(16, typeIndex);
		structView.setInt16(17, bounds[0], true);
		structView.setInt16(19, bounds[1], true);
		structView.setInt16(21, bounds[2], true);
		structView.setInt16(23, bounds[3], true);
		structView.setUint32(25, metaBytes.length, true);
		new Uint8Array(structBuf, 29).set(metaBytes);

		structuresData.push(new Uint8Array(structBuf));
	}
	const structuresTotalSize = structuresData.reduce(
		(sum, arr) => sum + arr.length,
		0
	);

	// Считаем общий размер
	const hasMask = !!chunk.passableMask;
	const maskSize = chunk.passableMask ? 4 + chunk.passableMask.length : 0;

	const totalSize =
		4 +
		4 +
		4 +
		4 +
		4 +
		2 + // header: x,y,region,gen,seed,size
		chunk.tiles.length + // tiles
		2 +
		structuresTotalSize + // structures count + data
		1 +
		maskSize; // hasMask + mask data

	const buffer = new ArrayBuffer(totalSize);
	const view = new DataView(buffer);
	let offset = 0;

	view.setInt32(offset, chunk.x, true);
	offset += 4;
	view.setInt32(offset, chunk.y, true);
	offset += 4;
	view.setUint32(offset, regionTypeHash, true);
	offset += 4;
	view.setUint32(offset, chunk.generation, true);
	offset += 4;
	view.setUint32(offset, chunk.seed, true);
	offset += 4;
	view.setUint16(offset, chunk.size, true);
	offset += 2;

	new Uint8Array(buffer, offset, chunk.tiles.length).set(chunk.tiles);
	offset += chunk.tiles.length;

	view.setUint16(offset, chunk.structures.length, true);
	offset += 2;
	for (const structData of structuresData) {
		new Uint8Array(buffer, offset, structData.length).set(structData);
		offset += structData.length;
	}

	view.setUint8(offset, hasMask ? 1 : 0);
	offset += 1;
	if (hasMask && chunk.passableMask) {
		view.setUint32(offset, chunk.passableMask.length, true);
		offset += 4;
		new Uint8Array(buffer, offset, chunk.passableMask.length).set(
			chunk.passableMask
		);
	}

	return buffer;
}

/**
 * Десериализует ArrayBuffer обратно в OptimizedChunk.
 * @param buffer - ArrayBuffer с данными чанка
 * @param regionTypeMap - Опциональная маппинг хэшей regionType обратно в строки
 */
export function deserializeChunk(
	buffer: ArrayBuffer,
	regionTypeMap?: Map<number, RegionType>
): OptimizedChunk {
	const decoder = new TextDecoder();
	const view = new DataView(buffer);
	let offset = 0;

	const x = view.getInt32(offset, true);
	offset += 4;
	const y = view.getInt32(offset, true);
	offset += 4;
	const regionTypeHash = view.getUint32(offset, true);
	offset += 4;
	const generation = view.getUint32(offset, true);
	offset += 4;
	const seed = view.getUint32(offset, true);
	offset += 4;
	const size = view.getUint16(offset, true);
	offset += 2;

	const tiles = new Uint8Array(buffer, offset, size * size);
	offset += size * size;

	const structuresCount = view.getUint16(offset, true);
	offset += 2;
	const structures: ChunkStructure[] = [];

	for (let i = 0; i < structuresCount; i++) {
		const idBytes = new Uint8Array(buffer, offset, 16);
		const id = decoder.decode(idBytes).replace(/\0+$/, '');
		offset += 16;

		const typeIndex = view.getUint8(offset);
		offset += 1;
		const type = Object.values(StructureType)[typeIndex] as StructureType;

		const bounds = {
			x: view.getInt16(offset, true),
			y: view.getInt16(offset + 2, true),
			w: view.getInt16(offset + 4, true),
			h: view.getInt16(offset + 6, true),
		};
		offset += 8;

		const metaLength = view.getUint32(offset, true);
		offset += 4;
		const metaJson = decoder.decode(
			new Uint8Array(buffer, offset, metaLength)
		);
		offset += metaLength;

		structures.push({ id, type, bounds, metadata: JSON.parse(metaJson) });
	}

	const hasMask = view.getUint8(offset) === 1;
	offset += 1;
	let passableMask: Uint8Array | undefined;
	if (hasMask) {
		const maskLength = view.getUint32(offset, true);
		offset += 4;
		passableMask = new Uint8Array(buffer, offset, maskLength);
		offset += maskLength;
	}

	const regionType = regionTypeMap?.get(regionTypeHash) ?? RegionType.VOID;

	return {
		x,
		y,
		regionType,
		generation,
		seed,
		tiles,
		size,
		structures,
		passableMask,
		_passableCache: new Map(),
	};
}

// ============================================================================
// Обратная совместимость: адаптеры для старого API
// ============================================================================

/**
 * Конвертирует старый Chunk в новый OptimizedChunk.
 * @param oldChunk - Чанк в старом формате
 * @deprecated Использовать только для миграции
 */
export function migrateChunk(oldChunk: LegacyChunk): OptimizedChunk {
	const newChunk = createOptimizedChunk(
		oldChunk.x,
		oldChunk.y,
		oldChunk.regionType
	);

	// Копируем тайлы
	for (let x = 0; x < CHUNK_CONFIG.SIZE; x++) {
		for (let y = 0; y < CHUNK_CONFIG.SIZE; y++) {
			setTile(newChunk, x, y, oldChunk.tiles[x][y], false);
		}
	}

	// Строим маску из старого passableGrid
	newChunk.passableMask = buildPassableMask(newChunk);
	newChunk.generation = oldChunk.generation;

	return newChunk;
}

/**
 * Конвертирует OptimizedChunk в старый формат (для обратной совместимости).
 * @param chunk - Оптимизированный чанк
 * @deprecated Использовать только временно, пока не обновлены все модули
 */
export function toLegacyChunk(chunk: OptimizedChunk): LegacyChunk {
	const tiles: TileType[][] = [];
	const passableGrid: boolean[][] = [];

	for (let x = 0; x < chunk.size; x++) {
		tiles[x] = [];
		passableGrid[x] = [];
		for (let y = 0; y < chunk.size; y++) {
			tiles[x][y] = getTile(chunk, x, y);
			passableGrid[x][y] = isPassable(chunk, x, y);
		}
	}

	return {
		x: chunk.x,
		y: chunk.y,
		tiles,
		regionType: chunk.regionType,
		passableGrid,
		generation: chunk.generation,
	};
}
