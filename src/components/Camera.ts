import Entity from "../entities/Entity";

export class Camera {
	public x = 0;
	public y = 0;
	private targetX = 0;
	private targetY = 0;
	private followSpeed = 0.05;
	private freeMode = false;

	constructor(private canvas: HTMLCanvasElement) { }

	follow(entity: Entity): void {
		this.freeMode = false;
		this.targetX = entity.x;
		this.targetY = entity.y;
	}

	setFreeMode(x: number, y: number): void {
		this.freeMode = true;
		this.targetX = x;
		this.targetY = y;
	}

	update(): void {
		if (!this.freeMode) {
			this.x += (this.targetX - this.x) * this.followSpeed;
			this.y += (this.targetY - this.y) * this.followSpeed;
		} else {
			this.x = this.targetX;
			this.y = this.targetY;
		}
	}

	getOffset(): { offsetX: number; offsetY: number } {
		return {
			offsetX: - this.x,
			offsetY: - this.y
		};
	}
}
