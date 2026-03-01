import { Controller } from './Controller';
import { Pathfinder, simplifyPath } from '../world/Pathfinding';
import { WorldManager } from '../world/WorldManager';
import Entity from '../entities/Entity';
import { HasSpeed } from '../types/EntityTraits';
import { EffectSystem } from '../systems/EffectSystem';
import { CHUNK_CONFIG } from '../world/Types';
import { getAngleBetweenPoints } from '../utils';

/**
 * ИИ-контроллер: движение к цели по пути или напрямую, стрельба при видимости цели.
 */
export class AiController extends Controller {
	protected path: { x: number; y: number }[] = [];
	protected pathUpdateCooldown = 0;
	protected target: Entity;

	/**
	 * @param target - Цель (обычно игрок)
	 */
	constructor(target: Entity) {
		super();
		this.target = target;
	}

	/**
	 * Обновляет путь раз в 60 кадров в радиусе 4 чанков; стреляет, если цель в радиусе 400 и есть линия видимости; двигается по пути или напрямую.
	 * @param entity - Управляемая сущность
	 * @param world - Мир
	 * @param effectSystem - Система эффектов
	 */
	update(entity: Entity, world: WorldManager, effectSystem: EffectSystem): void {
		this.pathUpdateCooldown--;
		if (this.pathUpdateCooldown <= 0) {
			const distance = Math.hypot(this.target.x - entity.x, this.target.y - entity.y);
			if (distance < CHUNK_CONFIG.FULL_SIZE * 4) {
				const rawPath = Pathfinder.findPath(entity.x, entity.y, this.target.x, this.target.y, world);
				this.path = rawPath.length > 0 ? simplifyPath(rawPath, world) : [];
			}
			this.pathUpdateCooldown = 60;
		}

		if (entity.inventory.weapon && entity.inventory.isWeaponReady()) {
			const distance = Math.hypot(this.target.x - entity.x, this.target.y - entity.y);
			const canSeeTarget = world.hasLineOfSight(entity.x, entity.y, this.target.x, this.target.y, 400);
			if (distance < 400 && canSeeTarget) {
				const angle = getAngleBetweenPoints(entity.x, entity.y, this.target.x, this.target.y);
				entity.inventory.fire(angle, effectSystem);
			}
		}

		if (this.path.length === 0) {
			this.moveDirectly(entity, world);
		} else {
			this.followPath(entity, world);
		}
	}

	/**
	 * Движение напрямую к цели с проверкой проходимости.
	 * @param entity - Сущность
	 * @param world - Мир
	 */
	private moveDirectly(entity: Entity, world: WorldManager): void {
		const dx = this.target.x - entity.x;
		const dy = this.target.y - entity.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		if (dist > 0) {
			const speed = this.getEntitySpeed(entity);
			const newX = entity.x + (dx / dist) * speed;
			const newY = entity.y + (dy / dist) * speed;
			if (world.isWorldPositionPassable(newX, entity.y)) entity.x = newX;
			if (world.isWorldPositionPassable(entity.x, newY)) entity.y = newY;
		}
	}

	/**
	 * Движение по первому пункту пути; при достижении — сдвиг пути.
	 * @param entity - Сущность
	 * @param world - Мир
	 */
	private followPath(entity: Entity, world: WorldManager): void {
		if (this.path.length === 0) return;
		const next = this.path[0];
		const dx = next.x - entity.x;
		const dy = next.y - entity.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		if (dist < 10) {
			this.path.shift();
		} else {
			const angle = Math.atan2(dy, dx);
			const speed = this.getEntitySpeed(entity);
			const newX = entity.x + Math.cos(angle) * speed;
			const newY = entity.y + Math.sin(angle) * speed;
			if (world.isWorldPositionPassable(newX, entity.y)) entity.x = newX;
			if (world.isWorldPositionPassable(entity.x, newY)) entity.y = newY;
		}
	}

	/**
	 * Возвращает скорость сущности, если есть HasSpeed, иначе 1.
	 * @param entity - Сущность
	 * @returns Число
	 */
	private getEntitySpeed(entity: Entity): number {
		return this.hasSpeed(entity) ? entity.speed : 1;
	}

	/**
	 * Type guard для HasSpeed.
	 * @param entity - Сущность
	 */
	private hasSpeed(entity: Entity): entity is Entity & HasSpeed {
		return 'speed' in entity;
	}
}
