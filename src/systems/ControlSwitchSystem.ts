import Entity from '../entities/Entity';
import { PlayerController } from '../controllers/PlayerController';
import { Controllable } from '../types/EntityTraits';

/**
 * Система переключения управления: текущая управляемая сущность и переключение на другую (например, после перерождения).
 */
export class ControlSwitchSystem {
	private currentControlled: Entity & Controllable;

	/**
	 * @param player - Начальная управляемая сущность (игрок)
	 * @param playerController - Контроллер игрока (при переключении передаётся новой сущности)
	 */
	constructor(
		player: Entity & Controllable,
		private playerController: PlayerController
	) {
		this.currentControlled = player;
	}

	/**
	 * Возвращает текущую управляемую сущность.
	 * @returns Сущность под управлением
	 */
	getCurrentControlled(): Entity {
		return this.currentControlled;
	}

	/**
	 * Переключает управление на другую сущность (у текущей убирает контроллер, у новой ставит playerController).
	 * @param entity - Новая сущность под управлением
	 */
	switchTo(entity: Entity & Controllable): void {
		if (entity === this.currentControlled || entity.isDead()) return;
		this.currentControlled.controller = null;
		this.currentControlled = entity;
		this.currentControlled.controller = this.playerController;
	}
}
