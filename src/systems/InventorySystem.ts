import Engine from '../components/Engine';
import Keyboard from '../components/Keyboard';
import Entity from '../entities/Entity';

export class InventorySystem {
	private isOpen = false;

	constructor(
		private engine: Engine,
		private getControlledEntity: () => Entity
	) { }

	update(): void {
		const keyboard = Keyboard.getInstance();

		if (keyboard.isKeyPressedOnce('KeyI')) {
			this.isOpen = !this.isOpen;
			console.log(`Inventory ${this.isOpen ? 'opened' : 'closed'}`);
		}
	}

	render(): void {
		if (!this.isOpen) return;

		const entity = this.getControlledEntity();
		const ctx = this.engine.context;
		const width = 400;
		const height = 300;
		const x = (this.engine.canvas.width - width) / 2;
		const y = (this.engine.canvas.height - height) / 2;

		// Фон инвентаря
		ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
		ctx.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);

		// Основное окно
		ctx.fillStyle = '#333';
		ctx.fillRect(x, y, width, height);
		ctx.strokeStyle = '#666';
		ctx.lineWidth = 2;
		ctx.strokeRect(x, y, width, height);

		// Заголовок
		ctx.fillStyle = '#fff';
		ctx.font = '18px Arial';
		ctx.textAlign = 'center';
		ctx.fillText('INVENTORY', x + width / 2, y + 25);
		ctx.textAlign = 'left';
		ctx.font = '14px Arial';

		// Оружие
		this.renderWeaponSection(ctx, x + 20, y + 40, entity);

		// Модификаторы
		this.renderModifiersSection(ctx, x + 20, y + 120, entity);

		// Чипы
		this.renderChipsSection(ctx, x + 20, y + 200, entity);
	}

	private renderWeaponSection(ctx: CanvasRenderingContext2D, x: number, y: number, entity: Entity): void {
		ctx.fillStyle = '#eee';
		ctx.fillText('WEAPON:', x, y);

		const weapon = entity.inventory.weapon;
		if (weapon) {
			ctx.fillStyle = '#0f0';
			ctx.fillText(weapon.name, x + 80, y);

			// Статы оружия
			ctx.fillStyle = '#ccc';
			ctx.fillText(`Damage: ${weapon.damage}`, x, y + 20);
			ctx.fillText(`Fire rate: ${weapon.fireRate}`, x, y + 40);
			ctx.fillText(`Projectiles: ${weapon.projectileCount}`, x, y + 60);
			ctx.fillText(`Modifier slots: ${weapon.modifiersSlots}`, x, y + 80);
		} else {
			ctx.fillStyle = '#f00';
			ctx.fillText('None', x + 80, y);
		}
	}

	private renderModifiersSection(ctx: CanvasRenderingContext2D, x: number, y: number, entity: Entity): void {
		ctx.fillStyle = '#eee';
		ctx.fillText('MODIFIERS:', x, y);

		const modifiers = entity.inventory.modifiers;
		if (modifiers.length === 0) {
			ctx.fillStyle = '#999';
			ctx.fillText('None equipped', x, y + 20);
		}

		for (let i = 0; i < modifiers.length; i++) {
			const modifier = modifiers[i];
			ctx.fillStyle = '#0af';
			ctx.fillText(`${i + 1}. ${modifier.name}`, x, y + 20 + i * 20);
		}
	}

	private renderChipsSection(ctx: CanvasRenderingContext2D, x: number, y: number, entity: Entity): void {
		ctx.fillStyle = '#eee';
		ctx.fillText('CHIPS:', x, y);

		const chips = entity.inventory.chips;
		for (let i = 0; i < 5; i++) {
			const chip = chips[i];
			const isActive = chip && chip.isActive;
			const ready = chip && entity.cooldowns.isReady(`chip_${i}`);

			if (chip) {
				ctx.fillStyle = isActive ? '#f0f' : '#0af';
				ctx.fillText(`${i + 1}. ${chip.name}`, x, y + 20 + i * 20);

				// Статус кулдауна
				if (!ready) {
					ctx.fillStyle = '#f90';
					const progress = entity.cooldowns.get(`chip_${i}`)?.progress() || 0;
					ctx.fillText(`(${Math.ceil(progress * 100)}% ready)`, x + 150, y + 20 + i * 20);
				}
			} else {
				ctx.fillStyle = '#999';
				ctx.fillText(`${i + 1}. Empty slot`, x, y + 20 + i * 20);
			}
		}
	}
}
