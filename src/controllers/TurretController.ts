import type { IController } from './Controller';
import type Entity from '../entities/Entity';
import type { WorldService } from '../services/WorldService';
import type { AiProfile } from '../content/entities/definitions';

/** Скорость поворота ствола, радиан за кадр. */
const TURN_RATE = 0.03;

/**
 * Контроллер турели: не движется, поворачивает ствол к цели в аггро-радиусе
 * и бьёт очередью заклинаний оружия по линии видимости. Второй эталон
 * поведения боссов на конвейере (первый — червь).
 */
export class TurretController implements IController {
	private heading = 0;

	/**
	 * @param getTarget - Функция получения текущей цели
	 * @param profile - Профиль поведения из определения сущности
	 */
	constructor(
		private readonly getTarget: () => Entity,
		private readonly profile: AiProfile
	) {}

	/**
	 * Поворот к цели и залп при линии видимости.
	 * @param entity - Сущность турели
	 * @param world - Сервис мира для проверки видимости
	 */
	update(entity: Entity, world: WorldService): void {
		const target = this.getTarget();
		const dx = target.x - entity.x;
		const dy = target.y - entity.y;
		const distance = Math.hypot(dx, dy);
		const fireRange = this.profile.fireRange ?? 450;

		if (distance > fireRange || target.isDead()) return;

		const desired = Math.atan2(dy, dx);
		let delta = desired - this.heading;
		while (delta > Math.PI) delta -= Math.PI * 2;
		while (delta < -Math.PI) delta += Math.PI * 2;
		this.heading += Math.max(-TURN_RATE, Math.min(TURN_RATE, delta));

		const canSee = world.hasLineOfSight(
			entity.x,
			entity.y,
			target.x,
			target.y,
			fireRange
		);
		if (!canSee) return;

		if (entity.inventory.weapon && entity.inventory.isWeaponReady()) {
			entity.inventory.fire(this.heading);
		}
	}

	/**
	 * Возвращает текущий курс ствола (наследование при переходе управления).
	 * @returns Курс в радианах
	 */
	getHeading(): number {
		return this.heading;
	}
}
