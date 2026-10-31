import type { IController } from './Controller';
import type Entity from '../entities/Entity';
import type { WorldService } from '../services/WorldService';

/** Радиус блуждания поселенца вокруг дома, тайлы в пикселях. */
const WANDER_RADIUS = 96;
/** Скорость прогулки. */
const WALK_SPEED = 0.6;

/**
 * Контроллер поселенца: дружественный NPC без боевых действий.
 * Прогуливается вокруг точки появления (внутри дома) и стоит паузы.
 */
export class SettlerController implements IController {
	private targetX = 0;
	private targetY = 0;
	private pauseFrames = 0;

	/**
	 * @param rngSeed - Seed блуждания (уникален на NPC)
	 */
	constructor(private rngState: number) {}

	update(entity: Entity, world: WorldService): void {
		if (this.pauseFrames > 0) {
			this.pauseFrames--;
			return;
		}
		const dx = this.targetX - entity.x;
		const dy = this.targetY - entity.y;
		const dist = Math.hypot(dx, dy);
		if (dist < 8) {
			// Новая точка прогулки или пауза
			this.rngState = (this.rngState * 1103515245 + 12345) & 0x7fffffff;
			const angle = (this.rngState / 0x7fffffff) * Math.PI * 2;
			this.rngState = (this.rngState * 1103515245 + 12345) & 0x7fffffff;
			const radius = (this.rngState / 0x7fffffff) * WANDER_RADIUS;
			this.targetX = entity.x + Math.cos(angle) * radius;
			this.targetY = entity.y + Math.sin(angle) * radius;
			this.pauseFrames = 60 + (this.rngState % 120);
			return;
		}
		const nextX = entity.x + (dx / dist) * WALK_SPEED;
		const nextY = entity.y + (dy / dist) * WALK_SPEED;
		// Сквозь стены не ходим: упираемся и выбираем новую точку
		if (world.isPassable(nextX, nextY)) {
			entity.x = nextX;
			entity.y = nextY;
		} else {
			this.pauseFrames = 30;
			this.targetX = entity.x;
			this.targetY = entity.y;
		}
	}
}
