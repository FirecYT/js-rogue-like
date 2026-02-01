import { Component } from '../Component';
import MouseInput from '../../components/MouseInput';
import { Item } from '../../items/Item';

/**
 * Улучшенный слот для предмета с индикацией перезарядки
 */
export class ItemSlot extends Component {
	/** Предмет в слоте */
	public item: Item | null = null;

	/**
	 * Создать слот для предмета
	 * @param slotIndex Индекс слота
	 * @param width Ширина слота
	 * @param height Высота слота
	 */
	constructor(width = 60, height = 60, item: Item | null = null) {
		super();
		this.width = width;
		this.height = height;
		this.item = item;
	}

	/**
	 * Установить предмет в слот
	 * @param item Предмет или null для очистки
	 */
	setItem(item: Item | null): void {
		this.item = item;
	}

	/**
	 * Обновление состояния (наведение)
	 * @param mouse Входные данные мыши
	 * @param globalX Глобальная координата X компонента на экране
	 * @param globalY Глобальная координата Y компонента на экране
	 */
	update(mouse: MouseInput, globalX: number, globalY: number): void {
		const isOverSlot = (
			mouse.x >= globalX &&
			mouse.x <= globalX + this.width &&
			mouse.y >= globalY &&
			mouse.y <= globalY + this.height
		);
		this.setHovered(isOverSlot);
	}

	/**
	 * Отрисовка слота
	 * @param ctx Контекст канваса
	 * @param offsetX Смещение по оси X от родителя
	 * @param offsetY Смещение по оси Y от родителя
	 */
	render(ctx: CanvasRenderingContext2D, offsetX = 0, offsetY = 0): void {
		const x = offsetX + this.x;
		const y = offsetY + this.y;
		const isOccupied = this.item !== null;
		const isHovered = this.hovered;

		// Фон слота (градиент для глубины)
		const gradient = ctx.createLinearGradient(x, y, x, y + this.height);
		if (!isOccupied) {
			gradient.addColorStop(0, isHovered ? '#2a2a2a' : '#1a1a1a');
			gradient.addColorStop(1, isHovered ? '#1f1f1f' : '#0f0f0f');
		} else {
			gradient.addColorStop(0, isHovered ? '#253525' : '#1a251a');
			gradient.addColorStop(1, isHovered ? '#1a251a' : '#0f1a0f');
		}
		ctx.fillStyle = gradient;
		ctx.fillRect(x, y, this.width, this.height);

		// Внутренняя тень для объёма
		ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
		ctx.shadowBlur = 4;
		ctx.shadowOffsetX = 1;
		ctx.shadowOffsetY = 1;
		ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
		ctx.fillRect(x + 1, y + 1, this.width - 2, this.height - 2);
		ctx.shadowColor = 'transparent';

		// Граница
		ctx.strokeStyle = isOccupied ? (isHovered ? '#6f6' : '#4a4') : (isHovered ? '#777' : '#444');
		ctx.lineWidth = isHovered ? 1.5 : 1;
		ctx.strokeRect(x + 0.5, y + 0.5, this.width - 1, this.height - 1);

		// Предмет
		if (this.item) {
			this.renderItem(ctx, x, y);

			if (this.item.cooldown && !this.item.cooldown.isReady()) {
				this.renderCooldown(ctx, x, y);
			}
		} else {
			ctx.fillStyle = '#444';
			ctx.font = '10px Arial';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('Empty', x + this.width / 2, y + this.height / 2);
		}
	}

	/**
	 * Отрисовка предмета в слоте
	 * @param ctx Контекст канваса
	 * @param x Позиция X слота
	 * @param y Позиция Y слота
	 */
	private renderItem(ctx: CanvasRenderingContext2D, x: number, y: number): void {
		if (!this.item) return;

		ctx.fillStyle = this.hovered ? '#fff' : '#ccc';
		ctx.font = `${Math.max(8, Math.floor((this.width / this.item.name.length) * 1.5))}px Arial`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		ctx.fillText(this.item.name, x + this.width / 2, y + this.height / 2);
	}

	/**
	 * Отрисовка индикации перезарядки
	 * @param ctx Контекст канваса
	 * @param x Позиция X слота
	 * @param y Позиция Y слота
	 */
	private renderCooldown(ctx: CanvasRenderingContext2D, x: number, y: number): void {
		if (!this.item?.cooldown) return;

		const centerX = x + this.width / 2;
		const centerY = y + this.height / 2;
		const radius = Math.min(this.width, this.height) / 2 - 8;
		const progress = this.item.cooldown.progress();

		// Фон круга перезарядки
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
		ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
		ctx.fill();

		// Прогресс перезарядки (по кругу против часовой стрелки)
		ctx.beginPath();
		ctx.arc(
			centerX,
			centerY,
			radius,
			-Math.PI / 2,                              // Начинаем сверху
			-Math.PI / 2 + Math.PI * 2 * (1 - progress), // Против часовой стрелки
			false
		);
		ctx.strokeStyle = '#4a86e8'; // Светло-синий
		ctx.lineWidth = 4;
		ctx.stroke();

		// Текст оставшегося времени
		if (progress > 0.1) {
			ctx.fillStyle = '#fff';
			ctx.font = '10px Arial';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			const remaining = Math.ceil(this.item.cooldown.getMaximum() * progress / 60); // Переводим в секунды
			ctx.fillText(remaining.toString(), centerX, centerY);
		}
	}

	/**
	 * Получить подсказку для предмета
	 * @returns Объект с текстом подсказки и позицией или null
	 */
	getTooltip(): { text: string; x: number; y: number } | null {
		if (this.hovered && this.item) {
			let tooltipText = `${this.item.name}`;
			if (this.item.type) {
				tooltipText += `\nТип: ${this.item.type}`;
			}
			if (this.item.cooldown && !this.item.cooldown.isReady()) {
				const remaining = Math.ceil(this.item.cooldown.getMaximum() * this.item.cooldown.progress() / 60);
				tooltipText += `\nПерезарядка: ${remaining} сек`;
			}
			return {
				text: tooltipText,
				x: this.x + this.width / 2,
				y: this.y + this.height
			};
		}
		return null;
	}
}
