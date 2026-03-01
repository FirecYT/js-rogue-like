import Entity from './Entity';
import { Item } from '../items/Item';

/**
 * Подбираемый предмет на карте: хранит Item и обрабатывает подбор сущностью.
 */
export abstract class PickupItem extends Entity {
	public item: Item;

	/**
	 * @param x - Мировая координата X
	 * @param y - Мировая координата Y
	 * @param item - Предмет, который выдаётся при подборе
	 */
	constructor(x: number, y: number, item: Item) {
		super(x, y, 1);
		this.item = item;
	}

	/**
	 * Отрисовка по умолчанию: жёлтый круг и «?».
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = '#ff0';
		ctx.beginPath();
		ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#000';
		ctx.font = '10px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('?', this.x, this.y);
	}

	/**
	 * Вызывается при подборе предмета сущностью (открытие UI выбора слота и т.д.).
	 * @param entity - Сущность, подобравшая предмет
	 * @returns true, если подбор обработан
	 */
	abstract onPickup(entity: Entity): boolean;

	/**
	 * Подбираемые предметы не получают урон.
	 */
	takeDamage(_damage: number, _attacker?: Entity): void {
		// игнорируем
	}
}
