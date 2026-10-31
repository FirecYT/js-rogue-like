import type Entity from '../entities/Entity';

/**
 * Признак сущности, с которой можно взаимодействовать клавишей действия
 * (алтари, торговцы, терминалы…). Не является предметом подбора.
 */
export interface Interactable {
	/** Подсказка для HUD (например, «[E] Призвать хранителя»). */
	readonly interactLabel: string;
	/**
	 * Выполняет взаимодействие.
	 * @param actor - Сущность, взаимодействующая с объектом
	 */
	interact(actor: Entity): void;
}

/**
 * Проверяет, поддерживает ли объект взаимодействие.
 * @param obj - Проверяемый объект
 * @returns true, если объект реализует Interactable (type guard)
 */
export function isInteractable(obj: unknown): obj is Interactable {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		typeof (obj as Interactable).interact === 'function' &&
		typeof (obj as Interactable).interactLabel === 'string'
	);
}
