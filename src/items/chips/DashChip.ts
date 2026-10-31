import Cooldown from '../../components/Cooldown';
import Entity from '../../entities/Entity';
import { Chip } from '../Chip';

/**
 * Множитель скорости при активном рывке.
 */
const DASH_SPEED_MULTIPLIER = 3;

/**
 * Чип «Рывок»: при использовании временно увеличивает скорость сущности.
 * Использует множитель от базовой скорости, чтобы не перезаписывать оригинальное значение (SRP).
 */
export class DashChip implements Chip {
	id = 'dash';
	name = 'Dash';
	type = 'chip' as const;
	isActive = true;
	cooldown = new Cooldown(60);
	/** Таймер активной фазы рывка. */
	public activeCooldown = new Cooldown(30);
	/** Сохранённая базовая скорость (для восстановления после рывка). */
	private baseSpeed: number | null = null;

	/**
	 * Поддерживает активную фазу: умножает базовую скорость на множитель.
	 * При окончании активной фазы восстанавливает базовую скорость.
	 * @param entity - Сущность
	 */
	onUpdate(entity: Entity): void {
		if (!this.activeCooldown.isReady()) {
			// Активная фаза: сохраняем базовую скорость при первом вызове
			if (this.baseSpeed === null) {
				this.baseSpeed = entity.speed;
			}
			entity.speed = this.baseSpeed * DASH_SPEED_MULTIPLIER;
		} else {
			// Восстанавливаем базовую скорость
			if (this.baseSpeed !== null) {
				entity.speed = this.baseSpeed;
				this.baseSpeed = null;
			}
		}
		this.activeCooldown.update();
	}

	/**
	 * Запускает перезарядку и активную фазу рывка.
	 * @param entity - Сущность (не используется напрямую)
	 */
	use(entity: Entity): void {
		void entity;
		this.cooldown?.start();
		this.activeCooldown.start();
	}
}
