import type { ISystem } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import type { EntityWorld } from '../core/EntityWorld';
import type Entity from '../entities/Entity';
import type { ControlSwitchService } from '../services/ControlSwitchService';
import type { Controllable } from '../types/EntityTraits';
import { isControllable } from '../types/EntityTraits';
import { eventBus } from '../events/EventBus';
import type { Unsubscribe } from '../events/EventBus';

/**
 * Система перерождения: если у умершей сущности есть чип Rebirth,
 * управление передаётся ближайшей живой управляемой сущности.
 * Чисто событийная система: update() пуст, вся логика в подписке на entityKilled.
 */
export class RebirthSystem implements ISystem {
	public readonly phase = UpdatePhase.Combat;
	public enabled = true;

	private unsubscribe: Unsubscribe | null = null;

	/**
	 * @param entityWorld - Контейнер сущностей (поиск кандидатов на перерождение)
	 * @param controlSwitch - Сервис переключения управления
	 */
	constructor(
		private readonly entityWorld: EntityWorld,
		private readonly controlSwitch: ControlSwitchService
	) {
		// entityDied, а не entityKilled: перерождение работает и без атакующего
		this.unsubscribe = eventBus.on('entityDied', ({ entity }) =>
			this.handleDeath(entity)
		);
	}

	update(): void {
		// Логика полностью событийная
	}

	/**
	 * Обрабатывает смерть сущности: при наличии чипа rebirth передаёт управление
	 * ближайшей живой управляемой сущности и расходует чип.
	 * @param victim - Умершая сущность
	 */
	private handleDeath(victim: Entity): void {
		const chipIdx = victim.inventory.chips.findIndex(
			(c) => c?.id === 'rebirth'
		);
		if (chipIdx === -1) return;

		// Перерождение — лор-хак сознания: тело может быть любым (враги, боссы),
		// поэтому фильтр по команде намеренно отсутствует
		const candidates = this.entityWorld.all.filter(
			(e): e is Entity & Controllable =>
				e !== victim &&
				e !== this.controlSwitch.getCurrentControlled() &&
				!e.isDead() &&
				isControllable(e) &&
				e.controller !== null
		);

		if (candidates.length === 0) return;

		const nearest = candidates.reduce((a, b) =>
			Math.hypot(a.x - victim.x, a.y - victim.y) <
			Math.hypot(b.x - victim.x, b.y - victim.y)
				? a
				: b
		);

		if (isControllable(victim)) {
			nearest.controller = victim.controller;
		}

		victim.inventory.chips[chipIdx] = null;

		if (victim === this.controlSwitch.getCurrentControlled()) {
			this.controlSwitch.switchTo(nearest);
		}
	}

	/**
	 * Освобождает ресурсы: отписывается от шины событий.
	 */
	dispose(): void {
		this.unsubscribe?.();
		this.unsubscribe = null;
	}
}
