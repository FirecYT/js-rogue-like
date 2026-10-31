import type { World } from '@firec/map-module';
import { TILES } from '../map/Types';

/**
 * Результат преобразования мировых координат в тайловые.
 */
export interface TileCoord {
	tileX: number;
	tileY: number;
}

/**
 * Результат преобразования тайловых координат в мировые.
 */
export interface WorldCoord {
	x: number;
	y: number;
}

/**
 * Фасад над World из @firec/map-module.
 * Предоставляет методы коллизий, проходимости и преобразования координат.
 * Все контроллеры и системы работают через этот сервис, а не через World напрямую (DIP).
 */
export class WorldService {
	/**
	 * @param world - Экземпляр World из @firec/map-module
	 */
	constructor(private readonly world: World) {}

	/**
	 * Проверяет, проходима ли позиция в мировых координатах (пикселях).
	 * Делегирует World.isPassable, который учитывает passable из TileDefinition.
	 * @param worldX - Мировая координата X в пикселях
	 * @param worldY - Мировая координата Y в пикселях
	 * @returns true, если позиция проходима (или чанк не загружен)
	 */
	isPassable(worldX: number, worldY: number): boolean {
		return this.world.isPassable(worldX, worldY);
	}

	/**
	 * Разрушает тайл в мировых координатах до пола: на месте стены
	 * остаётся проходимый пол, а не дыра в текстурах.
	 * @param worldX - Мировая координата X
	 * @param worldY - Мировая координата Y
	 * @returns true, если чанк загружен и тайл изменён
	 */
	destroyTile(worldX: number, worldY: number): boolean {
		return this.world.setTileAt(worldX, worldY, TILES.FLOOR);
	}

	/**
	 * Проверяет, может ли прямоугольник (width, height) находиться в позиции (centerX, centerY)
	 * без пересечения с непроходимыми тайлами.
	 * Проверяет 4 угла хитбокса (позиция — центр прямоугольника).
	 * @param centerX - Центральная координата X хитбокса
	 * @param centerY - Центральная координата Y хитбокса
	 * @param width - Ширина хитбокса
	 * @param height - Высота хитбокса
	 * @returns true, если все 4 угла проходимы
	 */
	canFit(
		centerX: number,
		centerY: number,
		width: number,
		height: number
	): boolean {
		const hw = width / 2;
		const hh = height / 2;
		return (
			this.isPassable(centerX - hw, centerY - hh) &&
			this.isPassable(centerX + hw, centerY - hh) &&
			this.isPassable(centerX - hw, centerY + hh) &&
			this.isPassable(centerX + hw, centerY + hh)
		);
	}

	/**
	 * Пытается сдвинуть объект на (dx, dy) с проверкой коллизий по каждой оси отдельно.
	 * Разделение по осям позволяет скользить вдоль стен.
	 * @param x - Текущая координата X
	 * @param y - Текущая координата Y
	 * @param dx - Смещение по X
	 * @param dy - Смещение по Y
	 * @param width - Ширина хитбокса
	 * @param height - Высота хитбокса
	 * @returns Фактические координаты после попытки перемещения
	 */
	tryMove(
		x: number,
		y: number,
		dx: number,
		dy: number,
		width: number,
		height: number
	): WorldCoord {
		// Сначала пытаемся двигаться по X
		if (dx !== 0 && this.canFit(x + dx, y, width, height)) {
			x += dx;
		}
		// Затем по Y (с уже обновлённой X)
		if (dy !== 0 && this.canFit(x, y + dy, width, height)) {
			y += dy;
		}
		return { x, y };
	}

	/**
	 * Проверяет линию видимости между двумя точками в мировых координатах.
	 * @param x1 - Начальная координата X
	 * @param y1 - Начальная координата Y
	 * @param x2 - Конечная координата X
	 * @param y2 - Конечная координата Y
	 * @param range - Максимальная дистанция проверки
	 * @returns true, если линия видимости не прерывается
	 */
	hasLineOfSight(
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		range: number
	): boolean {
		const dist = Math.hypot(x2 - x1, y2 - y1);
		if (dist > range) return false;
		return this.world.hasLineOfSight(x1, y1, x2, y2);
	}

	/**
	 * Возвращает проходимых соседей тайла (для A*).
	 * @param tileX - Глобальная тайловая координата X
	 * @param tileY - Глобальная тайловая координата Y
	 * @param diagonals - Включать ли диагональных соседей (по умолчанию: true)
	 * @returns Массив координат проходимых соседей
	 */
	getPassableNeighbors(
		tileX: number,
		tileY: number,
		diagonals = true
	): TileCoord[] {
		const passibleNeighbors = this.world.getPassableNeighbors(tileX, tileY, diagonals);
		return passibleNeighbors.map(({x, y}) => ({tileX: x, tileY: y}));
	}

	/**
	 * Преобразует мировые пиксели в глобальные тайловые координаты.
	 * @param worldX - Мировая координата X в пикселях
	 * @param worldY - Мировая координата Y в пикселях
	 * @returns Глобальные тайловые координаты
	 */
	worldToTile(worldX: number, worldY: number): TileCoord {
		const grid = this.world.worldToGrid(worldX, worldY);
		return { tileX: grid.tileX, tileY: grid.tileY };
	}

	/**
	 * Преобразует глобальные тайловые координаты в мировые пиксели (центр тайла).
	 * @param tileX - Глобальная тайловая координата X
	 * @param tileY - Глобальная тайловая координата Y
	 * @returns Мировые координаты центра тайла
	 */
	tileToWorld(tileX: number, tileY: number): WorldCoord {
		const p = this.world.tileToWorld(tileX, tileY);
		return {
			x: p.x + this.world.config.tileSize / 2,
			y: p.y + this.world.config.tileSize / 2,
		};
	}

	/**
	 * Возвращает ссылку на конфиг мира (для размеров тайла).
	 */
	get config(): { readonly chunkSize: number; readonly tileSize: number } {
		return this.world.config;
	}

	/**
	 * Обновляет загруженные чанки вокруг позиции.
	 * @param worldX - Мировая координата X центра
	 * @param worldY - Мировая координата Y центра
	 */
	update(worldX: number, worldY: number): void {
		this.world.update(worldX, worldY);
	}

	/**
	 * Возвращает загруженные чанки для рендеринга.
	 * @returns Массив загруженных чанков
	 */
	getLoadedChunks() {
		return this.world.getLoadedChunks();
	}
}
