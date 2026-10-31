import {
	BaseGenerator,
	createSeedFromCoords,
	SeededRandom,
} from '@firec/map-module';
import type { Chunk, BuildContext } from '@firec/map-module';
import { TILES } from '../Types';
import type { BiomeMap } from '../../services/BiomeMap';

/**
 * Конфигурация генерации руин.
 */
const RUINS_CONFIG = {
	/** Минимальное количество комнат в чанке */
	MIN_ROOMS: 1,
	/** Максимальное количество комнат в чанке */
	MAX_ROOMS: 8,
	/** Минимальный размер комнаты */
	MIN_ROOM_SIZE: 3,
	/** Максимальный размер комнаты */
	MAX_ROOM_SIZE: 7,
	/** Вероятность добавления обломков на пустой тайл */
	DEBRIS_CHANCE: 0.08,
	/** Вероятность добавления декоративной стены */
	DECOR_WALL_CHANCE: 0.15,
} as const;

/**
 * Комната — базовая структура для генерации руин.
 */
interface Room {
	x: number;
	y: number;
	w: number;
	h: number;
	centerX: number;
	centerY: number;
}

/**
 * Генератор руин: создаёт чанки с разрушенными зданиями, коридорами и обломками.
 */
export class RuinsGenerator extends BaseGenerator {
	readonly id = 'ruins';

	private readonly superChunckSize = 3;

	/**
	 * @param runSeed - Seed забега: руины уникальны на каждую партию
	 * @param biomeMap - Карта зон: плотность руин берётся из биома зоны
	 */
	constructor(
		private readonly runSeed: number,
		private readonly biomeMap: BiomeMap
	) {
		super();
	}

	protected buildChunk(chunk: Chunk, ctx: BuildContext): void {
		const superX = Math.floor(ctx.chunkX / this.superChunckSize);
		const superY = Math.floor(ctx.chunkY / this.superChunckSize);
		const superSeed = createSeedFromCoords(superX, superY, this.runSeed);
		const rng = new SeededRandom(superSeed);

		chunk.fill(TILES.FLOOR);

		// Биом центра суперчанка задаёт плотность руин зоны
		const biome = this.biomeMap.biomeAtChunk(
			superX * this.superChunckSize + 1,
			superY * this.superChunckSize + 1
		);

		// Шаг 1: Генерация комнат для всего суперчанка
		const rooms = this.generateSuperChunkRooms(
			chunk.size,
			rng,
			biome.ruinsDensity
		);

		// Шаг 2: Применение комнат к текущему чанку
		this.applyRoomsToChunk(chunk, rooms);

		// Шаг 3: Соединение комнат коридорами
		this.connectRooms(chunk, rooms, rng);

		// Шаг 4: Добавление декоративных элементов (стены, обломки)
		this.addDecorations(chunk, rng);
	}

	/**
	 * Генерирует комнаты для всего суперчанка.
	 * @param chunkSize - Размер одного чанка в тайлах
	 * @param rng - Генератор случайных чисел
	 * @returns Массив комнат в координатах суперчанка
	 */
	private generateSuperChunkRooms(
		chunkSize: number,
		rng: SeededRandom,
		density: number
	): Room[] {
		const superChunkTileSize = chunkSize * this.superChunckSize;

		const rooms: Room[] = [];
		const rawCount = rng.nextInt(
			RUINS_CONFIG.MIN_ROOMS,
			RUINS_CONFIG.MAX_ROOMS + 1
		);
		const roomCount = Math.max(1, Math.round(rawCount * density));

		while (rooms.length < roomCount) {
			// Случайный размер комнаты
			const w = rng.nextInt(
				RUINS_CONFIG.MIN_ROOM_SIZE,
				RUINS_CONFIG.MAX_ROOM_SIZE + 1
			);
			const h = rng.nextInt(
				RUINS_CONFIG.MIN_ROOM_SIZE,
				RUINS_CONFIG.MAX_ROOM_SIZE + 1
			);

			// Случайная позиция с отступом от краёв суперчанка
			const x = rng.nextInt(1, superChunkTileSize - w - 1);
			const y = rng.nextInt(1, superChunkTileSize - h - 1);

			rooms.push({
				x,
				y,
				w,
				h,
				centerX: x + Math.floor(w / 2),
				centerY: y + Math.floor(h / 2),
			});
		}

		return rooms;
	}

	/**
	 * Применяет комнаты к конкретному чанку (рисует пересекающиеся комнаты).
	 * @param chunk - Чанк для заполнения
	 * @param rooms - Массив комнат в координатах суперчанка
	 */
	private applyRoomsToChunk(chunk: Chunk, rooms: Room[]): void {
		const chunkInSuperX =
			((chunk.x % this.superChunckSize) + this.superChunckSize) %
			this.superChunckSize;
		const chunkInSuperY =
			((chunk.y % this.superChunckSize) + this.superChunckSize) %
			this.superChunckSize;

		const chunkMinX = chunkInSuperX * chunk.size;
		const chunkMinY = chunkInSuperY * chunk.size;
		const chunkMaxX = chunkMinX + chunk.size;
		const chunkMaxY = chunkMinY + chunk.size;

		for (const room of rooms) {
			const roomMinX = room.x;
			const roomMinY = room.y;
			const roomMaxX = room.x + room.w;
			const roomMaxY = room.y + room.h;

			// Проверяем пересечение комнаты с чанком
			const intersectMinX = Math.max(roomMinX, chunkMinX);
			const intersectMinY = Math.max(roomMinY, chunkMinY);
			const intersectMaxX = Math.min(roomMaxX, chunkMaxX);
			const intersectMaxY = Math.min(roomMaxY, chunkMaxY);

			// Если пересечения нет — пропускаем
			if (
				intersectMinX >= intersectMaxX ||
				intersectMinY >= intersectMaxY
			) {
				continue;
			}

			// Конвертируем глобальные координаты в локальные координаты чанка
			const localX = intersectMinX - chunkMinX;
			const localY = intersectMinY - chunkMinY;
			const localW = intersectMaxX - intersectMinX;
			const localH = intersectMaxY - intersectMinY;

			// Рисуем стены комнаты
			chunk.fillRect(localX, localY, localW, localH, TILES.WALL);

			// Рисуем пол внутри комнаты (если комната достаточно большая)
			if (localW > 2 && localH > 2) {
				chunk.fillRect(
					localX + 1,
					localY + 1,
					localW - 2,
					localH - 2,
					TILES.FLOOR
				);
			}
		}
	}

	/**
	 * Соединяет комнаты коридорами для обеспечения связности.
	 * @param chunk - Чанк
	 * @param rooms - Массив комнат
	 * @param rng - Генератор случайных чисел
	 */
	private connectRooms(chunk: Chunk, rooms: Room[], rng: SeededRandom): void {
		if (rooms.length < 2) return;

		// Простой алгоритм: соединяем каждую комнату со следующей
		// В продакшене можно использовать MST (Minimum Spanning Tree) для оптимальных связей
		for (let i = 0; i < rooms.length - 1; i++) {
			const roomA = rooms[i];
			const roomB = rooms[i + 1];

			// Случайная точка выхода из комнаты A
			const exitA = this.getRandomRoomEdge(roomA, rng);
			// Случайная точка входа в комнату B
			const entryB = this.getRandomRoomEdge(roomB, rng);

			// Рисуем коридор с возможными изгибами
			this.drawCorridor(chunk, exitA.x, exitA.y, entryB.x, entryB.y, rng);
		}
	}

	/**
	 * Возвращает случайную точку на границе комнаты (для входа/выхода).
	 * @param room - Комната
	 * @param rng - Генератор случайных чисел
	 */
	private getRandomRoomEdge(
		room: Room,
		rng: SeededRandom
	): { x: number; y: number } {
		const side = rng.nextInt(0, 4);
		switch (side) {
			case 0: // top
				return {
					x: rng.nextInt(room.x + 1, room.x + room.w - 1),
					y: room.y,
				};
			case 1: // right
				return {
					x: room.x + room.w - 1,
					y: rng.nextInt(room.y + 1, room.y + room.h - 1),
				};
			case 2: // bottom
				return {
					x: rng.nextInt(room.x + 1, room.x + room.w - 1),
					y: room.y + room.h - 1,
				};
			case 3: // left
			default:
				return {
					x: room.x,
					y: rng.nextInt(room.y + 1, room.y + room.h - 1),
				};
		}
	}

	/**
	 * Рисует коридор между двумя точками с возможными изгибами.
	 * @param chunk - Чанк
	 * @param x0 - Начальная точка X
	 * @param y0 - Начальная точка Y
	 * @param x1 - Конечная точка X
	 * @param y1 - Конечная точка Y
	 * @param rng - Генератор случайных чисел
	 */
	private drawCorridor(
		chunk: Chunk,
		x0: number,
		y0: number,
		x1: number,
		y1: number,
		rng: SeededRandom
	): void {
		// 50% шанс сделать коридор с изгибом (L-образный)
		if (rng.next() < 0.5) {
			// Сначала по горизонтали, потом по вертикали
			chunk.fillRect(x0, y0, x1, y0, TILES.FLOOR);
			chunk.fillRect(x1, y0, x1, y1, TILES.FLOOR);
		} else {
			// Сначала по вертикали, потом по горизонтали
			chunk.fillRect(x0, y0, x0, y1, TILES.FLOOR);
			chunk.fillRect(x0, y1, x1, y1, TILES.FLOOR);
		}
	}

	/**
	 * Добавляет декоративные элементы: обломки, разрушенные стены, украшения.
	 * @param chunk - Чанк
	 * @param rng - Генератор случайных чисел
	 */
	private addDecorations(chunk: Chunk, rng: SeededRandom): void {
		for (let x = 0; x < chunk.size; x++) {
			for (let y = 0; y < chunk.size; y++) {
				// Пропускаем уже занятые тайлы
				// if (!this.isPassable(chunk, x, y)) continue;

				// Обломки (камни)
				if (rng.next() < RUINS_CONFIG.DEBRIS_CHANCE) {
					chunk.setTile(x, y, TILES.ROCK);
					continue;
				}

				// Декоративные стены (разрушенные фрагменты)
				if (rng.next() < RUINS_CONFIG.DECOR_WALL_CHANCE) {
					// Проверяем, есть ли рядом стена для "прикрепления" фрагмента
					const hasWallNeighbor =
						chunk.getTile(x - 1, y) === TILES.WALL ||
						chunk.getTile(x + 1, y) === TILES.WALL ||
						chunk.getTile(x, y - 1) === TILES.WALL ||
						chunk.getTile(x, y + 1) === TILES.WALL;

					if (hasWallNeighbor) {
						chunk.setTile(x, y, TILES.WALL);
					}
				}
			}
		}
	}
}
