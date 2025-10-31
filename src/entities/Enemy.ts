// entities/Enemy.ts
import GameObject from '../components/GameObject';
import { Pathfinder } from '../world/Pathfinding';
import { WorldManager } from '../world/WorldManager';

export default class Enemy extends GameObject {
	private speed = 1;
	private target: GameObject;
	public experience: number;
	private path: { x: number, y: number }[] = [];
	private pathUpdateCooldown = 0;
	private worldManager: WorldManager;

	constructor(x: number, y: number, target: GameObject, worldManager: WorldManager) {
		super(x, y, 100);
		this.target = target;
		this.experience = this.getHP();
		this.worldManager = worldManager;
	}

	update() {
		this.pathUpdateCooldown--;
		if (this.pathUpdateCooldown <= 0 || this.path.length === 0) {
			this.updatePath();
			this.pathUpdateCooldown = 60;
		}

		this.followPath();
	}

	private updatePath() {
		this.path = Pathfinder.findPath(
			this.x, this.y,
			this.target.x, this.target.y,
			this.worldManager
		);

		if (this.path.length > 0) {
			this.path.shift(); // Убираем первую точку (текущую позицию)
		}
	}

	private followPath() {
		if (this.path.length === 0) {
			// Если пути нет, двигаемся напрямую к цели
			const dx = this.target.x - this.x;
			const dy = this.target.y - this.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance > 0) {
				this.x += (dx / distance) * this.speed;
				this.y += (dy / distance) * this.speed;
			}
			return;
		}

		const nextPoint = this.path[0];
		const dx = nextPoint.x - this.x;
		const dy = nextPoint.y - this.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		if (distance < 10) {
			this.path.shift();
		} else {
			const angle = Math.atan2(dy, dx);
			this.x += Math.cos(angle) * this.speed;
			this.y += Math.sin(angle) * this.speed;
		}
	}

	render(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = '#f00';
		ctx.fillRect(this.x - 4, this.y - 4, 8, 8);

		// Отладочная отрисовка пути
		if (this.path.length > 0) {
			ctx.strokeStyle = '#f002';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(this.x, this.y);

			for (const point of this.path) {
				ctx.lineTo(point.x, point.y);
			}
			ctx.stroke();

			// Рисуем точки пути
			ctx.fillStyle = '#0f0';
			for (const point of this.path) {
				ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
			}
		}
	}
}
