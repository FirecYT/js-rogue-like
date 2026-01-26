import { Controller } from './Controller';
import { Pathfinder } from '../world/Pathfinding';
import { WorldManager } from '../world/WorldManager';
import Entity from '../entities/Entity';
import { HasSpeed } from '../types/EntityTraits';
import { EffectSystem } from '../systems/EffectSystem';

export class AiController extends Controller {
	protected path: { x: number, y: number }[] = [];
	protected pathUpdateCooldown = 60;
	protected target: Entity;

	constructor(target: Entity) {
		super();
		this.target = target;
	}

	update(entity: Entity, world: WorldManager, effectSystem: EffectSystem): void {
		this.pathUpdateCooldown--;

		if (this.pathUpdateCooldown <= 0) {
			this.path = Pathfinder.findPath(entity.x, entity.y, this.target.x, this.target.y, world);
			if (this.path.length > 0) this.path.shift();
			this.pathUpdateCooldown = 60;
		}

		if (entity.inventory.weapon && entity.inventory.isWeaponReady()) {
			const distance = Math.hypot(this.target.x - entity.x, this.target.y - entity.y);

			if (distance < 400) {
				const angle = Math.atan2(this.target.y - entity.y, this.target.x - entity.x);
				entity.inventory.fire(angle, effectSystem);
			}
		}

		if (this.path.length === 0) {
			this.moveDirectly(entity);
		} else {
			this.followPath(entity);
		}
	}

	private moveDirectly(entity: Entity): void {
		const dx = this.target.x - entity.x;
		const dy = this.target.y - entity.y;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist > 0) {
			const speed = this.getEntitySpeed(entity);
			entity.x += (dx / dist) * speed;
			entity.y += (dy / dist) * speed;
		}
	}

	private followPath(entity: Entity): void {
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
			entity.x += Math.cos(angle) * speed;
			entity.y += Math.sin(angle) * speed;
		}
	}

	private getEntitySpeed(entity: Entity): number {
		if (this.hasSpeed(entity)) {
			return entity.speed;
		}
		return 1;
	}

	private hasSpeed(entity: Entity): entity is Entity & HasSpeed {
		return 'speed' in entity;
	}
}
