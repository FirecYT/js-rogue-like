import MouseInput from '../components/MouseInput';
import { Component } from './Component';

/**
 * Контейнер с абсолютным позиционированием
 * Каждый дочерний компонент имеет свои координаты
 */
export abstract class Container extends Component {
	/** Массив дочерних компонентов */
	public children: Component[] = [];

	/**
	 * Добавить дочерний компонент
	 * @param child Компонент для добавления
	 */
	addChild(child: Component): void {
		this.children.push(child);
		child.parent = this;
		this.recalculateLayout?.();
	}

	/**
	 * Удалить дочерний компонент
	 * @param child Компонент для удаления
	 */
	removeChild(child: Component): void {
		const index = this.children.indexOf(child);
		if (index !== -1) {
			this.children.splice(index, 1);
			this.recalculateLayout?.();
		}
	}

	/**
	 * Обновление всех дочерних компонентов
	 * @param mouse Входные данные мыши
	 * @param globalX Глобальная координата X компонента на экране
	 * @param globalY Глобальная координата Y компонента на экране
	 */
	update(mouse: MouseInput, globalX: number, globalY: number): void {
		this.recalculateLayout?.();
		for (const child of this.children) {
			const childGlobalX = globalX + child.x;
			const childGlobalY = globalY + child.y;
			child.update(mouse, childGlobalX, childGlobalY);
		}
	}

	/**
	 * Отрисовка всех дочерних компонентов
	 * @param ctx Контекст канваса
	 * @param offsetX Смещение по оси X от родителя
	 * @param offsetY Смещение по оси Y от родителя
	 */
	render(ctx: CanvasRenderingContext2D, offsetX = 0, offsetY = 0): void {
		for (const child of this.children) {
			child.render(ctx, offsetX + this.x, offsetY + this.y);
		}
	}

	/**
	 * Рекурсивный поиск подсказки в дочерних компонентах
	 * @returns Объект с текстом подсказки и позицией или null
	 */
	getTooltip(): { text: string; x: number; y: number } | null {
		for (const child of this.children) {
			const tooltip = child.getTooltip?.();

			if (tooltip) {
				return tooltip;
			}
		}
		return null;
	}

	/**
	 * Пересчитать расположение дочерних компонентов
	 */
	protected recalculateLayout?(): void;
}
