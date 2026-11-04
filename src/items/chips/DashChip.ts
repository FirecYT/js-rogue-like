import Cooldown from '../../components/Cooldown';
import Entity from '../../entities/Entity';
import { Chip } from '../Chip';

/**
 * Множитель скорости при активном рывке (по умолчанию).
 */
const DASH_SPEED_MULTIPLIER = 3;

/**
 * Чип «Рывок»: при использовании временно умножает скорость сущности.
 * Умножение и снятие множителя попарны (use → onUpdate по окончании фазы),
 * поэтому одновременное использование нескольких чипов корректно
 * компонуется и не оставляет перманентного ускорения.
 */
export class DashChip implements Chip {
	id = 'dash';
	name = 'Dash';
	type = 'chip' as const;
	isActive = true;
	cooldown = new Cooldown(60);
	/** Множитель скорости рывка (настраивается админ-панелью полигона). */
	public multiplier = DASH_SPEED_MULTIPLIER;
	/** Таймер активной фазы рывка. */
	public activeCooldown = new Cooldown(30);
	/** Применён ли множитель (для парного снятия). */
	private boostedEntity: Entity | null = null;

	/**
	 * Завершает активную фазу: снимает множитель сущности.
	 * @param entity - Сущность
	 */
	onUpdate(_entity: Entity): void {
		if (this.boostedEntity && this.activeCooldown.isReady()) {
			this.boostedEntity.speedMultiplier /= this.multiplier;
			this.boostedEntity = null;
		}
		this.activeCooldown.update();
	}

	/**
	 * Запускает рывок: умножает скорость сущности до конца активной фазы.
	 * @param entity - Сущность
	 */
	use(entity: Entity): void {
		this.cooldown?.start();
		this.activeCooldown.start();
		entity.speedMultiplier *= this.multiplier;
		this.boostedEntity = entity;
	}

	/**
	 * Снятие чипа: незамедлительно снимает множитель, если рывок активен.
	 * @param entity - Сущность
	 */
	onUnequip(_entity: Entity): void {
		if (this.boostedEntity) {
			this.boostedEntity.speedMultiplier /= this.multiplier;
			this.boostedEntity = null;
		}
	}
}
