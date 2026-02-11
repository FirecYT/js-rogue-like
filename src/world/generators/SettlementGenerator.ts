import { BaseGenerator } from './BaseGenerator';
import { Chunk, TileType, RegionType, CHUNK_CONFIG } from '../Types';

export class SettlementGenerator extends BaseGenerator {
	generate(chunkX: number, chunkY: number): Chunk {
		const chunk = this.createEmptyChunk(chunkX, chunkY);
		chunk.regionType = RegionType.SETTLEMENT;

		// Создаём несколько структурированных домов
		this.generateHouses(chunk);

		// Добавляем улицы между домами
		this.generateStreets(chunk);

		// Добавляем случайный мусор и детали
		this.generateDebris(chunk);

		return chunk;
	}

	private generateHouses(chunk: Chunk) {
		// Генерируем 3-4 дома в чанке
		const houseCount = 3 + Math.floor(Math.random() * 2);

		for (let i = 0; i < houseCount; i++) {
			// Размер дома: 5-8 тайлов в ширину и высоту
			const width = 5 + Math.floor(Math.random() * 4);
			const height = 5 + Math.floor(Math.random() * 4);

			// Позиция дома с отступами от краёв
			const x = 2 + Math.floor(Math.random() * (CHUNK_CONFIG.SIZE - width - 4));
			const y = 2 + Math.floor(Math.random() * (CHUNK_CONFIG.SIZE - height - 4));

			// Строим дом
			this.buildHouse(chunk, x, y, width, height);
		}
	}

	private buildHouse(chunk: Chunk, x: number, y: number, width: number, height: number) {
		// Стены дома
		this.generateRectangle(chunk, x, y, width, height, TileType.WALL);

		// Внутреннее пространство - пустое
		for (let innerX = x + 1; innerX < x + width - 1; innerX++) {
			for (let innerY = y + 1; innerY < y + height - 1; innerY++) {
				this.setTile(chunk, innerX, innerY, TileType.EMPTY);
			}
		}

		// Добавляем комнаты внутри дома (если дом достаточно большой)
		if (width >= 7 && height >= 7) {
			this.addRooms(chunk, x, y, width, height);
		}

		// Добавляем вход в дом
		this.addHouseEntrance(chunk, x, y, width, height);

		// Случайно разрушаем часть стен для реализма
		this.addDamageToHouse(chunk, x, y, width, height);
	}

	private addRooms(chunk: Chunk, houseX: number, houseY: number, houseWidth: number, houseHeight: number) {
		// Горизонтальная перегородка (делит дом на 2 этажа или комнаты)
		if (Math.random() > 0.5 && houseHeight >= 8) {
			const wallY = houseY + Math.floor(houseHeight / 2);
			for (let x = houseX + 2; x < houseX + houseWidth - 2; x++) {
				this.setTile(chunk, x, wallY, TileType.WALL);
			}
			// Дверной проём в перегородке
			const doorX = houseX + 2 + Math.floor(Math.random() * (houseWidth - 5));
			this.setTile(chunk, doorX, wallY, TileType.EMPTY);
			this.setTile(chunk, doorX + 1, wallY, TileType.EMPTY);
		}

		// Вертикальная перегородка (делит дом на комнаты)
		if (Math.random() > 0.5 && houseWidth >= 8) {
			const wallX = houseX + Math.floor(houseWidth / 2);
			for (let y = houseY + 2; y < houseY + houseHeight - 2; y++) {
				this.setTile(chunk, wallX, y, TileType.WALL);
			}
			// Дверной проём в перегородке
			const doorY = houseY + 2 + Math.floor(Math.random() * (houseHeight - 5));
			this.setTile(chunk, wallX, doorY, TileType.EMPTY);
			this.setTile(chunk, wallX, doorY + 1, TileType.EMPTY);
		}
	}

	private addHouseEntrance(chunk: Chunk, x: number, y: number, width: number, height: number) {
		// Выбираем сторону для входа
		const sides = [];
		if (y > 2) sides.push(0); // top
		if (x + width < CHUNK_CONFIG.SIZE - 2) sides.push(1); // right
		if (y + height < CHUNK_CONFIG.SIZE - 2) sides.push(2); // bottom
		if (x > 2) sides.push(3); // left

		if (sides.length === 0) return;

		const side = sides[Math.floor(Math.random() * sides.length)];

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

		// Добавляем второй тайл для ширины двери
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

	private addDamageToHouse(chunk: Chunk, x: number, y: number, width: number, height: number) {
		// Случайно разрушаем 10-20% стен для реализма
		const damageCount = 2 + Math.floor(Math.random() * 3);

		for (let i = 0; i < damageCount; i++) {
			// Выбираем случайную стену
			const walls = [];
			// Верхняя стена
			for (let wx = x + 1; wx < x + width - 1; wx++) {
				if (chunk.tiles[wx][y] === TileType.WALL) {
					walls.push({ x: wx, y: y });
				}
			}
			// Нижняя стена
			for (let wx = x + 1; wx < x + width - 1; wx++) {
				if (chunk.tiles[wx][y + height - 1] === TileType.WALL) {
					walls.push({ x: wx, y: y + height - 1 });
				}
			}
			// Левая стена
			for (let wy = y + 1; wy < y + height - 1; wy++) {
				if (chunk.tiles[x][wy] === TileType.WALL) {
					walls.push({ x: x, y: wy });
				}
			}
			// Правая стена
			for (let wy = y + 1; wy < y + height - 1; wy++) {
				if (chunk.tiles[x + width - 1][wy] === TileType.WALL) {
					walls.push({ x: x + width - 1, y: wy });
				}
			}

			if (walls.length > 0) {
				const wall = walls[Math.floor(Math.random() * walls.length)];
				this.setTile(chunk, wall.x, wall.y, TileType.EMPTY);

				// Иногда добавляем обломки рядом
				if (Math.random() > 0.7) {
					const debrisX = wall.x + (Math.random() > 0.5 ? 1 : -1);
					const debrisY = wall.y + (Math.random() > 0.5 ? 1 : -1);
					if (debrisX >= x && debrisX < x + width &&
						debrisY >= y && debrisY < y + height &&
						chunk.tiles[debrisX][debrisY] === TileType.EMPTY) {
						this.setTile(chunk, debrisX, debrisY, TileType.ROCK);
					}
				}
			}
		}
	}

	private generateStreets(chunk: Chunk) {
		// Горизонтальная улица
		if (Math.random() > 0.3) {
			const streetY = Math.floor(CHUNK_CONFIG.SIZE / 2) + Math.floor(Math.random() * 3) - 1;
			for (let x = 0; x < CHUNK_CONFIG.SIZE; x++) {
				if (chunk.tiles[x][streetY] === TileType.EMPTY) {
					// Помечаем улицу другим тайпом или оставляем пустой
					// Можно добавить специальный тайл для дороги позже
				}
			}
		}

		// Вертикальная улица
		if (Math.random() > 0.3) {
			const streetX = Math.floor(CHUNK_CONFIG.SIZE / 2) + Math.floor(Math.random() * 3) - 1;
			for (let y = 0; y < CHUNK_CONFIG.SIZE; y++) {
				if (chunk.tiles[streetX][y] === TileType.EMPTY) {
					// Помечаем улицу другим тайпом или оставляем пустой
				}
			}
		}
	}

	private generateDebris(chunk: Chunk) {
		// Добавляем случайные камни и обломки на улицах
		for (let x = 0; x < CHUNK_CONFIG.SIZE; x++) {
			for (let y = 0; y < CHUNK_CONFIG.SIZE; y++) {
				if (chunk.tiles[x][y] === TileType.EMPTY && Math.random() < 0.05) {
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
}
