import { BaseGenerator, SeededRandom } from './BaseGenerator';
import { OptimizedChunk, TileType, RegionType, CHUNK_CONFIG, StructureType } from '../Types';

/**
 * Конфигурация генерации поселения.
 */
const SETTLEMENT_CONFIG = {
	/** Минимальное количество домов в чанке */
	MIN_HOUSES: 3,
	/** Максимальное количество домов в чанке */
	MAX_HOUSES: 4,
	/** Минимальный размер дома */
	MIN_HOUSE_SIZE: 5,
	/** Максимальный размер дома */
	MAX_HOUSE_SIZE: 8,
	/** Вероятность добавления обломков на пустой тайл */
	DEBRIS_CHANCE: 0.05,
	/** Вероятность повреждения стен дома */
	DAMAGE_CHANCE: 0.15,
	/** Минимальный отступ от краёв чанка */
	MARGIN: 2
} as const;

/**
 * Генератор поселения: дома со входами и комнатами, улицы, обломки.
 * @remarks Создаёт городскую среду с разрушенными зданиями и проходами.
 */
export class SettlementGenerator extends BaseGenerator {
	/**
	 * Генерирует чанк с поселением.
	 * @param chunkX - X координата чанка
	 * @param chunkY - Y координата чанка
	 * @param seed - Seed для детерминированной генерации (опционально)
	 * @returns Оптимизированный чанк с поселением
	 */
	generate(chunkX: number, chunkY: number, seed?: number): OptimizedChunk {
		const rng = this.createRng(chunkX, chunkY, seed);
		const chunk = this.createEmptyChunk(chunkX, chunkY, RegionType.SETTLEMENT, rng.getSeed());
		
		this.generateHouses(chunk, rng);
		this.generateStreets(chunk, rng);
		this.generateDebris(chunk, rng);
		
		this.finalizeChunk(chunk, true);
		return chunk;
	}

	/**
	 * Генерирует дома внутри чанка.
	 * @param chunk - Чанк для заполнения
	 * @param rng - Генератор случайных чисел
	 */
	private generateHouses(chunk: OptimizedChunk, rng: SeededRandom): void {
		const houseCount = rng.nextInt(SETTLEMENT_CONFIG.MIN_HOUSES, SETTLEMENT_CONFIG.MAX_HOUSES + 1);
		const maxAttempts = houseCount * 15;
		let attempts = 0;

		for (let i = 0; i < houseCount && attempts < maxAttempts; attempts++) {
			const width = rng.nextInt(SETTLEMENT_CONFIG.MIN_HOUSE_SIZE, SETTLEMENT_CONFIG.MAX_HOUSE_SIZE + 1);
			const height = rng.nextInt(SETTLEMENT_CONFIG.MIN_HOUSE_SIZE, SETTLEMENT_CONFIG.MAX_HOUSE_SIZE + 1);
			
			const x = SETTLEMENT_CONFIG.MARGIN + rng.nextInt(0, CHUNK_CONFIG.SIZE - width - SETTLEMENT_CONFIG.MARGIN * 2);
			const y = SETTLEMENT_CONFIG.MARGIN + rng.nextInt(0, CHUNK_CONFIG.SIZE - height - SETTLEMENT_CONFIG.MARGIN * 2);

			if (this.overlapsStructures(chunk, x, y, width, height, 2)) {
				continue;
			}

			this.buildHouse(chunk, x, y, width, height, rng);
			i++; // Успешное размещение
		}
	}

	/**
	 * Строит отдельный дом со стенами, комнатами и входом.
	 * @param chunk - Чанк
	 * @param x - Начальная координата по оси X
	 * @param y - Начальная координата по оси Y
	 * @param width - Ширина дома
	 * @param height - Высота дома
	 * @param rng - Генератор случайных чисел
	 */
	private buildHouse(
		chunk: OptimizedChunk,
		x: number,
		y: number,
		width: number,
		height: number,
		rng: SeededRandom
	): void {
		// Стены дома (полые — только границы)
		this.fillRect(chunk, x, y, width, height, TileType.WALL, true);

		// Внутреннее пространство уже пустое благодаря fillRect с hollow=true

		// Добавляем комнаты внутри дома (если достаточно большой)
		if (width >= 7 && height >= 7) {
			this.addRooms(chunk, x, y, width, height, rng);
		}

		// Добавляем вход в дом
		this.addHouseEntrance(chunk, x, y, width, height, rng);

		// Случайно разрушаем часть стен для реализма
		this.addDamageToHouse(chunk, x, y, width, height, rng);

		// Добавляем структуру дома
		this.addStructure(chunk, StructureType.ROOM, { x, y, w: width, h: height }, {
			type: 'house',
			difficulty: rng.nextInt(1, 3),
			seed: rng.nextInt(0, 0x7FFFFFFF)
		});
	}

	/**
	 * Добавляет внутренние перегородки (комнаты) в доме.
	 * @param chunk - Чанк
	 * @param houseX - Начальная координата дома по оси X
	 * @param houseY - Начальная координата дома по оси Y
	 * @param houseWidth - Ширина дома
	 * @param houseHeight - Высота дома
	 * @param rng - Генератор случайных чисел
	 */
	private addRooms(
		chunk: OptimizedChunk,
		houseX: number,
		houseY: number,
		houseWidth: number,
		houseHeight: number,
		rng: SeededRandom
	): void {
		// Горизонтальная перегородка
		if (rng.next() > 0.5 && houseHeight >= 8) {
			const wallY = houseY + Math.floor(houseHeight / 2);
			for (let x = houseX + 2; x < houseX + houseWidth - 2; x++) {
				this.setTile(chunk, x, wallY, TileType.WALL);
			}
			// Дверной проём
			const doorX = houseX + 2 + rng.nextInt(0, houseWidth - 4);
			this.setTile(chunk, doorX, wallY, TileType.EMPTY);
			this.setTile(chunk, doorX + 1, wallY, TileType.EMPTY);
		}

		// Вертикальная перегородка
		if (rng.next() > 0.5 && houseWidth >= 8) {
			const wallX = houseX + Math.floor(houseWidth / 2);
			for (let y = houseY + 2; y < houseY + houseHeight - 2; y++) {
				this.setTile(chunk, wallX, y, TileType.WALL);
			}
			// Дверной проём
			const doorY = houseY + 2 + rng.nextInt(0, houseHeight - 4);
			this.setTile(chunk, wallX, doorY, TileType.EMPTY);
			this.setTile(chunk, wallX, doorY + 1, TileType.EMPTY);
		}
	}

	/**
	 * Добавляет вход в дом на случайной стороне.
	 * @param chunk - Чанк
	 * @param x - Начальная координата по оси X
	 * @param y - Начальная координата по оси Y
	 * @param width - Ширина дома
	 * @param height - Высота дома
	 * @param rng - Генератор случайных чисел
	 */
	private addHouseEntrance(
		chunk: OptimizedChunk,
		x: number,
		y: number,
		width: number,
		height: number,
		rng: SeededRandom
	): void {
		const sides: number[] = [];
		if (y > SETTLEMENT_CONFIG.MARGIN) sides.push(0); // top
		if (x + width < CHUNK_CONFIG.SIZE - SETTLEMENT_CONFIG.MARGIN) sides.push(1); // right
		if (y + height < CHUNK_CONFIG.SIZE - SETTLEMENT_CONFIG.MARGIN) sides.push(2); // bottom
		if (x > SETTLEMENT_CONFIG.MARGIN) sides.push(3); // left

		if (sides.length === 0) return;

		const side = rng.choice(sides);
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

		// Делаем вход шире (2 тайла)
		this.setTile(chunk, entranceX, entranceY, TileType.EMPTY);

		if (side === 0 || side === 2) {
			if (entranceX + 1 < x + width - 1) {
				this.setTile(chunk, entranceX + 1, entranceY, TileType.EMPTY);
			}
		} else {
			if (entranceY + 1 < y + height - 1) {
				this.setTile(chunk, entranceX, entranceY + 1, TileType.EMPTY);
			}
		}
	}

	/**
	 * Случайно повреждает стены дома для создания эффекта разрушения.
	 * @param chunk - Чанк
	 * @param x - Начальная координата по оси X
	 * @param y - Начальная координата по оси Y
	 * @param width - Ширина дома
	 * @param height - Высота дома
	 * @param rng - Генератор случайных чисел
	 */
	private addDamageToHouse(
		chunk: OptimizedChunk,
		x: number,
		y: number,
		width: number,
		height: number,
		rng: SeededRandom
	): void {
		const damageCount = 2 + rng.nextInt(0, 2);

		for (let i = 0; i < damageCount; i++) {
			// Собираем все стены дома
			const walls: { x: number; y: number }[] = [];
			
			// Верхняя и нижняя стены
			for (let wx = x + 1; wx < x + width - 1; wx++) {
				if (this.getTileType(chunk, wx, y) === TileType.WALL) walls.push({ x: wx, y });
				if (this.getTileType(chunk, wx, y + height - 1) === TileType.WALL) walls.push({ x: wx, y: y + height - 1 });
			}
			// Левая и правая стены
			for (let wy = y + 1; wy < y + height - 1; wy++) {
				if (this.getTileType(chunk, x, wy) === TileType.WALL) walls.push({ x, y: wy });
				if (this.getTileType(chunk, x + width - 1, wy) === TileType.WALL) walls.push({ x: x + width - 1, y: wy });
			}

			if (walls.length > 0) {
				const wall = rng.choice(walls);
				this.setTile(chunk, wall.x, wall.y, TileType.EMPTY);

				// Иногда добавляем обломки рядом
				if (rng.next() > 0.7) {
					const debrisX = wall.x + (rng.next() > 0.5 ? 1 : -1);
					const debrisY = wall.y + (rng.next() > 0.5 ? 1 : -1);
					if (debrisX >= x && debrisX < x + width &&
						debrisY >= y && debrisY < y + height &&
						this.getTileType(chunk, debrisX, debrisY) === TileType.EMPTY) {
						this.setTile(chunk, debrisX, debrisY, TileType.ROCK);
					}
				}
			}
		}
	}

	/**
	 * Генерирует улицы между домами.
	 * @param chunk - Чанк
	 * @param rng - Генератор случайных чисел
	 */
	private generateStreets(chunk: OptimizedChunk, rng: SeededRandom): void {
		// Горизонтальная улица — обеспечиваем проходимость и добавляем структуру по центру чанка
		if (rng.next() > 0.3) {
			const streetY = Math.floor(CHUNK_CONFIG.SIZE / 2) + rng.nextInt(-1, 2);
			// Улица — это просто проходимость, тайл остаётся EMPTY (уже пустой)
			// Можно добавить специальный тайл для дороги в будущем: TileType.ROAD
			// Добавляем структуру улицы для логики навигации/лута (используем streetY)
			this.addStructure(chunk, StructureType.CORRIDOR, {
				x: 0,
				y: streetY,
				w: CHUNK_CONFIG.SIZE,
				h: 1
			}, { type: 'street', direction: 'horizontal' });
		}

		// Вертикальная улица — аналогично по центру чанка по оси X (используем streetX)
		if (rng.next() > 0.3) {
			const streetX = Math.floor(CHUNK_CONFIG.SIZE / 2) + rng.nextInt(-1, 2);
			// Проходимость обеспечивается тайлом EMPTY — ничего не меняем, только "размечаем" зону как улицу через структуру
			// Добавляем структуру улицы для логики навигации/лута (одна структура на всю улицу)
			this.addStructure(chunk, StructureType.CORRIDOR, {
				x: streetX,
				y: 0,
				w: 1,
				h: CHUNK_CONFIG.SIZE
			}, { type: 'street', direction: 'vertical' });
		}
	}

	/**
	 * Добавляет случайные обломки и камни на проходимые тайлы.
	 * @param chunk - Чанк
	 * @param rng - Генератор случайных чисел
	 */
	private generateDebris(chunk: OptimizedChunk, rng: SeededRandom): void {
		for (let x = 0; x < CHUNK_CONFIG.SIZE; x++) {
			for (let y = 0; y < CHUNK_CONFIG.SIZE; y++) {
				if (this.isPassable(chunk, x, y) && rng.next() < SETTLEMENT_CONFIG.DEBRIS_CHANCE) {
					this.setTile(chunk, x, y, TileType.ROCK);
				}
			}
		}
	}

	/**
	 * Вспомогательный метод: получает тип тайла (обёртка для совместимости).
	 * @param chunk - Чанк
	 * @param x - Локальная координата по оси X
	 * @param y - Локальная координата по оси Y
	 */
	private getTileType(chunk: OptimizedChunk, x: number, y: number): TileType {
		// Используем импортированную функцию getTile из Types
		return (chunk.tiles as Uint8Array)[x * CHUNK_CONFIG.SIZE + y];
	}
}
