import type { IController } from './Controller';
import type Entity from '../entities/Entity';
import type { WorldService } from '../services/WorldService';
import type { AiProfile } from '../content/entities/definitions';

/**
 * Контроллер головы червя: направленное движение с поперечной волной.
 * Вне аггро-радиуса голова патрулирует (плавно поворачивает), внутри —
 * держит курс на цель с волнообразным рысканием и бьёт залпами из оружия.
 */
export class WormController implements IController {
	/** Текущий курс головы в радианах. */
	private heading = Math.random() * Math.PI * 2;
	/** Фаза поперечной волны. */
	private wavePhase = Math.random() * Math.PI * 2;
	/** Скорость поворота курса к цели, радиан за кадр. */
	private static readonly TURN_RATE = 0.04;
	/** Скорость блуждания курса в патруле, радиан за кадр. */
	private static readonly WANDER_RATE = 0.008;

	/**
	 * @param getTarget - Функция получения текущей цели (переживает перерождение)
	 * @param profile - Профиль поведения из определения сущности
	 */
	constructor(
		private readonly getTarget: () => Entity,
		private readonly profile: AiProfile
	) {}

	/**
	 * Возвращает текущий курс головы (для наследования игроком при переходе управления).
	 * @returns Курс в радианах
	 */
	getHeading(): number {
		return this.heading;
	}

	/**
	 * Обновляет курс, движение и стрельбу головы.
	 * @param entity - Голова червя
	 * @param world - Сервис мира для коллизий
	 */
	update(entity: Entity, world: WorldService): void {
		const target = this.getTarget();
		const dx = target.x - entity.x;
		const dy = target.y - entity.y;
		const distance = Math.hypot(dx, dy);
		const aggroRange = this.profile.aggroRange ?? 500;

		if (distance < aggroRange && !target.isDead()) {
			const desired = Math.atan2(dy, dx);
			this.heading = this.turnTowards(desired, WormController.TURN_RATE);
		} else {
			// Патруль: курс медленно дрейфует
			this.heading += WormController.WANDER_RATE;
		}

		this.wavePhase += this.profile.waveFrequency ?? 0.05;
		const amplitude = this.profile.waveAmplitude ?? 0.4;
		const course = this.heading + Math.sin(this.wavePhase) * amplitude;

		const nx = Math.cos(course) * entity.speed;
		const ny = Math.sin(course) * entity.speed;
		const newPos = world.tryMove(
			entity.x,
			entity.y,
			nx,
			ny,
			entity.width,
			entity.height
		);

		// Упор в препятствие: подруливаем курсом, чтобы червь обтекал преграду
		if (newPos.x === entity.x && newPos.y === entity.y) {
			this.heading += 0.3;
		}
		entity.x = newPos.x;
		entity.y = newPos.y;

		this.tryShoot(entity, distance, target);
	}

	/**
	 * Поворачивает курс к желаемому направлению с ограниченной скоростью.
	 * @param desired - Желаемый курс в радианах
	 * @param rate - Максимальный поворот за кадр
	 * @returns Новый курс
	 */
	private turnTowards(desired: number, rate: number): number {
		let delta = desired - this.heading;
		while (delta > Math.PI) delta -= Math.PI * 2;
		while (delta < -Math.PI) delta += Math.PI * 2;
		const step = Math.max(-rate, Math.min(rate, delta));
		return this.heading + step;
	}

	/**
	 * Залп по цели в радиусе огня: очередь заклинаний оружия сама
	 * разрешает каст и эмитит weaponFired.
	 * @param entity - Голова червя
	 * @param distance - Дистанция до цели
	 * @param target - Цель
	 */
	private tryShoot(entity: Entity, distance: number, target: Entity): void {
		if (!entity.inventory.weapon || !entity.inventory.isWeaponReady()) return;
		if (distance > (this.profile.fireRange ?? 400)) return;

		const angle = Math.atan2(target.y - entity.y, target.x - entity.x);
		entity.inventory.fire(angle);
	}
}
