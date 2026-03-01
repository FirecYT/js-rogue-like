import Entity from "../entities/Entity";

/**
 * Камера: следование за сущностью или свободный режим, возврат смещения для отрисовки мира.
 */
export class Camera {
	public x = 0;
	public y = 0;
	private targetX = 0;
	private targetY = 0;
	private followSpeed = 0.05;
	private freeMode = false;

	/**
	 * @param canvas - Канвас (для возможного использования размеров)
	 */
	constructor(private canvas: HTMLCanvasElement) { }

	/**
	 * Включает режим следования за сущностью.
	 * @param entity - Сущность, за которой следует камера
	 */
	follow(entity: Entity): void {
		this.freeMode = false;
		this.targetX = entity.x;
		this.targetY = entity.y;
	}

	/**
	 * Включает свободный режим с фиксированной целью.
	 * @param x - Целевая X
	 * @param y - Целевая Y
	 */
	setFreeMode(x: number, y: number): void {
		this.freeMode = true;
		this.targetX = x;
		this.targetY = y;
	}

	/**
	 * Обновляет позицию камеры (плавное следование или мгновенная в свободном режиме).
	 */
	update(): void {
		if (!this.freeMode) {
			this.x += (this.targetX - this.x) * this.followSpeed;
			this.y += (this.targetY - this.y) * this.followSpeed;
		} else {
			this.x = this.targetX;
			this.y = this.targetY;
		}
	}

	/**
	 * Возвращает смещение для отрисовки мира (чтобы центр камеры был в (0,0) после translate).
	 * @returns { offsetX, offsetY } — смещение для context.translate
	 */
	getOffset(): { offsetX: number; offsetY: number } {
		return {
			offsetX: -this.x,
			offsetY: -this.y
		};
	}
}
