import type { ISystem } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import type Entity from '../entities/Entity';

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
	 * @param entities - Массив всех сущностей в игре
	 */
	constructor(private readonly entities: Entity[]) {}

	/**
	 * Проверяет все пары сущностей и отталкивает их друг от друга,
	 * если расстояние между центрами меньше MIN_DISTANCE.
	 * Использует O(n²) алгоритм, что приемлемо для малого количества сущностей.
	 */
	update(): void {
		for (let i = 0; i < this.entities.length; i++) {
			if (this.entities[i].isDead()) continue;

			for (let j = i + 1; j < this.entities.length; j++) {
				if (this.entities[j].isDead()) continue;

				const dx = this.entities[i].x - this.entities[j].x;
				const dy = this.entities[i].y - this.entities[j].y;
				const distSq = dx * dx + dy * dy;

				// Если расстояние меньше минимального и не ноль (чтобы избежать деления на ноль)
				if (distSq < CollisionSystem.MIN_DISTANCE_SQ && distSq > 0) {
					const dist = Math.sqrt(distSq);
					const force = CollisionSystem.MIN_DISTANCE / dist;

					// Отталкиваем сущности в противоположные стороны
					this.entities[i].x += (dx / dist) * force;
					this.entities[i].y += (dy / dist) * force;

					this.entities[j].x -= (dx / dist) * force;
					this.entities[j].y -= (dy / dist) * force;
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
