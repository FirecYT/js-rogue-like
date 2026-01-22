import Cooldown from "../components/Cooldown";
import Entity from "../entities/Entity";

export interface HasSpeed {
	speed: number;
}

export interface HasPosition {
	x: number;
	y: number;
}

export interface HasCooldowns {
	fireCooldown?: Cooldown;
	dashCooldown?: Cooldown;
	dashActive?: Cooldown;
}

export interface HasStats {
	damage: number;
}

export interface HasTarget {
	target: Entity;
}
