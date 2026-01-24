import Entity from "../entities/Entity";

export interface HasSpeed {
	speed: number;
}

export interface HasPosition {
	x: number;
	y: number;
}

export interface HasCooldowns {
	// No more global cooldowns - each item manages its own cooldown
}

export interface HasStats {
	damage: number;
}

export interface HasTarget {
	target: Entity;
}
