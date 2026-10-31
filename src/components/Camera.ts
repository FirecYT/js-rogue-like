import Entity from '../entities/Entity';

/**
 * Камера: плавное следование за сущностью, возврат смещения для отрисовки мира.
 */
export class Camera {
	public x = 0;
	public y = 0;
	private targetX = 0;
	private targetY = 0;
	private followSpeed = 0.05;

	/**
	 * Устанавливает цель следования камеры (обычно управляемая сущность).
	 * @param entity - Сущность, за которой следует камера
	 */
	follow(entity: Entity): void {
		this.targetX = entity.x;
		this.targetY = entity.y;
	}

	/**
	 * Мгновенно центрирует камеру на сущности (без плавности).
	 * Используется при спавне/телепортации, чтобы не «догонять» цель через весь мир.
	 * @param entity - Сущность для центрирования
	 */
	snapTo(entity: Entity): void {
		this.targetX = entity.x;
		this.targetY = entity.y;
		this.x = entity.x;
		this.y = entity.y;
	}

	/**
	 * Обновляет позицию камеры (плавное следование за целью).
	 */
	update(): void {
		this.x += (this.targetX - this.x) * this.followSpeed;
		this.y += (this.targetY - this.y) * this.followSpeed;
	}

	/**
	 * Возвращает смещение для отрисовки мира (чтобы позиция камеры оказалась в (0,0) после translate).
	 * @returns { offsetX, offsetY } — смещение для context.translate
	 */
	getOffset(): { offsetX: number; offsetY: number } {
		return {
			offsetX: -this.x,
			offsetY: -this.y,
		};
	}
}
