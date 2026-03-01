import { PickupItem } from './PickupItem';
import Entity from './Entity';

/**
 * Подбираемый чип: отображается синим кругом с «C».
 */
export class ChipPickup extends PickupItem {
	/**
	 * Отрисовка: синий круг, белая «C».
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = '#00f';
		ctx.beginPath();
		ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#fff';
		ctx.font = '10px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('C', this.x, this.y);
	}

	/**
	 * @param entity - Сущность, подобравшая предмет
	 * @returns true
	 */
	onPickup(entity: Entity): boolean {
		void entity;
		return true;
	}
}
