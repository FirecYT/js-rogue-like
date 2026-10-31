import { PickupItem } from './PickupItem';

/**
 * Пикап карты модификатора: зелёный маркер с буквой M.
 */
export class ModifierPickup extends PickupItem {
	/**
	 * Отрисовка: зелёный круг с буквой M.
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = '#0f0';
		ctx.beginPath();
		ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#000';
		ctx.font = '10px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('M', this.x, this.y);
	}
}
