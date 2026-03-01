import Entity from './entities/Entity';
import { interpolateColor } from './utils';
import { HasStats, HasPosition, Controllable } from './types/EntityTraits';
import { Controller } from './controllers/Controller';

/**
 * Игрок: управляемая сущность с большим HP, уроном и отрисовкой с интерполяцией цвета по HP.
 */
export default class Player extends Entity implements HasPosition, HasStats, Controllable {
	public controller: Controller | null = null;
	public damage = 10;
	public width = 10;
	public height = 10;
	public speed = 10;

	/**
	 * @param x - Мировая координата X
	 * @param y - Мировая координата Y
	 */
	constructor(x: number, y: number) {
		super(x, y, 1000);
	}

	/**
	 * Отрисовка: прямоугольник с цветом от синего к красному в зависимости от HP; при активном даше — светлее.
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		const hpPercent = this.getHP() / this.maxHP;
		let isDashActive = false;
		for (const chip of this.inventory.chips) {
			if (chip?.id === 'dash' && chip.cooldown && !chip.cooldown.isReady()) {
				isDashActive = true;
				break;
			}
		}
		const normalColor = !isDashActive ? '#99f' : '#ccf';
		const damageColor = '#f00';
		const color = interpolateColor(normalColor, damageColor, 1 - hpPercent);
		ctx.fillStyle = color;
		ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
	}
}
