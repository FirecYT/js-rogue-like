import type { IController } from './Controller';
import type Entity from '../entities/Entity';
import type { WorldService } from '../services/WorldService';

/**
 * Контроллер сегмента тела: держит дистанцию позади лидера.
 * Смерть лидера убивает сегмент (тело червя не переживает голову).
 */
export class FollowerController implements IController {
	/**
	 * @param getLeader - Функция получения лидера цепочки (голова или предыдущий сегмент)
	 * @param gap - Дистанция, которую сегмент держит до лидера
	 */
	constructor(
		private readonly getLeader: () => Entity | null,
		private readonly gap: number
	) {}

	/**
	 * Подтягивает сегмент к лидеру, если дистанция превышена.
	 * @param entity - Сегмент тела
	 * @param world - Сервис мира для коллизий
	 */
	update(entity: Entity, world: WorldService): void {
		const leader = this.getLeader();
		if (!leader || leader.isDead()) {
			// Тело не переживает голову
			entity.takeDamage(entity.getHP() + 1);
			return;
		}

		const dx = leader.x - entity.x;
		const dy = leader.y - entity.y;
		const distance = Math.hypot(dx, dy);
		if (distance <= this.gap) return;

		const nx = (dx / distance) * entity.speed;
		const ny = (dy / distance) * entity.speed;
		const newPos = world.tryMove(
			entity.x,
			entity.y,
			nx,
			ny,
			entity.width,
			entity.height
		);
		entity.x = newPos.x;
		entity.y = newPos.y;
	}
}
