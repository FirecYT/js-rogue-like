import MouseInput from "../components/MouseInput";

/**
 * Базовый класс для всех UI-компонентов
 */
export abstract class Component {
	/** Позиция по оси X относительно родителя */
	public x = 0;

	/** Позиция по оси Y относительно родителя */
	public y = 0;

	/** Ширина компонента */
	public width = 0;

	/** Высота компонента */
	public height = 0;

	/** Флаг наведения курсора */
	protected hovered = false;

	/** Флаг активного состояния (нажатие) */
	protected active = false;

	/** Родительский компонент или null */
	public parent: Component | null = null;

	/**
	 * Отрисовка компонента
	 * @param ctx Контекст канваса
	 * @param offsetX Смещение по оси X от родителя
	 * @param offsetY Смещение по оси Y от родителя
	 */
	abstract render(ctx: CanvasRenderingContext2D, offsetX?: number, offsetY?: number): void;

	/**
   * Обновление состояния компонента
   * @param mouse Входные данные мыши
   * @param globalX Глобальная координата X компонента на экране
   * @param globalY Глобальная координата Y компонента на экране
   */
	abstract update(mouse: MouseInput, globalX: number, globalY: number): void;

	/**
	 * Проверка, находится ли точка внутри компонента
	 * @param px Координата точки по оси X
	 * @param py Координата точки по оси Y
	 * @returns true, если точка внутри компонента
	 */
	isPointInside(px: number, py: number): boolean {
		return px >= this.x && px <= this.x + this.width &&
			py >= this.y && py <= this.y + this.height;
	}

	/**
	 * Установка состояния наведения
	 * @param hovered Флаг наведения
	 */
	setHovered(hovered: boolean): void {
		this.hovered = hovered;
	}

	/**
	 * Установка активного состояния
	 * @param active Флаг активности
	 */
	setActive(active: boolean): void {
		this.active = active;
	}

	/**
	 * Получить позицию компонента относительно корневого контейнера окна
	 * @param relativeTo Корневой контейнер (обычно window.root)
	 * @returns {x, y} в координатах окна
	 */
	getGlobalPosition(): { x: number; y: number } {
		let x = this.x;
		let y = this.y;

		if (this.parent) {
			let current: Component | null = this.parent;

			while (current) {
				console.log(current);

				x += current.x;
				y += current.y;
				current = current.parent;
			}
		}

		return { x, y };
	}

	/**
	 * Получить данные для отображения подсказки (если есть)
	 * @returns Объект с текстом подсказки и позицией или null
	 */
	getTooltip?(): { text: string; x: number; y: number } | null;
}
