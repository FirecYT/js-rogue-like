import { PickupItem } from './PickupItem';
import Entity from './Entity';

/**
 * Подбираемое оружие: отображается красным кругом с «W».
 */
export class WeaponPickup extends PickupItem {
	/**
	 * Отрисовка: красный круг, белая «W».
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = '#f00';
		ctx.beginPath();
		ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#fff';
		ctx.font = '10px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('W', this.x, this.y);
	}

	/**
	 * @param entity - Сущность, подобравшая предмет
	 * @returns true (подбор обрабатывается через UI выбора слота)
	 */
	onPickup(entity: Entity): boolean {
		void entity;
		return true;
	}
}
