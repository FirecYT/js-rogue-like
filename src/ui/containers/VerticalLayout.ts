import { Container } from '../Container';

/**
 * Вертикальный контейнер
 * Располагает дочерние компоненты один под другим
 */
export class VerticalLayout extends Container {
	/** Расстояние между компонентами */
	public spacing = 10;

	/** Отступы контейнера */
	public padding = { top: 0, right: 0, bottom: 0, left: 0 };

	/**
	 * Пересчитать расположение дочерних компонентов
	 */
	protected recalculateLayout(): void {
		let currentY = this.padding.top;
		let maxWidth = 0;

		for (const child of this.children) {
			child.x = this.padding.left;
			child.y = currentY;

			currentY += child.height + this.spacing;
			maxWidth = Math.max(maxWidth, child.width);
		}

		this.height = currentY - this.spacing + this.padding.bottom;
		this.width = maxWidth + this.padding.left + this.padding.right;
	}
}
