import { PickupItem } from './PickupItem';

/**
 * Подбираемое заклинание: отображается зелёным кругом с «S».
 */
export class SpellPickup extends PickupItem {
	render(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = '#0f0';
		ctx.beginPath();
		ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#000';
		ctx.font = '10px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('S', this.x, this.y);
	}
}
