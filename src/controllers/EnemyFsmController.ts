import type { IController } from './Controller';
import type Entity from '../entities/Entity';
import type { WorldService } from '../services/WorldService';
import type { Pathfinder, Path } from '../services/Pathfinder';
import type { AiProfile } from '../content/entities/definitions';
import type { EffectSystem } from '../systems/EffectSystem';
import { ExplosionEffect } from '../effects/ExplosionEffect';

/**
 * Состояния FSM-врага:
 * - idle: блуждание у точки спавна с паузами (враг «живёт», а не замирает);
 * - chase: погоня за целью с A* и памятью последней видимой позиции;
 * - search: проверка последней известной позиции, короткий обыск местности;
 * - flee: бегство от цели (трусливые архетипы на низком HP);
 * - return: уход домой на «поводке»: постепенное лечение, в точке спавна — полное.
 */
export type EnemyFsmState = 'idle' | 'chase' | 'search' | 'flee' | 'return';

/** Сколько кадров помним цель без линии видимости. */
const MEMORY_FRAMES = 180;
/** Сколько кадров ищем цель в последней известной позиции. */
const SEARCH_FRAMES = 240;
/** Сколько кадров помним, что нас ударили (аггро по атакующему). */
const DAMAGE_MEMORY_FRAMES = 300;

/**
 * Полноценный ИИ рядовых врагов (этап 10): конечный автомат состояний с
 * блужданием в покое, аггро по видимости/урону, памятью цели, «поводком»
 * и возвратом домой с лечением. Поведение в бою задаётся декларативно
 * (AiProfile.behavior): chaser, kiter, kamikaze, timid.
 */
export class EnemyFsmController implements IController {
	/** Текущее состояние (публично для отладки и смоук-тестов). */
	public state: EnemyFsmState = 'idle';

	private path: Path = [];
	private repathCooldown = 0;
	private memoryTimer = 0;
	private lastKnown: { x: number; y: number } | null = null;
	private searchTimer = 0;
	private wanderTarget: { x: number; y: number } | null = null;
	private wanderPause = 0;
	private prevHP: number | null = null;
	private damageMemory = 0;
	private healTick = 0;

	/**
	 * @param getTarget - Функция получения текущей цели (управляемая сущность)
	 * @param pathfinder - Поиск пути для погони и возврата
	 * @param profile - Декларативный профиль поведения из определения
	 * @param effectSystem - Система эффектов (взрыв камикадзе)
	 */
	constructor(
		private readonly getTarget: () => Entity,
		private readonly pathfinder: Pathfinder,
		public readonly profile: AiProfile,
		private readonly effectSystem?: EffectSystem
	) {}

	update(entity: Entity, world: WorldService): void {
		const target = this.getTarget();
		const targetAlive = !target.isDead();
		const dist = Math.hypot(target.x - entity.x, target.y - entity.y);
		const distHome = Math.hypot(
			entity.x - entity.spawnX,
			entity.y - entity.spawnY
		);
		const aggroRange = this.profile.aggroRange ?? 500;
		const leashRange = this.profile.leashRange ?? 1500;
		const hpFrac = entity.getHP() / entity.maxHP;

		// Память урона: атакованный враг агрится даже из-за предела видимости
		const hp = entity.getHP();
		if (this.prevHP !== null && hp < this.prevHP) {
			this.damageMemory = DAMAGE_MEMORY_FRAMES;
		}
		this.prevHP = hp;
		if (this.damageMemory > 0) this.damageMemory--;

		// Аггро только по факту обнаружения: прямая видимость в радиусе агро
		// ИЛИ недавний урон от цели (атакованный враг знает, откуда прилетело).
		// Сквозь стены на дистанции никто не «чувствует» игрока.
		const seesNow =
			dist < aggroRange &&
			world.hasLineOfSight(entity.x, entity.y, target.x, target.y, aggroRange);
		const aggro =
			targetAlive &&
			(seesNow || (this.damageMemory > 0 && dist < aggroRange * 1.5));

		switch (this.state) {
			case 'idle':
				this.updateIdle(entity, world, aggro);
				break;
			case 'chase':
				this.updateChase(entity, world, target, dist, distHome, hpFrac, aggro, leashRange);
				break;
			case 'search':
				this.updateSearch(entity, world, aggro);
				break;
			case 'flee':
				this.updateFlee(entity, world, target, dist, aggroRange);
				break;
			case 'return':
				this.updateReturn(entity, world, distHome, aggro, leashRange);
				break;
		}
	}

	/** Покой: блуждание у точки спавна с случайными паузами. */
	private updateIdle(entity: Entity, world: WorldService, aggro: boolean): void {
		if (aggro) {
			this.enterChase(entity);
			return;
		}
		const radius = this.profile.wanderRadius ?? 180;
		if (this.wanderPause > 0) {
			this.wanderPause--;
			return;
		}
		if (
			!this.wanderTarget ||
			Math.hypot(this.wanderTarget.x - entity.x, this.wanderTarget.y - entity.y) < 12
		) {
			const angle = Math.random() * Math.PI * 2;
			const r = Math.random() * radius;
			this.wanderTarget = {
				x: entity.spawnX + Math.cos(angle) * r,
				y: entity.spawnY + Math.sin(angle) * r,
			};
			this.path = [];
			if (Math.random() < 0.4) this.wanderPause = 60 + Math.floor(Math.random() * 120);
		}
		if (this.wanderPause > 0) {
			this.wanderPause--;
			return;
		}
		this.moveToPoint(entity, world, this.wanderTarget.x, this.wanderTarget.y, 0.5);
	}

	/** Погоня: поведение по архетипу, память цели, поводок. */
	private updateChase(
		entity: Entity,
		world: WorldService,
		target: Entity,
		dist: number,
		distHome: number,
		hpFrac: number,
		aggro: boolean,
		leashRange: number
	): void {
		if (distHome > leashRange) {
			this.enterReturn();
			return;
		}
		if (!aggro && this.memoryTimer <= 0) {
			this.enterReturn();
			return;
		}

		const fireRange = this.profile.fireRange ?? 400;
		const losRange = Math.max(aggroRangeSafe(this.profile), fireRange) + 100;
		const canSee =
			dist <= losRange &&
			world.hasLineOfSight(entity.x, entity.y, target.x, target.y, losRange);
		if (canSee) {
			this.lastKnown = { x: target.x, y: target.y };
			this.memoryTimer = MEMORY_FRAMES;
		} else if (this.memoryTimer > 0) {
			this.memoryTimer--;
			if (this.memoryTimer <= 0) {
				this.enterSearch();
				return;
			}
		}

		const behavior = this.profile.behavior ?? 'chaser';

		// Камикадзе: разгон и самоподрыв рядом с целью
		if (behavior === 'kamikaze') {
			const trigger = this.profile.explodeTrigger ?? 34;
			if (dist < trigger) {
				this.explode(entity);
				return;
			}
			const mult = this.profile.chargeSpeedMult ?? 1.8;
			const kamiGoal =
				canSee || !this.lastKnown
					? { x: target.x, y: target.y }
					: this.lastKnown;
			this.moveAlong(entity, world, kamiGoal.x, kamiGoal.y, mult, canSee);
			return;
		}

		// Трусливый: на низком HP сбегает
		if (behavior === 'timid' && hpFrac < (this.profile.fleeBelow ?? 0.3)) {
			this.state = 'flee';
			this.path = [];
			return;
		}

		// Кайтер: держит дистанцию огня, отходит при сближении
		if (behavior === 'kiter') {
			const keep = fireRange * 0.75;
			if (dist < fireRange * 0.55) {
				// Отходим от цели
				const away = {
					x: entity.x + (entity.x - target.x),
					y: entity.y + (entity.y - target.y),
				};
				this.moveToPoint(entity, world, away.x, away.y, 1, false);
			} else if (dist > keep) {
				const kiteGoal =
					canSee || !this.lastKnown
						? { x: target.x, y: target.y }
						: this.lastKnown;
				this.moveAlong(entity, world, kiteGoal.x, kiteGoal.y, 1, canSee);
			}
			this.tryShoot(entity, world, target, dist, fireRange, canSee);
			return;
		}

		// chaser/timid(полный HP): сближаемся и стреляем на ходу
		const goal = canSee || !this.lastKnown ? { x: target.x, y: target.y } : this.lastKnown;
		this.moveAlong(entity, world, goal.x, goal.y, 1, canSee);
		this.tryShoot(entity, world, target, dist, fireRange, canSee);
	}

	/** Обыск последней известной позиции, затем — возврат домой. */
	private updateSearch(entity: Entity, world: WorldService, aggro: boolean): void {
		if (aggro) {
			this.enterChase(entity);
			return;
		}
		if (this.searchTimer <= 0) {
			this.enterReturn();
			return;
		}
		this.searchTimer--;
		if (this.lastKnown) {
			const d = Math.hypot(this.lastKnown.x - entity.x, this.lastKnown.y - entity.y);
			if (d > 16) {
				this.moveToPoint(entity, world, this.lastKnown.x, this.lastKnown.y, 0.8);
			} else if (this.searchTimer % 60 === 0) {
				// Осматриваемся: короткие тычки вокруг точки
				const angle = Math.random() * Math.PI * 2;
				this.moveToPoint(
					entity,
					world,
					this.lastKnown.x + Math.cos(angle) * 60,
					this.lastKnown.y + Math.sin(angle) * 60,
					0.6
				);
			}
		}
	}

	/** Бегство: прямо от цели, пока не оторвались. */
	private updateFlee(
		entity: Entity,
		world: WorldService,
		target: Entity,
		dist: number,
		aggroRange: number
	): void {
		if (dist > aggroRange * 1.5) {
			this.enterReturn();
			return;
		}
		const away = {
			x: entity.x + (entity.x - target.x) * 2,
			y: entity.y + (entity.y - target.y) * 2,
		};
		this.moveToPoint(entity, world, away.x, away.y, 1.25, false);
	}

	/** Возврат домой на поводке: лечение в пути, полное — в точке спавна. */
	private updateReturn(
		entity: Entity,
		world: WorldService,
		distHome: number,
		aggro: boolean,
		leashRange: number
	): void {
		// Дома: полное восстановление и снова покой
		if (distHome < 24) {
			entity.setHP(entity.maxHP);
			this.state = 'idle';
			this.path = [];
			this.wanderTarget = null;
			return;
		}
		// Снова в бою и недалеко от дома — возвращаемся в погоню
		if (aggro && distHome < leashRange * 0.8) {
			this.enterChase(entity);
			return;
		}
		// Постепенное лечение в пути
		this.healTick++;
		if (this.healTick >= 30) {
			this.healTick = 0;
			entity.heal(1);
		}
		this.moveToPoint(entity, world, entity.spawnX, entity.spawnY, 1.1);
	}

	/** Самоподрыв камикадзе: взрыв-эффект и смерть без атакующего. */
	private explode(entity: Entity): void {
		if (this.effectSystem) {
			this.effectSystem.add(
				new ExplosionEffect(
					entity.x,
					entity.y,
					entity,
					this.profile.explodeDamage ?? 18,
					this.profile.explodeRadius ?? 70
				)
			);
		}
		entity.takeDamage(999999);
	}

	/** Стрельба по цели при линии видимости и готовности оружия. */
	private tryShoot(
		entity: Entity,
		_world: WorldService,
		target: Entity,
		dist: number,
		fireRange: number,
		canSee: boolean
	): void {
		if (!canSee || dist > fireRange) return;
		if (!entity.inventory.weapon || !entity.inventory.isWeaponReady()) return;
		const angle = Math.atan2(target.y - entity.y, target.x - entity.x);
		entity.inventory.fire(angle);
	}

	/**
	 * Движение к точке: кэшированный A*-путь с периодическим пересчётом,
	 * при отсутствии пути — прямолинейный ход.
	 * @param entity - Сущность
	 * @param world - Сервис мира (коллизии)
	 * @param tx - Цель X
	 * @param ty - Цель Y
	 * @param speedMult - Множитель скорости (рывок камикадзе, бегство)
	 * @param usePath - Строить ли A*-путь (false — только прямой ход)
	 */
	private moveToPoint(
		entity: Entity,
		world: WorldService,
		tx: number,
		ty: number,
		speedMult = 1,
		usePath = true
	): void {
		const speed = entity.speed * speedMult;
		this.repathCooldown--;
		if (usePath && this.repathCooldown <= 0) {
			this.path = this.pathfinder.findPath({
				start: { x: entity.x, y: entity.y },
				end: { x: tx, y: ty },
				maxNodes: 500,
			});
			this.repathCooldown = this.profile.repathInterval ?? 60;
		}

		let nx = 0;
		let ny = 0;
		if (usePath && this.path.length > 1) {
			const next = this.path[1];
			const dx = next.x - entity.x;
			const dy = next.y - entity.y;
			const d = Math.hypot(dx, dy);
			if (d < speed) {
				this.path.shift();
				return;
			}
			nx = (dx / d) * speed;
			ny = (dy / d) * speed;
		} else {
			const dx = tx - entity.x;
			const dy = ty - entity.y;
			const d = Math.hypot(dx, dy);
			if (d < 4) return;
			nx = (dx / d) * speed;
			ny = (dy / d) * speed;
		}

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
	 * Боевое перемещение: всегда через A*-путь (враг огибает стены, а не
	 * давит в них); прямолинейный ход допустим только при видимости цели.
	 * Без пути и без видимости враг стоит на месте — дальше отработает
	 * память цели (search) и возврат домой.
	 * @param entity - Сущность
	 * @param world - Сервис мира (коллизии)
	 * @param tx - Цель X
	 * @param ty - Цель Y
	 * @param speedMult - Множитель скорости
	 * @param canSee - Видна ли цель сейчас
	 */
	private moveAlong(
		entity: Entity,
		world: WorldService,
		tx: number,
		ty: number,
		speedMult: number,
		canSee: boolean
	): void {
		const speed = entity.speed * speedMult;
		this.repathCooldown--;
		if (this.repathCooldown <= 0) {
			this.path = this.pathfinder.findPath({
				start: { x: entity.x, y: entity.y },
				end: { x: tx, y: ty },
				maxNodes: 500,
			});
			this.repathCooldown = this.profile.repathInterval ?? 60;
		}

		let nx = 0;
		let ny = 0;
		if (this.path.length > 1) {
			const next = this.path[1];
			const dx = next.x - entity.x;
			const dy = next.y - entity.y;
			const d = Math.hypot(dx, dy);
			if (d < speed) {
				this.path.shift();
				return;
			}
			nx = (dx / d) * speed;
			ny = (dy / d) * speed;
		} else if (canSee) {
			const dx = tx - entity.x;
			const dy = ty - entity.y;
			const d = Math.hypot(dx, dy);
			if (d < 4) return;
			nx = (dx / d) * speed;
			ny = (dy / d) * speed;
		} else {
			return; // цель за стеной и путь не найден — стоим, ждём search/return
		}

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

	private enterChase(entity: Entity): void {
		const target = this.getTarget();
		this.state = 'chase';
		this.lastKnown = { x: target.x, y: target.y };
		this.memoryTimer = MEMORY_FRAMES;
		this.path = [];
		this.repathCooldown = 0;
		void entity;
	}

	private enterSearch(): void {
		this.state = 'search';
		this.searchTimer = SEARCH_FRAMES;
		this.path = [];
	}

	private enterReturn(): void {
		this.state = 'return';
		this.path = [];
		this.lastKnown = null;
		this.memoryTimer = 0;
	}
}

/** Дистанция аггро с дефолтом (вынесена для читаемости расчёта LOS). */
function aggroRangeSafe(profile: AiProfile): number {
	return profile.aggroRange ?? 500;
}
