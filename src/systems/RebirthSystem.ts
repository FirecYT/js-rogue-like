import { eventBus } from '../events/EventBus';
import Entity from '../entities/Entity';
import { ControlSwitchSystem } from './ControlSwitchSystem';
import { Controllable } from '../types/EntityTraits';
import { Controller } from '../controllers/Controller';

export class RebirthSystem {
	constructor(
		private entities: Entity[],
		private controlSwitchSystem: ControlSwitchSystem
	) {
		eventBus.on('enemyKilled', ({ victim }) => {
			const chipIdx = victim.inventory.chips.findIndex(c => c?.id === 'rebirth');

			if (chipIdx === -1) return;

			const candidates: (Entity & Controllable)[] = this.entities.filter(e =>
				e !== victim &&
				e !== this.controlSwitchSystem.getCurrentControlled() &&
				!e.isDead() &&
				'controller' in e
			) as (Entity & Controllable)[];

			if (candidates.length === 0) return;

			const nearest = candidates.reduce((a, b) =>
				Math.hypot(a.x - victim.x, a.y - victim.y) <
					Math.hypot(b.x - victim.x, b.y - victim.y) ? a : b
			);

			if ('controller' in victim) {
				nearest.controller = victim.controller as Controller;
			}

			victim.inventory.chips[chipIdx] = null;

			if (victim === this.controlSwitchSystem.getCurrentControlled()) {
				this.controlSwitchSystem.switchTo(nearest);
			}
		});
	}
}
