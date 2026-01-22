import { Effect } from '../effects/Effect';
import Entity from '../entities/Entity';

export class EffectSystem {
	private effects: Effect[] = [];

	addEffect(effect: Effect): void {
		this.effects.push(effect);
	}

	update(enities: Entity[]): void {
		for (let i = this.effects.length - 1; i >= 0; i--) {
			this.effects[i].update(enities);
			if (this.effects[i].isDead()) {
				this.effects.splice(i, 1);
			}
		}
	}

	render(ctx: CanvasRenderingContext2D): void {
		for (const effect of this.effects) {
			effect.render(ctx);
		}
	}

	getEffects(): Effect[] {
		return this.effects;
	}
}
