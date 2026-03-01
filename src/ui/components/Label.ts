import MouseInput from '../../components/MouseInput';
import { Component } from '../Component';

/**
 * Текстовая метка
 */
export class Label extends Component {
	private text: string;
	private fontSize = 16;
	private color = '#ffffff';
	private align: CanvasTextAlign = 'left';
	private baseline: CanvasTextBaseline = 'alphabetic';

	/**
	 * Создать текстовую метку
	 * @param text Текст метки
	 */
	constructor(text: string) {
		super();
		this.text = text;
		this.calculateDimensions();
	}

	/**
	 * Обновить текст
	 * @param text Новый текст
	 */
	setText(text: string): void {
		this.text = text;
		this.calculateDimensions();
	}

	/**
	 * Установить размер шрифта
	 * @param size Размер шрифта в пикселях
	 */
	setFontSize(size: number): void {
		this.fontSize = size;
		this.calculateDimensions();
	}

	/**
	 * Установить цвет текста
	 * @param color Цвет в формате CSS
	 */
	setColor(color: string): void {
		this.color = color;
	}

	/**
	 * Установить выравнивание текста
	 * @param align Выравнивание (left, right, center, start, end)
	 */
	setAlign(align: CanvasTextAlign): void {
		this.align = align;
	}

	/**
	 * Установить базовую линию текста
	 * @param baseline Базовая линия (top, hanging, middle, alphabetic, ideographic, bottom)
	 */
	setBaseline(baseline: CanvasTextBaseline): void {
		this.baseline = baseline;
	}

	/**
	 * Вычисляет ширину и высоту метки по текущему шрифту и тексту.
	 */
	private calculateDimensions(): void {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.font = `${this.fontSize}px Arial`;
			const metrics = ctx.measureText(this.text);
			this.width = metrics.width;
			this.height = this.fontSize;
		}
	}

	/**
	 * Обновление состояния (не интерактивен)
	   * @param mouse Входные данные мыши
	   * @param globalX Глобальная координата X компонента на экране
	   * @param globalY Глобальная координата Y компонента на экране
	 */
	update(mouse: MouseInput, globalX: number, globalY: number): void {
		void mouse;
		void globalX;
		void globalY;
	}

	/**
	 * Отрисовка текста
	 * @param ctx Контекст канваса
	 * @param offsetX Смещение по оси X от родителя
	 * @param offsetY Смещение по оси Y от родителя
	 */
	render(ctx: CanvasRenderingContext2D, offsetX = 0, offsetY = 0): void {
		ctx.save();

		// Apply styling
		ctx.fillStyle = this.color;
		ctx.font = `${this.fontSize}px Arial`;
		ctx.textAlign = this.align;
		ctx.textBaseline = this.baseline;

		// Draw the text
		ctx.fillText(this.text, offsetX + this.x, offsetY + this.y + this.height);

		ctx.restore();
	}
}
