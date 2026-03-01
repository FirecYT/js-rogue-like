/**
 * Улучшенная утилита для отрисовки подсказок
 */
export class Tooltip {
	/**
	 * Отрисовать подсказку
	 * @param ctx Контекст канваса
	 * @param text Текст подсказки (может содержать \n для переноса строк)
	 * @param x Позиция по оси X
	 * @param y Позиция по оси Y
	 * @param offsetX Смещение по оси X от позиции
	 * @param offsetY Смещение по оси Y от позиции
	 */
	static render(
		ctx: CanvasRenderingContext2D,
		text: string,
		x: number,
		y: number,
		offsetX = 10,
		offsetY = 10
	): void {
		const lines = text.split('\n');
		const padding = 8;
		const lineHeight = 13;
		const linePadding = 8;
		const cornerRadius = 5;

		ctx.font = '13px Arial';
		let maxWidth = 0;
		for (const line of lines) {
			maxWidth = Math.max(maxWidth, ctx.measureText(line).width);
		}

		const width = maxWidth + padding * 2;
		const height = lines.length * lineHeight + (lines.length - 1) * linePadding + padding * 2;

		let adjustedX = x + offsetX;
		let adjustedY = y + offsetY;
		if (adjustedX + width > ctx.canvas.width) {
			adjustedX = x - width - offsetX;
		}
		if (adjustedY + height > ctx.canvas.height) {
			adjustedY = y - height - offsetY;
		}

		ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
		ctx.shadowBlur = 10;
		ctx.shadowOffsetX = 3;
		ctx.shadowOffsetY = 3;

		// Фон с закруглёнными углами
		ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
		this.roundRect(ctx, adjustedX, adjustedY, width, height, cornerRadius);
		ctx.fill();

		ctx.shadowColor = 'transparent';

		ctx.strokeStyle = '#555';
		ctx.lineWidth = 1;
		this.roundRect(ctx, adjustedX, adjustedY, width, height, cornerRadius);
		ctx.stroke();

		ctx.fillStyle = '#fff';
		ctx.font = '13px Arial';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';
		for (let i = 0; i < lines.length; i++) {
			ctx.fillText(lines[i], adjustedX + padding, adjustedY + padding + i * lineHeight + i * linePadding);
		}
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
	private static roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.arcTo(x + width, y, x + width, y + height, radius);
		ctx.arcTo(x + width, y + height, x, y + height, radius);
		ctx.arcTo(x, y + height, x, y, radius);
		ctx.arcTo(x, y, x + width, y, radius);
		ctx.closePath();
	}
}
