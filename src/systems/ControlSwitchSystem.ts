import Entity from '../entities/Entity';
import { PlayerController } from '../controllers/PlayerController';
import { Controllable } from '../types/EntityTraits';

export class ControlSwitchSystem {
	private currentControlled: Entity & Controllable;

	constructor(
		player: Entity & Controllable,
		private playerController: PlayerController,
	) {
		this.currentControlled = player;
	}

	getCurrentControlled(): Entity {
		return this.currentControlled;
	}

	switchTo(entity: Entity & Controllable): void {
		if (entity === this.currentControlled || entity.isDead()) return;
		this.currentControlled.controller = null;
		this.currentControlled = entity;
		this.currentControlled.controller = this.playerController;
	}
}
