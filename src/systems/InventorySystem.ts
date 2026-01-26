// src/systems/InventorySystem.ts
import Engine from '../components/Engine';
import MouseInput from '../components/MouseInput';
import Keyboard from '../components/Keyboard';
import Entity from '../entities/Entity';
import { Chip } from '../items/Chip';
import { Modifier } from '../items/Modifier';

export class InventorySystem {
	private isOpen = false;
	private draggedItem: Chip | Modifier | null = null;
	private dragStartSlot: number | null = null;
	private dragType: 'chip' | 'modifier' | null = null;

	constructor(
		private engine: Engine,
		private mouse: MouseInput,
		private getControlledEntity: () => Entity
	) { }

	update(): void {
		const keyboard = Keyboard.getInstance();
		if (keyboard.isKeyPressedOnce('KeyI')) {
			this.isOpen = !this.isOpen;
			if (!this.isOpen) {
				// Сбросить перетаскивание при закрытии
				this.draggedItem = null;
				this.dragStartSlot = null;
				this.dragType = null;
			}
		}

		if (!this.isOpen) return;

		const entity = this.getControlledEntity();
		const inventory = entity.inventory;

		// Начало перетаскивания
		if (this.mouse.pressed && !this.draggedItem) {
			const chipSlot = this.getChipSlotAt(this.mouse.x, this.mouse.y);
			if (chipSlot !== -1 && inventory.chips[chipSlot]) {
				this.draggedItem = inventory.chips[chipSlot];
				this.dragStartSlot = chipSlot;
				this.dragType = 'chip';
				inventory.chips[chipSlot] = null;
				return;
			}

			const modSlot = this.getModifierSlotAt(this.mouse.x, this.mouse.y);
			if (modSlot !== -1 && inventory.modifiers[modSlot]) {
				this.draggedItem = inventory.modifiers[modSlot];
				this.dragStartSlot = modSlot;
				this.dragType = 'modifier';
				inventory.modifiers[modSlot] = null;
				return;
			}
		}

		// Завершение перетаскивания
		if (!this.mouse.pressed && this.draggedItem) {
			if (this.dragType === 'chip') {
				const targetSlot = this.getChipSlotAt(this.mouse.x, this.mouse.y);
				if (targetSlot !== -1 && targetSlot < 5) {
					const oldChip = inventory.chips[targetSlot];
					const draggedChip = this.draggedItem as Chip;

					oldChip?.onUnequip?.(entity);
					draggedChip.onUnequip?.(entity);

					inventory.chips[targetSlot] = draggedChip;
					if (this.dragStartSlot !== null) {
						inventory.chips[this.dragStartSlot] = oldChip;
					}

					draggedChip.onEquip?.(entity);
					oldChip?.onEquip?.(entity);
				} else {
					if (this.dragStartSlot !== null) inventory.chips[this.dragStartSlot] = this.draggedItem as Chip;
				}
			} else if (this.dragType === 'modifier') {
				const targetSlot = this.getModifierSlotAt(this.mouse.x, this.mouse.y);
				if (
					targetSlot !== -1 &&
					inventory.weapon &&
					targetSlot < inventory.weapon.modifiersSlots
				) {
					const oldMod = inventory.modifiers[targetSlot];
					inventory.modifiers[targetSlot] = this.draggedItem as Modifier;
					if (this.dragStartSlot !== null) inventory.modifiers[this.dragStartSlot] = oldMod;
				} else {
					if (this.dragStartSlot !== null) inventory.modifiers[this.dragStartSlot] = this.draggedItem as Modifier;
				}
			}

			this.draggedItem = null;
			this.dragStartSlot = null;
			this.dragType = null;
		}
	}

	render(): void {
		if (!this.isOpen) return;

		const entity = this.getControlledEntity();
		const ctx = this.engine.context;
		const width = 500;
		const height = 400;
		const x = (this.engine.canvas.width - width) / 2;
		const y = (this.engine.canvas.height - height) / 2;

		// Фон
		ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
		ctx.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);

		// Окно инвентаря
		ctx.fillStyle = '#222';
		ctx.fillRect(x, y, width, height);
		ctx.strokeStyle = '#666';
		ctx.lineWidth = 2;
		ctx.strokeRect(x, y, width, height);

		// Заголовок
		ctx.fillStyle = '#fff';
		ctx.font = '18px Arial';
		ctx.textAlign = 'center';
		ctx.fillText('INVENTORY', x + width / 2, y + 25);

		// Секции
		this.renderWeaponSection(ctx, x + 20, y + 40, entity);
		this.renderModifiersSection(ctx, x + 20, y + 140, entity);
		this.renderChipsSection(ctx, x + 20, y + 260, entity);

		// Перетаскиваемый предмет под курсором
		if (this.draggedItem) {
			ctx.fillStyle = '#444';
			ctx.fillRect(this.mouse.x - 60, this.mouse.y - 20, 120, 40);
			ctx.strokeStyle = '#aaa';
			ctx.strokeRect(this.mouse.x - 60, this.mouse.y - 20, 120, 40);
			ctx.fillStyle = '#fff';
			ctx.font = '14px Arial';
			ctx.textAlign = 'center';
			ctx.fillText(this.draggedItem.name, this.mouse.x, this.mouse.y + 5);
		}
	}

	// --- Рендер секций ---
	private renderWeaponSection(ctx: CanvasRenderingContext2D, x: number, y: number, entity: Entity): void {
		ctx.fillStyle = '#eee';
		ctx.fillText('WEAPON:', x, y);
		const weapon = entity.inventory.weapon;
		if (weapon) {
			ctx.fillStyle = '#0f0';
			ctx.fillText(weapon.name, x + 80, y);
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
		const inventory = entity.inventory;
		const slots = inventory.weapon ? inventory.weapon.modifiersSlots : 0;

		ctx.fillStyle = '#eee';
		ctx.fillText('MODIFIERS:', x, y);

		for (let i = 0; i < slots; i++) {
			const rect = { x: x + i * 90, y: y + 20, width: 80, height: 80 };
			const hovered = this.pir(this.mouse, rect);
			const hasItem = i < inventory.modifiers.length && inventory.modifiers[i] !== null;

			ctx.fillStyle = hovered ? '#444' : '#333';
			ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
			ctx.strokeStyle = hasItem ? '#0af' : '#666';
			ctx.lineWidth = 2;
			ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

			if (hasItem) {
				ctx.fillStyle = '#0af';
				ctx.fillText(inventory.modifiers[i]?.name || '', rect.x + 40, rect.y + 45);
			} else {
				ctx.fillStyle = '#666';
				ctx.fillText('Empty', rect.x + 40, rect.y + 45);
			}
		}
	}

	private renderChipsSection(ctx: CanvasRenderingContext2D, x: number, y: number, entity: Entity): void {
		const chips = entity.inventory.chips;

		ctx.fillStyle = '#eee';
		ctx.fillText('CHIPS:', x, y);

		for (let i = 0; i < 5; i++) {
			const rect = { x: x + i * 90, y: y + 20, width: 80, height: 80 };
			const hovered = this.pir(this.mouse, rect);
			const chip = chips[i];

			ctx.fillStyle = hovered ? '#444' : '#333';
			ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
			ctx.strokeStyle = chip ? (chip.isActive ? '#f0f' : '#0af') : '#666';
			ctx.lineWidth = 2;
			ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

			if (chip) {
				ctx.fillStyle = chip.isActive ? '#f0f' : '#0af';
				ctx.fillText(chip.name, rect.x + 40, rect.y + 45);
				if (!entity.inventory.isChipReady(i) && chip.cooldown) {
					ctx.fillStyle = '#f90';
					const p = chip.cooldown.progress();
					ctx.fillText(`${Math.ceil(p * 100)}%`, rect.x + 40, rect.y + 65);
				}
			} else {
				ctx.fillStyle = '#666';
				ctx.fillText('Empty', rect.x + 40, rect.y + 45);
			}
		}
	}

	// --- Вспомогательные функции ---
	private getChipSlotAt(mouseX: number, mouseY: number): number {
		const x = (this.engine.canvas.width - 500) / 2 + 20;
		const y = (this.engine.canvas.height - 400) / 2 + 260 + 20;
		for (let i = 0; i < 5; i++) {
			const rect = { x: x + i * 90, y, width: 80, height: 80 };
			if (this.pir({ x: mouseX, y: mouseY }, rect)) return i;
		}
		return -1;
	}

	private getModifierSlotAt(mouseX: number, mouseY: number): number {
		const entity = this.getControlledEntity();
		const slots = entity.inventory.weapon?.modifiersSlots || 0;
		const x = (this.engine.canvas.width - 500) / 2 + 20;
		const y = (this.engine.canvas.height - 400) / 2 + 140 + 20;
		for (let i = 0; i < slots; i++) {
			const rect = { x: x + i * 90, y, width: 80, height: 80 };
			if (this.pir({ x: mouseX, y: mouseY }, rect)) return i;
		}
		return -1;
	}

	private pir(point: { x: number; y: number }, rect: { x: number; y: number; width: number; height: number }) {
		return (
			point.x > rect.x &&
			point.y > rect.y &&
			point.x < rect.x + rect.width &&
			point.y < rect.y + rect.height
		);
	}
}
