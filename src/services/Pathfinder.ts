import type { WorldService, TileCoord, WorldCoord } from './WorldService';

/**
 * Узел A* для поиска пути.
 */
interface AStarNode {
	/** Глобальная тайловая координата X */
	x: number;
	/** Глобальная тайловая координата Y */
	y: number;
	/** Стоимость от старта до этого узла */
	g: number;
	/** Эвристическая оценка до цели */
	h: number;
	/** Общая стоимость (g + h) */
	f: number;
	/** Родительский узел для восстановления пути */
	parent?: AStarNode;
}

/**
 * Результат поиска пути: массив мировых координат (центры тайлов).
 */
export type Path = WorldCoord[];

/**
 * Параметры запроса поиска пути.
 */
export interface PathRequest {
	/** Начальная позиция в мировых координатах (пикселях). */
	start: WorldCoord;
	/** Конечная позиция в мировых координатах (пикселях). */
	end: WorldCoord;
	/** Максимальное количество обработанных узлов (защита от зацикливания). */
	maxNodes?: number;
}

/**
 * A* поиск пути по тайловой сетке.
 * Использует Octile-эвристику для 8-связного графа.
 * Диагональные движения блокируются, если оба ортогональных соседа непроходимы
 * (защита от "протискивания" через углы стен).
 */
export class Pathfinder {
	/**
	 * @param world - Сервис мира для проверки проходимости и соседей
	 */
	constructor(private readonly world: WorldService) {}

	/**
	 * Ищет путь между двумя мировыми точками.
	 * @param req - Параметры запроса (начало, конец, лимит узлов)
	 * @returns Массив waypoints в мировых координатах (пустой, если пути нет)
	 */
	findPath(req: PathRequest): Path {
		const startTile = this.world.worldToTile(req.start.x, req.start.y);
		const endTile = this.world.worldToTile(req.end.x, req.end.y);

		// Быстрая проверка: если цель непроходима — путь невозможен
		const endWorld = this.world.tileToWorld(endTile.tileX, endTile.tileY);
		if (!this.world.isPassable(endWorld.x, endWorld.y)) {
			return [];
		}

		const open: AStarNode[] = [];
		const closed = new Set<string>();
		const maxNodes = req.maxNodes ?? 1000;

		/**
		 * Генерирует уникальный ключ для узла (для хранения в closed Set).
		 */
		const key = (x: number, y: number): string => `${x},${y}`;

		/**
		 * Octile distance: корректная эвристика для 8-связного графа.
		 * Учитывает диагональные движения со стоимостью sqrt(2).
		 */
		const heuristic = (
			a: TileCoord,
			b: TileCoord
		): number => {
			const dx = Math.abs(a.tileX - b.tileX);
			const dy = Math.abs(a.tileY - b.tileY);
			return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy);
		};

		const startNode: AStarNode = {
			x: startTile.tileX,
			y: startTile.tileY,
			g: 0,
			h: heuristic(startTile, endTile),
			f: heuristic(startTile, endTile),
		};
		open.push(startNode);

		let iterations = 0;

		while (open.length > 0 && iterations++ < maxNodes) {
			// Находим узел с минимальным f (в продакшене заменить на min-heap)
			let bestIdx = 0;
			for (let i = 1; i < open.length; i++) {
				if (open[i].f < open[bestIdx].f) bestIdx = i;
			}
			const current = open.splice(bestIdx, 1)[0];

			// Цель достигнута
			if (current.x === endTile.tileX && current.y === endTile.tileY) {
				return this.reconstruct(current);
			}

			closed.add(key(current.x, current.y));

			const neighbors = this.world.getPassableNeighbors(
				current.x,
				current.y,
				true
			);

			for (const n of neighbors) {
				const k = key(n.tileX, n.tileY);
				if (closed.has(k)) continue;

				// Для диагональных движений проверяем, что нет "зажатого" угла
				if (n.tileX !== current.x && n.tileY !== current.y) {
					const adjX = this.world.tileToWorld(n.tileX, current.y);
					const adjY = this.world.tileToWorld(current.x, n.tileY);
					if (
						!this.world.isPassable(adjX.x, adjX.y) &&
						!this.world.isPassable(adjY.x, adjY.y)
					) {
						continue; // оба ортогональных соседа — стены, диагональ заблокирована
					}
				}

				const cost =
					n.tileX !== current.x && n.tileY !== current.y
						? Math.SQRT2
						: 1;
				const tentativeG = current.g + cost;

				const existing = open.find(
					(o) => o.x === n.tileX && o.y === n.tileY
				);
				if (existing && existing.g <= tentativeG) continue;

				const node: AStarNode = {
					x: n.tileX,
					y: n.tileY,
					g: tentativeG,
					h: heuristic(n, endTile),
					f: tentativeG + heuristic(n, endTile),
					parent: current,
				};

				if (!existing) open.push(node);
				else {
					existing.g = tentativeG;
					existing.f = tentativeG + existing.h;
					existing.parent = current;
				}
			}
		}

		return []; // путь не найден
	}

	/**
	 * Восстанавливает путь из связанного списка узлов.
	 * @param node - Конечный узел пути
	 * @returns Массив мировых координат waypoints
	 */
	private reconstruct(node: AStarNode): Path {
		const path: Path = [];
		let cur: AStarNode | undefined = node;
		while (cur) {
			path.unshift(this.world.tileToWorld(cur.x, cur.y));
			cur = cur.parent;
		}
		return path;
	}
}
