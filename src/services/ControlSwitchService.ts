import type Entity from '../entities/Entity';
import type { PlayerController } from '../controllers/PlayerController';
import type { Controllable } from '../types/EntityTraits';

/**
 * Сервис переключения управления: хранит текущую управляемую сущность
 * и передаёт контроллер игрока другой сущности (например, после перерождения).
 */
export class ControlSwitchService {
	private currentControlled: Entity & Controllable;

	/**
	 * @param player - Начальная управляемая сущность (игрок)
	 * @param playerController - Контроллер игрока (при переключании передаётся новой сущности)
	 */
	constructor(
		player: Entity & Controllable,
		private readonly playerController: PlayerController
	) {
		this.currentControlled = player;
	}

	/**
	 * Возвращает текущую управляемую сущность.
	 */
	getCurrentControlled(): Entity {
		return this.currentControlled;
	}

	/**
	 * Переключает управление на другую сущность: у текущей забирает контроллер,
	 * новой ставит контроллер игрока.
	 * @param entity - Новая сущность под управлением
	 */
	switchTo(entity: Entity & Controllable): void {
		if (entity === this.currentControlled || entity.isDead()) return;
		this.currentControlled.controller = null;
		this.currentControlled = entity;
		this.currentControlled.controller = this.playerController;
	}
}
