import { Component } from '../Component';
import MouseInput from '../../components/MouseInput';

/**
 * Улучшенная кнопка с градиентами и тенями
 */
export class Button extends Component {
	/** Текст на кнопке */
	private text: string;

	/** Обработчик клика */
	private onClickCallback: (() => void) | null = null;

	/**
	 * Создать кнопку
	 * @param text Текст на кнопке
	 * @param width Ширина кнопки
	 * @param height Высота кнопки
	 */
	constructor(text: string, width = 100, height = 30) {
		super();
		this.text = text;
		this.width = width;
		this.height = height;
	}

	/**
	 * Установить обработчик клика
	 * @param callback Функция, вызываемая при клике
	 */
	setOnClick(callback: () => void): void {
		this.onClickCallback = callback;
	}

	/**
	 * Обновить текст кнопки
	 * @param text Новый текст
	 */
	setText(text: string): void {
		this.text = text;
	}

	/**
	 * Проверка и обработка клика
	 * @returns true, если был клик по кнопке
	 */
	handleClick(): boolean {
		if (this.active && this.onClickCallback) {
			this.onClickCallback();
			return true;
		}
		return false;
	}

	/**
	 * Обновление состояния кнопки (наведение, нажатие)
	 * @param mouse Входные данные мыши
	 * @param globalX Глобальная координата X компонента на экране
	 * @param globalY Глобальная координата Y компонента на экране
	 */
	update(mouse: MouseInput, globalX: number, globalY: number): void {
		const isOverButton = (
			mouse.x >= globalX &&
			mouse.x <= globalX + this.width &&
			mouse.y >= globalY &&
			mouse.y <= globalY + this.height
		);

		this.setHovered(isOverButton);

		if (this.active && !mouse.pressed) {
			this.handleClick();
			this.setActive(false);
		}

		if (isOverButton && mouse.pressed) {
			this.setActive(true);
		} else {
			this.setActive(false);
		}
	}

	/**
	 * Отрисовка кнопки
	 * @param ctx Контекст канваса
	 * @param offsetX Смещение по оси X от родителя
	 * @param offsetY Смещение по оси Y от родителя
	 */
	render(ctx: CanvasRenderingContext2D, offsetX = 0, offsetY = 0): void {
		const x = offsetX + this.x;
		const y = offsetY + this.y;
		const isHovered = this.hovered;
		const isActive = this.active;

		// Градиентный фон
		const gradient = ctx.createLinearGradient(x, y, x, y + this.height);
		if (isActive) {
			gradient.addColorStop(0, '#2d4d2d');
			gradient.addColorStop(1, '#1d3d1d');
		} else if (isHovered) {
			gradient.addColorStop(0, '#3a5a3a');
			gradient.addColorStop(1, '#2a4a2a');
		} else {
			gradient.addColorStop(0, '#2a2a2a');
			gradient.addColorStop(1, '#1a1a1a');
		}
		ctx.fillStyle = gradient;
		ctx.fillRect(x, y, this.width, this.height);

		// Внутренняя тень
		ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
		ctx.shadowBlur = 4;
		ctx.shadowOffsetX = 1;
		ctx.shadowOffsetY = 1;
		ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
		ctx.fillRect(x + 1, y + 1, this.width - 2, this.height - 2);
		ctx.shadowColor = 'transparent';

		// Граница
		ctx.strokeStyle = isHovered ? '#777' : '#555';
		ctx.lineWidth = 1.5;
		ctx.strokeRect(x + 0.5, y + 0.5, this.width - 1, this.height - 1);

		// Текст
		ctx.fillStyle = '#fff';
		ctx.font = '14px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(this.text, x + this.width / 2, y + this.height / 2);
	}
}
