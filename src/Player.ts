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

		let isDashActive = false;
		for (const chip of this.inventory.chips) {
			if (chip && chip.id === 'dash' && chip.cooldown && !chip.cooldown.isReady()) {
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

	getCooldowns(): { name: string; val: number; }[] {
		const cooldowns = [];

		for (const chip of this.inventory.chips) {
			if (chip && chip.cooldown && !chip.cooldown.isReady()) {
				cooldowns.push({
					name: `${chip.name}`,
					val: chip.cooldown.progress(),
				});
			}
		}

		if (this.inventory.weapon && this.inventory.weapon.cooldown && !this.inventory.weapon.cooldown.isReady()) {
			cooldowns.push({
				name: 'fire',
				val: this.inventory.weapon.cooldown.progress(),
			});
		}

		return cooldowns;
	}
}
