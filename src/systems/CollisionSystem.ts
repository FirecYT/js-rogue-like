import type { ISystem } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import type { EntityWorld } from '../core/EntityWorld';
import type { WorldService } from '../services/WorldService';
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
	 * @param entityWorld - Контейнер всех сущностей игры
	 * @param world - Сервис мира: расталкивание не должно протаскивать сущности сквозь стены
	 */
	constructor(
		private readonly entityWorld: EntityWorld,
		private readonly world: WorldService
	) {}

	/**
	 * Проверяет все пары «твёрдых» сущностей и разводит их до MIN_DISTANCE
	 * (по половине перекрытия каждой), не протаскивая сквозь стены.
	 * Использует O(n²) алгоритм, что приемлемо для малого количества сущностей.
	 */
	update(): void {
		const entities = this.entityWorld.all;
		for (let i = 0; i < entities.length; i++) {
			const a = entities[i];
			if (a.isDead() || !a.solid) continue;

			for (let j = i + 1; j < entities.length; j++) {
				const b = entities[j];
				if (b.isDead() || !b.solid) continue;

				const dx = a.x - b.x;
				const dy = a.y - b.y;
				const distSq = dx * dx + dy * dy;

				if (distSq >= CollisionSystem.MIN_DISTANCE_SQ || distSq === 0) {
					continue;
				}

				const dist = Math.sqrt(distSq);
				// Ровно столько, чтобы развести центры до MIN_DISTANCE (по половине каждой)
				const push = (CollisionSystem.MIN_DISTANCE - dist) / 2;
				const ux = dx / dist;
				const uy = dy / dist;

				this.pushEntity(a, ux * push, uy * push);
				this.pushEntity(b, -ux * push, -uy * push);
			}
		}
	}

	/**
	 * Смещает сущность с проверкой коллизий со стенами (скольжение вдоль них).
	 */
	private pushEntity(entity: Entity, dx: number, dy: number): void {
		const next = this.world.tryMove(
			entity.x,
			entity.y,
			dx,
			dy,
			entity.width,
			entity.height
		);
		entity.x = next.x;
		entity.y = next.y;
	}

	/**
	 * Освобождение ресурсов (не требуется для этой системы).
	 */
	dispose(): void {
		// Nothing to dispose
	}
}
