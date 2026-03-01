/**
 * Прицел: линия от точки к курсору и точка в позиции мыши (мировые координаты).
 */
export class Crosshair {
	private static readonly LENGTH = 1500;
	private static readonly COLOR = '#f992';
	private static readonly LINE_WIDTH = 4;

	/**
	 * Рисует прицел в мировых координатах (вызывать при применённом трансформе камеры).
	 * @param ctx Контекст канваса
	 * @param fromX Мировая X начала линии (игрок)
	 * @param fromY Мировая Y начала линии
	 * @param mouseWorldX Мировая X курсора
	 * @param mouseWorldY Мировая Y курсора
	 */
	static render(
		ctx: CanvasRenderingContext2D,
		fromX: number,
		fromY: number,
		mouseWorldX: number,
		mouseWorldY: number
	): void {
		const dx = mouseWorldX - fromX;
		const dy = mouseWorldY - fromY;
		const dist = Math.sqrt(dx * dx + dy * dy) || 1;
		const lineX = (dx / dist) * this.LENGTH + fromX;
		const lineY = (dy / dist) * this.LENGTH + fromY;

		ctx.strokeStyle = this.COLOR;
		ctx.lineWidth = this.LINE_WIDTH;
		ctx.beginPath();
		ctx.moveTo(fromX, fromY);
		ctx.lineTo(lineX, lineY);
		ctx.stroke();

		ctx.fillStyle = this.COLOR;
		ctx.fillRect(mouseWorldX - 1, mouseWorldY - 1, 2, 2);
	}
}
