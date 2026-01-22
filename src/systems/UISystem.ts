import Engine from '../components/Engine';
import Player from '../Player';
import FloatingText from '../components/FloatingText';
import { pir } from '../utils';
import { PlayerProgression } from './PlayerProgression';

export class UISystem {
	private state: number;

	constructor(
		private engine: Engine,
		private player: Player,
		private mouse: { x: number; y: number; pressed: boolean },
		private playerProgression: PlayerProgression,
		private floatingTexts: FloatingText[],
		private getState: () => number,
		private setState: (state: number) => void,
	) {
		this.state = this.getState();
	}

	update() {
		this.state = this.getState();
		if (this.state & 1) {
			const updates = [
				// () => {
				//   this.player.dashCooldown.setDuration(
				//     Math.max(0, this.player.dashCooldown.getMaximum() - 10)
				//   );
				// },
				// () => {
				//   console.log('Dash speed +');
				// },
				// () => {
				//   this.player.fireCooldown.setDuration(
				//     Math.floor((this.player.fireCooldown.getMaximum() / 4) * 3)
				//   );
				// },
				() => {
					this.player.damage++;
				},
			];

			for (let i = 0; i < updates.length; i++) {
				if (
					this.mouse.pressed &&
					pir(this.mouse, {
						x: 45,
						y: 43 + 20 * i,
						width: 100,
						height: 14,
					})
				) {
					updates[i]();
					this.setState(this.state ^ 1);

					// Проверка на следующий уровень
					if (this.playerProgression.add(0)) {
						this.setState(this.getState() | 1);
						this.floatingTexts.push(
							new FloatingText(this.player.x, this.player.y - 20, `LEVEL UP! ${this.playerProgression.level}`, 120)
						);
					}
					break;
				}
			}
		}
	}

	render() {
		// HUD
		this.engine.context.fillStyle = '#fff';
		this.engine.context.fillText(`Score: ${this.playerProgression.experience}`, 10, 20);

		// Progress bar
		this.engine.context.fillStyle = '#060';
		this.engine.context.fillRect(0, 0, this.engine.canvas.width, 5);
		this.engine.context.fillStyle = '#494';
		this.engine.context.fillRect(
			0,
			0,
			this.engine.canvas.width * (this.playerProgression.experience / this.playerProgression.experienceToNext),
			5
		);

		// Cooldowns
		const cooldowns = this.player.getCooldowns();
		this.engine.context.fillStyle = '#ccc';
		for (let i = 0; i < cooldowns.length; i++) {
			this.engine.context.fillRect(5, this.engine.canvas.height - 10 - 10 * i, 100, 5);
		}
		this.engine.context.fillStyle = '#f99';
		for (let i = 0; i < cooldowns.length; i++) {
			this.engine.context.fillRect(
				5,
				this.engine.canvas.height - 10 - 10 * i,
				100 * cooldowns[i].val,
				5
			);
		}
		this.engine.context.fillStyle = '#fff';
		this.engine.context.textBaseline = 'middle';
		for (let i = 0; i < cooldowns.length; i++) {
			this.engine.context.fillText(
				cooldowns[i].name,
				110,
				this.engine.canvas.height - 5 - 2 - 10 * i
			);
		}

		// LVL UP screen
		if (this.state & 1) {
			this.drawLvlUpScreen();
		}
	}

	private drawLvlUpScreen() {
		this.engine.context.fillStyle = '#0006';
		this.engine.context.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);

		const texts = [/*'Dash cooldown -', 'Dash speed +', 'Rate of fire +',*/ 'Damage +'];

		this.engine.context.fillStyle = '#ccc';
		for (let i = 0; i < texts.length; i++) {
			if (
				pir(this.mouse, {
					x: 45,
					y: 43 + 20 * i,
					width: 100,
					height: 14,
				})
			) {
				this.engine.context.fillRect(50, 43 + 20 * i, 100, 14);
			} else {
				this.engine.context.fillRect(45, 43 + 20 * i, 100, 14);
			}
		}

		this.engine.context.fillStyle = '#000';
		this.engine.context.textBaseline = 'middle';
		for (let i = 0; i < texts.length; i++) {
			if (
				pir(this.mouse, {
					x: 45,
					y: 43 + 20 * i,
					width: 100,
					height: 14,
				})
			) {
				this.engine.context.fillText(texts[i], 55, 50 + 20 * i);
			} else {
				this.engine.context.fillText(texts[i], 50, 50 + 20 * i);
			}
		}
	}
}
