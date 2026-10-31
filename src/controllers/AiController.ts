import type { IController } from './Controller';
import type Entity from '../entities/Entity';
import type { WorldService } from '../services/WorldService';
import type { Pathfinder, Path } from '../services/Pathfinder';

/**
 * ИИ-контроллер: преследование цели с поиском пути A*, стрельба при линии видимости.
 * Кэширует путь и обновляет его раз в N кадров для снижения нагрузки.
 */
export class AiController implements IController {
	private path: Path = [];
	private pathUpdateCooldown = 0;

	/** Интервал пересчёта пути в кадрах. */
	private static readonly REPATH_INTERVAL = 60;
	/** Максимальная дистанция для начала преследования. */
	private static readonly AGGRO_RANGE = 500;
	/** Дистанция стрельбы. */
	private static readonly FIRE_RANGE = 400;

	/**
	 * @param target - Цель для преследования (обычно игрок).
	 * @param pathfinder - Система поиска пути.
	 * @param effectSystem - Система эффектов для выстрелов.
	 */
	constructor(
		private readonly target: Entity,
		private readonly pathfinder: Pathfinder
	) { }

	update(entity: Entity, world: WorldService): void {
		const distance = Math.hypot(
			this.target.x - entity.x,
			this.target.y - entity.y
		);

		// Обновляем путь периодически
		this.pathUpdateCooldown--;
		if (
			this.pathUpdateCooldown <= 0 &&
			distance < AiController.AGGRO_RANGE
		) {
			this.path = this.pathfinder.findPath({
				start: { x: entity.x, y: entity.y },
				end: { x: this.target.x, y: this.target.y },
				maxNodes: 500,
			});
			this.pathUpdateCooldown = AiController.REPATH_INTERVAL;
		}

		// Движение
		if (this.path.length > 1) {
			this.followPath(entity, world);
		} else if (distance > 10) {
			this.moveDirectly(entity, world);
		}

		// Стрельба
		this.tryShoot(entity, world, distance);
	}

	/**
	 * Движение по первому waypoint пути; при достижении — сдвиг пути.
	 */
	private followPath(entity: Entity, world: WorldService): void {
		const next = this.path[1]; // [0] — стартовая позиция
		const dx = next.x - entity.x;
		const dy = next.y - entity.y;
		const d = Math.hypot(dx, dy);

		if (d < entity.speed) {
			this.path.shift();
			return;
		}

		const nx = (dx / d) * entity.speed;
		const ny = (dy / d) * entity.speed;
		const newPos = world.tryMove(
			entity.x,
			entity.y,
			nx,
			ny,
			entity.width,
			entity.height
		);
		entity.x = newPos.x;
		entity.y = newPos.y;
	}

	/**
	 * Движение напрямую к цели (fallback, если путь не найден).
	 */
	private moveDirectly(entity: Entity, world: WorldService): void {
		const dx = this.target.x - entity.x;
		const dy = this.target.y - entity.y;
		const d = Math.hypot(dx, dy);
		if (d === 0) return;

		const nx = (dx / d) * entity.speed;
		const ny = (dy / d) * entity.speed;
		const newPos = world.tryMove(
			entity.x,
			entity.y,
			nx,
			ny,
			entity.width,
			entity.height
		);
		entity.x = newPos.x;
		entity.y = newPos.y;
	}

	/**
	 * Стрельба при наличии оружия, линии видимости и дистанции.
	 * Оружие само эмитит событие weaponFired через EventBus.
	 */
	private tryShoot(
		entity: Entity,
		world: WorldService,
		distance: number
	): void {
		if (!entity.inventory.weapon || !entity.inventory.isWeaponReady()) return;
		if (distance > AiController.FIRE_RANGE) return;

		const canSee = world.hasLineOfSight(
			entity.x,
			entity.y,
			this.target.x,
			this.target.y,
			AiController.FIRE_RANGE
		);
		if (!canSee) return;

		const angle = Math.atan2(
			this.target.y - entity.y,
			this.target.x - entity.x
		);
		entity.inventory.fire(angle);
	}
}