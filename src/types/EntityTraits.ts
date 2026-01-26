import { Controller } from "../controllers/Controller";
import Entity from "../entities/Entity";

export interface HasSpeed {
	speed: number;
}

export interface HasPosition {
	x: number;
	y: number;
}

export interface HasStats {
	damage: number;
}

export interface HasTarget {
	target: Entity;
}

export interface Controllable {
	controller: Controller | null;
}
