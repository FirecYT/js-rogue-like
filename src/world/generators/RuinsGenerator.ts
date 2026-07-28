import { BaseGenerator, SeededRandom } from './BaseGenerator';
import { OptimizedChunk, TileType, RegionType, CHUNK_CONFIG, StructureType } from '../Types';

/**
 * Конфигурация генерации руин.
 */
const RUINS_CONFIG = {
	/** Минимальное количество комнат в чанке */
	MIN_ROOMS: 1,
	/** Максимальное количество комнат в чанке */
	MAX_ROOMS: 4,
	/** Минимальный размер комнаты */
	MIN_ROOM_SIZE: 3,
	/** Максимальный размер комнаты */
	MAX_ROOM_SIZE: 7,
	/** Вероятность добавления обломков на пустой тайл */
	DEBRIS_CHANCE: 0.08,
	/** Вероятность добавления декоративной стены */
	DECOR_WALL_CHANCE: 0.15,
	/** Минимальная длина коридора */
	MIN_CORRIDOR_LENGTH: 2,
	/** Максимальная длина коридора */
	MAX_CORRIDOR_LENGTH: 8
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
	structureId: string;
}

/**
 * Генератор руин: создаёт чанки с разрушенными зданиями, коридорами и обломками.
 * @remarks Использует структуры для логической группировки элементов и детерминированную генерацию.
 */
export class RuinsGenerator extends BaseGenerator {
	/**
	 * Генерирует чанк с руинами.
	 * @param chunkX - X чанка
	 * @param chunkY - Y чанка
	 * @param seed - Seed для детерминированной генерации (опционально)
	 * @returns Оптимизированный чанк с руинами
	 */
	generate(chunkX: number, chunkY: number, seed?: number): OptimizedChunk {
		const rng = this.createRng(chunkX, chunkY, seed);
		const chunk = this.createEmptyChunk(chunkX, chunkY, RegionType.RUINS, rng.getSeed());

		// Шаг 1: Генерация комнат (основные структуры)
		const rooms = this.generateRooms(chunk, rng);
		
		// Шаг 2: Соединение комнат коридорами
		this.connectRooms(chunk, rooms, rng);
		
		// Шаг 3: Добавление декоративных элементов (стены, обломки)
		this.addDecorations(chunk, rng);
		
		// Шаг 4: Добавление зон с лутом и триггеров
		this.addLootZones(chunk, rooms, rng);
		
		// Шаг 5: Финализация (построение маски, очистка кэша)
		this.finalizeChunk(chunk, true);

		return chunk;
	}

	/**
	 * Генерирует комнаты внутри чанка.
	 * @param chunk - Чанк для заполнения
	 * @param rng - Генератор случайных чисел
	 * @returns Массив созданных комнат
	 */
	private generateRooms(chunk: OptimizedChunk, rng: SeededRandom): Room[] {
		const rooms: Room[] = [];
		const roomCount = rng.nextInt(RUINS_CONFIG.MIN_ROOMS, RUINS_CONFIG.MAX_ROOMS + 1);
		const maxAttempts = roomCount * 10;
		let attempts = 0;

		while (rooms.length < roomCount && attempts < maxAttempts) {
			attempts++;
			
			// Случайный размер комнаты
			const w = rng.nextInt(RUINS_CONFIG.MIN_ROOM_SIZE, RUINS_CONFIG.MAX_ROOM_SIZE + 1);
			const h = rng.nextInt(RUINS_CONFIG.MIN_ROOM_SIZE, RUINS_CONFIG.MAX_ROOM_SIZE + 1);
			
			// Случайная позиция с отступом от краёв
			const x = rng.nextInt(1, CHUNK_CONFIG.SIZE - w - 1);
			const y = rng.nextInt(1, CHUNK_CONFIG.SIZE - h - 1);

			// Проверка на пересечение с существующими структурами
			if (this.overlapsStructures(chunk, x, y, w, h, 2)) {
				continue;
			}

			// Создаём комнату: стены по краям, пустота внутри
			this.fillRect(chunk, x, y, w, h, TileType.WALL, true);
			
			// Создаём структуру комнаты
			const structureId = this.addStructure(chunk, StructureType.ROOM, { x, y, w, h }, {
				seed: rng.nextInt(0, 0x7FFFFFFF),
				difficulty: rng.nextInt(1, 5)
			});

			rooms.push({
				x, y, w, h,
				centerX: x + Math.floor(w / 2),
				centerY: y + Math.floor(h / 2),
				structureId
			});
		}

		return rooms;
	}

	/**
	 * Соединяет комнаты коридорами для обеспечения связности.
	 * @param chunk - Чанк
	 * @param rooms - Массив комнат
	 * @param rng - Генератор случайных чисел
	 */
	private connectRooms(chunk: OptimizedChunk, rooms: Room[], rng: SeededRandom): void {
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

			// Добавляем структуру коридора
			const minX = Math.min(exitA.x, entryB.x);
			const minY = Math.min(exitA.y, entryB.y);
			const maxX = Math.max(exitA.x, entryB.x);
			const maxY = Math.max(exitA.y, entryB.y);
			
			this.addStructure(chunk, StructureType.CORRIDOR, {
				x: minX,
				y: minY,
				w: maxX - minX + 1,
				h: maxY - minY + 1
			}, {
				connections: [roomA.structureId, roomB.structureId]
			});
		}
	}

	/**
	 * Возвращает случайную точку на границе комнаты (для входа/выхода).
	 * @param room - Комната
	 * @param rng - Генератор случайных чисел
	 */
	private getRandomRoomEdge(room: Room, rng: SeededRandom): { x: number; y: number } {
		const side = rng.nextInt(0, 4);
		switch (side) {
			case 0: // top
				return { x: rng.nextInt(room.x + 1, room.x + room.w - 1), y: room.y };
			case 1: // right
				return { x: room.x + room.w - 1, y: rng.nextInt(room.y + 1, room.y + room.h - 1) };
			case 2: // bottom
				return { x: rng.nextInt(room.x + 1, room.x + room.w - 1), y: room.y + room.h - 1 };
			case 3: // left
			default:
				return { x: room.x, y: rng.nextInt(room.y + 1, room.y + room.h - 1) };
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
		chunk: OptimizedChunk,
		x0: number,
		y0: number,
		x1: number,
		y1: number,
		rng: SeededRandom
	): void {
		// 50% шанс сделать коридор с изгибом (L-образный)
		if (rng.next() < 0.5) {
			// Сначала по горизонтали, потом по вертикали
			this.drawLine(chunk, x0, y0, x1, y0, TileType.EMPTY);
			this.drawLine(chunk, x1, y0, x1, y1, TileType.EMPTY);
		} else {
			// Сначала по вертикали, потом по горизонтали
			this.drawLine(chunk, x0, y0, x0, y1, TileType.EMPTY);
			this.drawLine(chunk, x0, y1, x1, y1, TileType.EMPTY);
		}
	}

	/**
	 * Добавляет декоративные элементы: обломки, разрушенные стены, украшения.
	 * @param chunk - Чанк
	 * @param rng - Генератор случайных чисел
	 */
	private addDecorations(chunk: OptimizedChunk, rng: SeededRandom): void {
		for (let x = 0; x < CHUNK_CONFIG.SIZE; x++) {
			for (let y = 0; y < CHUNK_CONFIG.SIZE; y++) {
				// Пропускаем уже занятые тайлы
				if (!this.isPassable(chunk, x, y)) continue;

				// Обломки (камни)
				if (rng.next() < RUINS_CONFIG.DEBRIS_CHANCE) {
					this.setTile(chunk, x, y, TileType.ROCK);
					continue;
				}

				// Декоративные стены (разрушенные фрагменты)
				if (rng.next() < RUINS_CONFIG.DECOR_WALL_CHANCE) {
					// Проверяем, есть ли рядом стена для "прикрепления" фрагмента
					const hasWallNeighbor = 
						!this.isPassable(chunk, x - 1, y) ||
						!this.isPassable(chunk, x + 1, y) ||
						!this.isPassable(chunk, x, y - 1) ||
						!this.isPassable(chunk, x, y + 1);
					
					if (hasWallNeighbor) {
						this.setTile(chunk, x, y, TileType.WALL);
						this.addStructure(chunk, StructureType.DECORATION, { x, y, w: 1, h: 1 }, {
							type: 'wall_fragment'
						});
					}
				}
			}
		}
	}

	/**
	 * Добавляет зоны с лутом внутри комнат.
	 * @param chunk - Чанк
	 * @param rooms - Массив комнат
	 * @param rng - Генератор случайных чисел
	 */
	private addLootZones(chunk: OptimizedChunk, rooms: Room[], rng: SeededRandom): void {
		for (const room of rooms) {
			// 70% шанс, что в комнате будет лут-зона
			if (rng.next() >= 0.7) continue;

			// Выбираем случайную позицию внутри комнаты (не на стене)
			const lootX = rng.nextInt(room.x + 1, room.x + room.w - 1);
			const lootY = rng.nextInt(room.y + 1, room.y + room.h - 1);

			// Добавляем структуру лут-зоны
			this.addStructure(chunk, StructureType.LOOT_ZONE, { x: lootX, y: lootY, w: 1, h: 1 }, {
				lootTable: `ruins_tier_${rng.nextInt(1, 4)}`,
				seed: rng.nextInt(0, 0x7FFFFFFF)
			});
		}
	}

	/**
	 * Вспомогательный метод: проверяет, находится ли точка внутри комнаты.
	 * @param room - Комната
	 * @param x - Координата X
	 * @param y - Координата Y
	 */
	private isPointInRoom(room: Room, x: number, y: number): boolean {
		return x >= room.x && x < room.x + room.w && y >= room.y && y < room.y + room.h;
	}

	/**
	 * Вспомогательный метод: находит ближайшую комнату к точке.
	 * @param rooms - Массив комнат
	 * @param x - Координата X
	 * @param y - Координата Y
	 */
	private findNearestRoom(rooms: Room[], x: number, y: number): Room | null {
		if (rooms.length === 0) return null;

		let nearest = rooms[0];
		let minDist = Infinity;

		for (const room of rooms) {
			const dx = room.centerX - x;
			const dy = room.centerY - y;
			const dist = dx * dx + dy * dy;
			if (dist < minDist) {
				minDist = dist;
				nearest = room;
			}
		}

		return nearest;
	}
}
