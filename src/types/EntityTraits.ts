import { Controller } from "../controllers/Controller";
import Entity from "../entities/Entity";

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
	controller: Controller | null;
}

/**
 * Проверяет, является ли сущность управляемой (имеет контроллер).
 * @param entity - Сущность для проверки
 * @returns true, если у сущности есть поле controller (type guard)
 */
export function isControllable(entity: Entity): entity is Entity & Controllable {
	return 'controller' in entity;
}
