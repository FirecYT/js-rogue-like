import { Container } from '../Container';

/**
 * Горизонтальный контейнер
 * Располагает дочерние компоненты в ряд
 */
export class HorizontalLayout extends Container {
	/** Расстояние между компонентами */
	public spacing = 10;

	/** Отступы контейнера */
	public padding = { top: 0, right: 0, bottom: 0, left: 0 };

	/**
	 * Пересчитать расположение дочерних компонентов
	 */
	protected recalculateLayout(): void {
		let currentX = this.padding.left;
		let maxHeight = 0;

		for (const child of this.children) {
			child.x = currentX;
			child.y = this.padding.top;

			currentX += child.width + this.spacing;
			maxHeight = Math.max(maxHeight, child.height);
		}

		this.width = currentX - this.spacing + this.padding.right;
		this.height = maxHeight + this.padding.top + this.padding.bottom;
	}
}
