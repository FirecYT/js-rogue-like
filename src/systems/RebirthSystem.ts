import { eventBus } from '../events/EventBus';
import Entity from '../entities/Entity';
import { ControlSwitchSystem } from './ControlSwitchSystem';
import { Controllable, isControllable } from '../types/EntityTraits';

/**
 * Система перерождения: при смерти сущности с чипом Rebirth управление передаётся ближайшей союзной управляемой сущности.
 */
export class RebirthSystem {
	/**
	 * Подписывается на enemyKilled: если жертва имела чип rebirth, ищет ближайшую союзную сущность и передаёт ей контроллер; при необходимости переключает управление.
	 * @param entities - Массив всех сущностей
	 * @param controlSwitchSystem - Система переключения управления
	 */
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
				isControllable(e)
			) as (Entity & Controllable)[];

			if (candidates.length === 0) return;

			const nearest = candidates.reduce((a, b) =>
				Math.hypot(a.x - victim.x, a.y - victim.y) <
				Math.hypot(b.x - victim.x, b.y - victim.y) ? a : b
			);

			if (isControllable(victim)) {
				nearest.controller = victim.controller;
			}

			victim.inventory.chips[chipIdx] = null;

			if (victim === this.controlSwitchSystem.getCurrentControlled()) {
				this.controlSwitchSystem.switchTo(nearest);
			}
		});
	}
}
