import type { ISystem } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import type { EntityWorld } from '../core/EntityWorld';

/**
 * Система коллизий между сущностями: отталкивание при слишком малой дистанции.
 * Предотвращает наложение хитбоксов сущностей друг на друга.
 * Следует SRP: отвечает только за отталкивание сущностей, не за коллизии с тайлами.
 */
export class CollisionSystem implements ISystem {
	public readonly phase = UpdatePhase.Collision;
	public enabled = true;

	/** Минимальное расстояние между центрами сущностей в пикселях. */
	private static readonly MIN_DISTANCE = 10;
	private static readonly MIN_DISTANCE_SQ = CollisionSystem.MIN_DISTANCE * CollisionSystem.MIN_DISTANCE;

	/**
	 * @param entityWorld - Контейнер всех сущностей игры
	 */
	constructor(private readonly entityWorld: EntityWorld) {}

	/**
	 * Проверяет все пары сущностей и отталкивает их друг от друга,
	 * если расстояние между центрами меньше MIN_DISTANCE.
	 * Использует O(n²) алгоритм, что приемлемо для малого количества сущностей.
	 */
	update(): void {
		const entities = this.entityWorld.all;
		for (let i = 0; i < entities.length; i++) {
			if (entities[i].isDead()) continue;

			for (let j = i + 1; j < entities.length; j++) {
				if (entities[j].isDead()) continue;

				const dx = entities[i].x - entities[j].x;
				const dy = entities[i].y - entities[j].y;
				const distSq = dx * dx + dy * dy;

				// Если расстояние меньше минимального и не ноль (чтобы избежать деления на ноль)
				if (distSq < CollisionSystem.MIN_DISTANCE_SQ && distSq > 0) {
					const dist = Math.sqrt(distSq);
					const force = CollisionSystem.MIN_DISTANCE / dist;

					// Отталкиваем сущности в противоположные стороны
					entities[i].x += (dx / dist) * force;
					entities[i].y += (dy / dist) * force;

					entities[j].x -= (dx / dist) * force;
					entities[j].y -= (dy / dist) * force;
				}
			}
		}
	}

	/**
	 * Освобождение ресурсов (не требуется для этой системы).
	 */
	dispose(): void {
		// Nothing to dispose
	}
}
