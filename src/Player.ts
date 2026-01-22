import Entity from './entities/Entity';
import { interpolateColor } from './utils';
import { HasStats, HasPosition } from './types/EntityTraits';

export default class Player extends Entity implements HasPosition, HasStats {
	public damage = 10;
	public width = 10;
	public height = 10;

	constructor(x: number, y: number) {
		super(x, y, 1000);
	}

	render(ctx: CanvasRenderingContext2D): void {
		const hpPercent = this.getHP() / this.maxHP;
		const normalColor = this.cooldowns.get('dashActive')?.isReady() ? '#99f' : '#ccf';
		const damageColor = '#f00';
		const color = interpolateColor(normalColor, damageColor, 1 - hpPercent);

		ctx.fillStyle = color;
		ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
	}

	getCooldowns(): { name: string; val: number; }[] {
		const cooldowns = [];
		if (!this.cooldowns.isReady('fire')) {
			cooldowns.push({
				name: 'fire',
				val: this.cooldowns.get('fire')?.progress() || 0,
			});
		}
		if (!this.cooldowns.isReady('dash')) {
			cooldowns.push({
				name: 'dash',
				val: this.cooldowns.get('dash')?.progress() || 0,
			});
		}
		if (!this.cooldowns.isReady('dashActive')) {
			cooldowns.push({
				name: 'dashActive',
				val: this.cooldowns.get('dashActive')?.progress() || 0,
			});
		}
		return cooldowns;
	}
}
