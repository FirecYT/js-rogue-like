import type { ISystem } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import type Entity from '../entities/Entity';
import type { InputMapper } from '../input/InputMapper';
import { InputAction } from '../input/InputAction';
import { isInteractable, Interactable } from '../types/EntityTraits';

/**
 * Система взаимодействия: ищет ближайшие интерактивные сущности рядом с управляемой
 * и обрабатывает нажатие клавиши взаимодействия (E).
 * Также предоставляет текущий интерактивный объект для HUD-подсказки.
 */
export class InteractionSystem implements ISystem {
	public readonly phase = UpdatePhase.Pickup;
	public enabled = true;

	/** Текущая интерактивная сущность в радиусе (для UI подсказки). */
	private currentInteractable: (Entity & Interactable) | null = null;

	/**
	 * @param entities - Массив всех сущностей
	 * @param getControlled - Функция получения текущей управляемой сущности
	 * @param input - Маппер действий для проверки нажатия Interact
	 */
	constructor(
		private readonly entities: Entity[],
		private readonly getControlled: () => Entity,
		private readonly input: InputMapper
	) {}

	/**
	 * Возвращает текущую интерактивную сущность в радиусе (для HUD подсказки).
	 * @returns Сущность с полями Interactable, или null
	 */
	getCurrentInteractable(): (Entity & Interactable) | null {
		return this.currentInteractable;
	}

	/**
	 * Ищет ближайшую интерактивную сущность и обрабатывает взаимодействие.
	 */
	update(): void {
		this.currentInteractable = null;
		const controlled = this.getControlled();
		if (controlled.isDead()) return;

		let nearest: (Entity & Interactable) | null = null;
		let nearestDist = Infinity;

		for (const entity of this.entities) {
			if (entity.isDead() || entity === controlled) continue;
			if (!isInteractable(entity)) continue;

			const dx = controlled.x - entity.x;
			const dy = controlled.y - entity.y;
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist < entity.interactRadius && dist < nearestDist) {
				nearest = entity;
				nearestDist = dist;
			}
		}

		if (nearest) {
			if (this.input.isPressed(InputAction.Interact)) {
				nearest.interact(controlled);
			} else {
				this.currentInteractable = nearest;
			}
		}
	}

	/**
	 * Освобождение ресурсов (не требуется).
	 */
	dispose(): void {
		// Nothing to dispose
	}
}
