import type { ISystem } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import type { EntityWorld } from '../core/EntityWorld';
import type Entity from '../entities/Entity';
import type { InputMapper } from '../input/InputMapper';
import { InputAction } from '../input/InputAction';
import { isInteractable } from '../types/Interactable';
import type { Interactable } from '../types/Interactable';

/**
 * Система взаимодействия: находит ближайший Interactable рядом с управляемой
 * сущностью и вызывает interact() по клавише действия. Подсказку для HUD
 * система отдаёт через getInteractInRange().
 */
export class InteractSystem implements ISystem {
	public readonly phase = UpdatePhase.Pickup;
	public enabled = true;

	/** Радиус взаимодействия в пикселях. */
	private static readonly INTERACT_RANGE = 32;

	private interactInRange: (Entity & Interactable) | null = null;

	/**
	 * @param entityWorld - Контейнер всех сущностей игры
	 * @param getControlled - Функция получения текущей управляемой сущности
	 * @param input - Маппер действий для проверки нажатия клавиши взаимодействия
	 */
	constructor(
		private readonly entityWorld: EntityWorld,
		private readonly getControlled: () => Entity,
		private readonly input: InputMapper
	) {}

	/**
	 * Возвращает объект взаимодействия в радиусе (для подсказки HUD).
	 */
	getInteractInRange(): (Entity & Interactable) | null {
		return this.interactInRange;
	}

	/**
	 * Ищет ближайший Interactable и обрабатывает нажатие клавиши взаимодействия.
	 */
	update(): void {
		this.interactInRange = null;
		const controlled = this.getControlled();

		for (const entity of this.entityWorld.all) {
			if (entity.isDead() || !isInteractable(entity)) continue;

			const dx = controlled.x - entity.x;
			const dy = controlled.y - entity.y;
			const distance = Math.sqrt(dx * dx + dy * dy);
			if (distance >= InteractSystem.INTERACT_RANGE) continue;

			if (this.input.isPressed(InputAction.Interact)) {
				entity.interact(controlled);
			} else {
				this.interactInRange = entity;
			}
			break;
		}
	}

	/**
	 * Освобождение ресурсов (не требуется).
	 */
	dispose(): void {
		// Nothing to dispose
	}
}
