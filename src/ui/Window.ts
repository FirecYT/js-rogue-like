import { Component } from './Component';
import MouseInput from '../components/MouseInput';
import { AbsoluteContainer } from './containers/AbsoluteContainer';

/**
 * Улучшенное окно с современным дизайном
 */
export abstract class Window extends Component {
	/** Корневой контейнер окна */
	public root: AbsoluteContainer;

	/** Флаг модальности окна */
	public modal = false;

	/** Флаг, вызывает ли окно паузу игры */
	public causesPause = false;

	/** Заголовок окна */
	public title = '';

	/**
	 * Создать окно
	 */
	constructor() {
		super();
		this.root = new AbsoluteContainer();
	}

	/**
	 * Обновление окна и всех дочерних компонентов
	 * @param mouse Входные данные мыши
	 * @param globalX Глобальная координата X компонента на экране
	 * @param globalY Глобальная координата Y компонента на экране
	 */
	update(mouse: MouseInput): void {
		this.root.update(mouse, this.x, this.y);

		if (mouse.pressed) {
			this.handleClick?.(mouse.x, mouse.y);
		}
	}

	/**
	 * Отрисовка окна
	 * @param ctx Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		const x = this.x;
		const y = this.y;
		const width = this.width;
		const height = this.height;
		const cornerRadius = 8;

		// Тень окна
		ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
		ctx.shadowBlur = 15;
		ctx.shadowOffsetX = 5;
		ctx.shadowOffsetY = 5;

		// Фон окна с закруглёнными углами
		ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
		this.roundRect(ctx, x, y, width, height, cornerRadius);
		ctx.fill();

		ctx.shadowColor = 'transparent';

		// Граница окна
		ctx.strokeStyle = '#444';
		ctx.lineWidth = 2;
		this.roundRect(ctx, x, y, width, height, cornerRadius);
		ctx.stroke();

		// Внутренняя подсветка
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
		ctx.lineWidth = 1;
		this.roundRect(ctx, x + 1, y + 1, width - 2, height - 2, cornerRadius - 1);
		ctx.stroke();

		if (this.title) {
			const titleHeight = 30;
			const titleGradient = ctx.createLinearGradient(x, y, x, y + titleHeight);
			titleGradient.addColorStop(0, '#1a1a1a');
			titleGradient.addColorStop(1, '#0f0f0f');
			ctx.fillStyle = titleGradient;
			ctx.fillRect(x, y, width, titleHeight);

			ctx.fillStyle = '#fff';
			ctx.font = '16px Arial';
			ctx.textAlign = 'left';
			ctx.textBaseline = 'middle';
			ctx.fillText(this.title, x + 15, y + titleHeight / 2);

			ctx.strokeStyle = '#333';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(x, y + titleHeight);
			ctx.lineTo(x + width, y + titleHeight);
			ctx.stroke();
		}

		this.root.render(ctx);
	}

	/**
	 * Нарисовать прямоугольник с закруглёнными углами
	 * @param ctx Контекст канваса
	 * @param x Позиция X
	 * @param y Позиция Y
	 * @param width Ширина
	 * @param height Высота
	 * @param radius Радиус закругления
	 */
	private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.arcTo(x + width, y, x + width, y + height, radius);
		ctx.arcTo(x + width, y + height, x, y + height, radius);
		ctx.arcTo(x, y + height, x, y, radius);
		ctx.arcTo(x, y, x + width, y, radius);
		ctx.closePath();
	}

	/**
	 * Рекурсивный поиск подсказки в дочерних компонентах
	 * @returns Объект с текстом подсказки и позицией или null
	 */
	getTooltip(): { text: string; x: number; y: number } | null {
		for (const child of this.root.children) {
			const tooltip = child.getTooltip?.();

			if (tooltip) {
				return tooltip;
			}
		}
		return null;
	}

	/**
	 * Обработка клика внутри окна
	 * @param mouseX Координата клика по оси X
	 * @param mouseY Координата клика по оси Y
	 */
	handleClick?(mouseX: number, mouseY: number): void;

	/**
	 * Автоматически установить размер окна под контент
	 * @param padding Отступы вокруг контента
	 */
	autoSize(): void {
		let maxWidth = 0;
		let maxHeight = 0;

		for (const child of this.root.children) {
			const right = child.x + child.width;
			const bottom = child.y + child.height;

			maxWidth = Math.max(maxWidth, right);
			maxHeight = Math.max(maxHeight, bottom);
		}

		this.width = maxWidth;
		this.height = maxHeight;
	}
}
