import type { IController } from './Controller';
import type Entity from '../entities/Entity';
import type { WorldService } from '../services/WorldService';
import type { AiProfile, AiPhase } from '../content/entities/definitions';
import type { DeclarativeEntity } from '../entities/DeclarativeEntity';

/** Скорость поворота ствола, радиан за кадр. */
const TURN_RATE = 0.03;

/**
 * Контроллер турели: не движется, поворачивает ствол к цели в аггро-радиусе
 * и бьёт очередью заклинаний оружия по линии видимости. Второй эталон
 * поведения боссов на конвейере (первый — червь).
 */
export class TurretController implements IController {
	private heading = 0;
	/** Индекс текущей фазы босса (0 — базовая; для отладки и смоука). */
	public phaseIndex = 0;
	/** Базовые характеристики оружия, захваченные до первых модификаций фаз. */
	private baseWeapon: {
		fireRate: number;
		shots: number;
		shotSpread: number;
	} | null = null;

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
		this.updatePhase(entity);

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

	/**
	 * Фазы босса: выбирает последнюю фазу, чей порог hpBelow достигнут,
	 * и при переключении применяет её паттерн к оружию и внешности.
	 * Фазы только усиливают турель по мере падения HP — образец конвейера.
	 * @param entity - Сущность турели
	 */
	private updatePhase(entity: Entity): void {
		const phases = this.profile.phases;
		if (!phases || phases.length === 0) return;

		const fraction = entity.getHP() / entity.maxHP;
		let index = 0;
		for (let i = 0; i < phases.length; i++) {
			if (fraction <= phases[i].hpBelow) index = i;
		}
		if (index === this.phaseIndex && this.baseWeapon) return;

		const weapon = entity.inventory.weapon;
		if (!weapon) return;
		if (!this.baseWeapon) {
			this.baseWeapon = {
				fireRate: weapon.fireRate,
				shots: weapon.shots,
				shotSpread: weapon.shotSpread,
			};
		}
		this.phaseIndex = index;
		const phase: AiPhase = phases[index];
		weapon.fireRate = this.baseWeapon.fireRate * (phase.fireRateMult ?? 1);
		weapon.shots = phase.shots ?? this.baseWeapon.shots;
		weapon.shotSpread = phase.spread ?? this.baseWeapon.shotSpread;
		weapon.damageMultiplier = phase.damageMult ?? 1;
		const decl = entity as DeclarativeEntity;
		if ('colorOverride' in decl) decl.colorOverride = phase.color ?? null;
	}
}
