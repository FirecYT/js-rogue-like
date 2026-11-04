import Cooldown from '../../components/Cooldown';
import type Entity from '../../entities/Entity';
import { Chip } from '../Chip';

/**
 * Чип «Щит»: на короткую фазу носитель полностью неуязвим.
 * Установка и снятие флага парные (use → onUpdate/onUnequip), как у рывка:
 * чип не оставляет постоянного состояния даже при снятии mid-фазы.
 */
export class ShieldChip implements Chip {
	id = 'shield';
	name = 'Shield';
	type = 'chip' as const;
	isActive = true;
	cooldown = new Cooldown(1200);
	/** Таймер активной фазы неуязвимости. */
	public activeCooldown = new Cooldown(240);
	/** Сущность, которой чип установил неуязвимость (для парного снятия). */
	private shielded: Entity | null = null;

	/**
	 * Завершает активную фазу: снимает неуязвимость по таймеру.
	 */
	onUpdate(): void {
		if (this.shielded && this.activeCooldown.isReady()) {
			this.shielded.invulnerable = false;
			this.shielded = null;
		}
		this.activeCooldown.update();
	}

	/**
	 * Включает щит: неуязвимость до конца активной фазы.
	 * @param entity - Носитель чипа
	 */
	use(entity: Entity): void {
		this.activeCooldown.start();
		entity.invulnerable = true;
		this.shielded = entity;
	}

	/**
	 * Снятие чипа: незамедлительно убирает неуязвимость, если фаза активна.
	 */
	onUnequip(): void {
		if (this.shielded) {
			this.shielded.invulnerable = false;
			this.shielded = null;
		}
	}
}
