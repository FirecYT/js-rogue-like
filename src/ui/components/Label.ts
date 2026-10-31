import MouseInput from '../../components/MouseInput';
import { Component } from '../Component';

/**
 * Текстовая метка с поддержкой переноса текста
 */
export class Label extends Component {
	private text: string;
	private fontSize = 16;
	private color = '#ffffff';
	private align: CanvasTextAlign = 'left';
	private baseline: CanvasTextBaseline = 'alphabetic';
	private maxWidth?: number;
	private lineHeight: number;
	private wrappedLines: string[] = [];

	/**
	 * Создать текстовую метку
	 * @param text Текст метки
	 * @param maxWidth Максимальная ширина (для переноса текста)
	 */
	constructor(text: string, maxWidth?: number) {
		super();
		this.text = text;
		this.maxWidth = maxWidth;
		this.lineHeight = this.fontSize * 1.4;
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
		this.lineHeight = size * 1.4;
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
	 * Если указан maxWidth, переносит текст по словам.
	 */
	private calculateDimensions(): void {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		ctx.font = `${this.fontSize}px Arial`;

		if (this.maxWidth) {
			// Перенос текста по словам
			this.wrappedLines = this.wrapText(ctx, this.text, this.maxWidth);
			this.width = this.maxWidth;
			this.height = this.wrappedLines.length * this.lineHeight;
		} else {
			// Одна строка
			const metrics = ctx.measureText(this.text);
			this.width = metrics.width;
			this.height = this.fontSize;
			this.wrappedLines = [this.text];
		}
	}

	/**
	 * Переносит текст по словам, чтобы он помещался в maxWidth.
	 * @param ctx Контекст канваса
	 * @param text Текст для переноса
	 * @param maxWidth Максимальная ширина строки
	 * @returns Массив строк
	 */
	private wrapText(
		ctx: CanvasRenderingContext2D,
		text: string,
		maxWidth: number
	): string[] {
		const words = text.split(' ');
		const lines: string[] = [];
		let currentLine = '';

		for (const word of words) {
			const testLine = currentLine + (currentLine ? ' ' : '') + word;
			const metrics = ctx.measureText(testLine);

			if (metrics.width > maxWidth && currentLine) {
				lines.push(currentLine);
				currentLine = word;
			} else {
				currentLine = testLine;
			}
		}

		if (currentLine) {
			lines.push(currentLine);
		}

		return lines;
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
	 * Отрисовка текста (с переносом, если указан maxWidth)
	 * @param ctx Контекст канваса
	 * @param offsetX Смещение по оси X от родителя
	 * @param offsetY Смещение по оси Y от родителя
	 */
	render(ctx: CanvasRenderingContext2D, offsetX = 0, offsetY = 0): void {
		ctx.save();

		ctx.fillStyle = this.color;
		ctx.font = `${this.fontSize}px Arial`;
		ctx.textAlign = this.align;
		ctx.textBaseline = this.baseline;

		const x = offsetX + this.x;
		let y = offsetY + this.y + this.fontSize;

		for (const line of this.wrappedLines) {
			ctx.fillText(line, x, y);
			y += this.lineHeight;
		}

		ctx.restore();
	}
}
