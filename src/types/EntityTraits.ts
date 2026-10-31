import { IController } from '../controllers/Controller';
import Entity from '../entities/Entity';

/** Признак сущности с полем скорости */
export interface HasSpeed {
	speed: number;
}

/** Признак сущности с позицией */
export interface HasPosition {
	x: number;
	y: number;
}

/** Признак сущности с уроном */
export interface HasStats {
	damage: number;
}

/** Признак сущности с целью */
export interface HasTarget {
	target: Entity;
}

/** Признак управляемой сущности (имеет контроллер) */
export interface Controllable {
	controller: IController | null;
}

/**
 * Признак интерактивной сущности (NPC, сундук, телепорт и т.п.).
 * Сущности с этим трейтом могут быть «активированы» при нажатии клавиши взаимодействия.
 */
export interface Interactable {
	/** Отображаемое имя для подсказки (например, "Торговец", "Сундук"). */
	interactName: string;
	/** Радиус взаимодействия в пикселях. */
	interactRadius: number;
	/**
	 * Вызывается при взаимодействии с сущностью.
	 * @param actor - Сущность, которая взаимодействует (обычно игрок)
	 */
	interact(actor: Entity): void;
}

/**
 * Проверяет, является ли сущность интерактивной.
 * Проверяет наличие всех трёх полей: метод interact, имя и радиус.
 * @param entity - Сущность для проверки
 * @returns true, если сущность реализует Interactable (type guard)
 */
export function isInteractable(
	entity: Entity
): entity is Entity & Interactable {
	return (
		'interact' in entity &&
		'interactName' in entity &&
		'interactRadius' in entity &&
		typeof entity.interact === 'function'
	);
}

/**
 * Проверяет, является ли сущность управляемой (имеет контроллер).
 * @param entity - Сущность для проверки
 * @returns true, если у сущности есть поле controller (type guard)
 */
export function isControllable(
	entity: Entity
): entity is Entity & Controllable {
	return 'controller' in entity;
}
