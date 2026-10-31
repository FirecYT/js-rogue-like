import Entity from '../entities/Entity';

/** Минимальный масштаб мира на экране. */
const MIN_ZOOM = 0.5;
/** Максимальный масштаб мира на экране. */
const MAX_ZOOM = 4;

/**
 * Камера: плавное следование за сущностью, масштаб (зум) и преобразования
 * координат экран<->мир. Единственный владелец view-трансформации:
 * и рендер, и прицеливание считаются через неё, поэтому курсор, прицел
 * и пули всегда согласованы.
 */
export class Camera {
	public x = 0;
	public y = 0;
	private targetX = 0;
	private targetY = 0;
	private followSpeed = 0.05;
	private zoomLevel = 1;

	/**
	 * @param canvas - Канвас (размеры нужны для преобразований координат)
	 */
	constructor(private readonly canvas: HTMLCanvasElement) {}

	/** Текущий масштаб мира на экране (1 = 100%). */
	get zoom(): number {
		return this.zoomLevel;
	}

	/**
	 * Изменяет зум на целое число «шагов» колеса мыши (шаг = ×2).
	 * Положительное значение — отдаление, отрицательное — приближение.
	 * Значение ограничено диапазоном [MIN_ZOOM, MAX_ZOOM].
	 * @param steps - Число шагов (обычно wheelDelta)
	 */
	zoomBySteps(steps: number): void {
		this.zoomLevel = Math.min(
			MAX_ZOOM,
			Math.max(MIN_ZOOM, this.zoomLevel * 2 ** -steps)
		);
	}

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

	/**
	 * Преобразует экранные координаты курсора в мировые с учётом зума
	 * и текущей позиции камеры (в том числе пока камера «догоняет» цель).
	 * @param screenX - Координата X на канвасе
	 * @param screenY - Координата Y на канвасе
	 * @returns Мировые координаты точки под курсором
	 */
	screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
		return {
			x: this.x + (screenX - this.canvas.width / 2) / this.zoomLevel,
			y: this.y + (screenY - this.canvas.height / 2) / this.zoomLevel,
		};
	}
}
