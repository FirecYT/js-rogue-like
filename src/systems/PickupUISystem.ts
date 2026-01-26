// src/systems/PickupUISystem.ts

import Engine from '../components/Engine';
import { Weapon } from '../items/Weapon';
import { Modifier } from '../items/Modifier';
import { Chip } from '../items/Chip';
import { PickupItem } from '../entities/PickupItem';
import { createPickupFromItem, pir } from '../utils';
import MouseInput from '../components/MouseInput';
import Entity from '../entities/Entity';

export class PickupUISystem {
	private _isActive = false;
	private pickupItem: PickupItem | null = null;

	constructor(
		private engine: Engine,
		private getControlledEntity: () => Entity,
		private mouse: MouseInput,
		private entities: Entity[]
	) { }

	activate(pickupItem: PickupItem) {
		this.pickupItem = pickupItem;
		this._isActive = true;
	}

	deactivate() {
		this._isActive = false;
		this.pickupItem = null;
	}

	isActive(): boolean {
		return this._isActive;
	}

	update() {
		if (!this._isActive || !this.pickupItem) return;

		const item = this.pickupItem.item;
		const type = item.type;

		// Определяем количество слотов
		let numSlots = 0;
		if (type === 'weapon') {
			numSlots = 1;
		} else if (type === 'modifier' && this.getControlledEntity().inventory.weapon) {
			numSlots = this.getControlledEntity().inventory.weapon?.modifiersSlots || 0;
		} else if (type === 'chip') {
			numSlots = 5;
		}

		// Обработка кликов по слотам
		if (this.mouse.pressed) {
			const slotWidth = 80;
			const slotHeight = 80;
			const slotSpacing = 95;
			const startX = 120;
			const startY = 150;

			for (let i = 0; i < numSlots; i++) {
				const slotY = startY + i * slotSpacing;
				const rect = {
					x: startX,
					y: slotY,
					width: slotWidth,
					height: slotHeight
				};
				if (pir(this.mouse, rect)) {
					this.placeItemInSlot(i);
					this.deactivate();
					return;
				}
			}

			// Клик по кнопке "Пропустить"
			const skipBtn = {
				x: this.engine.canvas.width / 2 - 50,
				y: this.engine.canvas.height - 60,
				width: 100,
				height: 40
			};
			if (pir(this.mouse, skipBtn)) {
				this.deactivate();
				return;
			}
		}
	}

	private placeItemInSlot(slotIndex: number) {
		if (!this.pickupItem) return;
		const item = this.pickupItem.item;
		const inventory = this.getControlledEntity().inventory;

		if (item.type === 'weapon') {
			const newWeapon = item as Weapon;
			const oldWeapon = inventory.weapon;
			const oldModifiers = inventory.modifiers.filter(m => m !== null);

			inventory.setWeapon(newWeapon);

			const newModifiers: (Modifier | null)[] = Array(newWeapon.modifiersSlots).fill(null);

			const droppedModifiers: Modifier[] = [];
			for (let i = 0; i < oldModifiers.length; i++) {
				if (i < newWeapon.modifiersSlots) {
					newModifiers[i] = oldModifiers[i];
				} else {
					droppedModifiers.push(oldModifiers[i]);
				}
			}

			inventory.modifiers = newModifiers;

			if (oldWeapon) {
				this.entities.push(createPickupFromItem(oldWeapon, this.getControlledEntity().x, this.getControlledEntity().y));
			}
			for (const mod of droppedModifiers) {
				mod.onUnequip?.(this.getControlledEntity());
				this.entities.push(
					createPickupFromItem(mod, this.getControlledEntity().x + (Math.random() - 0.5) * 40, this.getControlledEntity().y + (Math.random() - 0.5) * 40)
				);
			}
		} else if (item.type === 'modifier') {
			const oldMod = inventory.modifiers[slotIndex];
			if (oldMod) {
				oldMod.onUnequip?.(this.getControlledEntity());
				this.entities.push(createPickupFromItem(oldMod, this.getControlledEntity().x, this.getControlledEntity().y));
			}
			inventory.modifiers[slotIndex] = item as Modifier;
			item.onEquip?.(this.getControlledEntity());

		} else if (item.type === 'chip') {
			const oldChip = inventory.chips[slotIndex];
			if (oldChip) {
				this.entities.push(createPickupFromItem(oldChip, this.getControlledEntity().x, this.getControlledEntity().y));
			}
			const newChip = item as Chip;
			inventory.chips[slotIndex] = newChip;
			newChip.onEquip?.(this.getControlledEntity());
		}

		this.deactivate();
	}

	render() {
		if (!this._isActive || !this.pickupItem) return;

		const ctx = this.engine.context;
		const canvas = this.engine.canvas;
		const item = this.pickupItem.item;
		const type = item.type;

		// Полупрозрачный фон
		ctx.fillStyle = '#000a';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// === СЛОТЫ СЛЕВА (вертикально) ===
		let numSlots = 0;
		if (type === 'weapon') {
			numSlots = 1;
		} else if (type === 'modifier' && this.getControlledEntity().inventory.weapon) {
			numSlots = this.getControlledEntity().inventory.weapon?.modifiersSlots || 0;
		} else if (type === 'chip') {
			numSlots = 5;
		}

		const slotWidth = 80;
		const slotHeight = 80;
		const slotSpacing = 95;
		const startX = 120;
		const startY = 150;

		for (let i = 0; i < numSlots; i++) {
			const slotY = startY + i * slotSpacing;

			// Подсветка при наведении
			const rect = { x: startX, y: slotY, width: slotWidth, height: slotHeight };
			const hovered = pir(this.mouse, rect);

			ctx.fillStyle = hovered ? '#5a5' : '#aaa';
			ctx.fillRect(startX, slotY, slotWidth, slotHeight);
			ctx.strokeStyle = '#fff';
			ctx.lineWidth = 2;
			ctx.strokeRect(startX, slotY, slotWidth, slotHeight);

			// Надпись "Слот N"
			ctx.fillStyle = '#000';
			ctx.font = '14px Arial';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(`Слот ${i + 1}`, startX + slotWidth / 2, slotY + 20);

			// Текущий предмет в слоте
			let currentName = 'Пусто';
			if (type === 'weapon') {
				currentName = this.getControlledEntity().inventory.weapon?.name || 'Пусто';
			} else if (type === 'modifier') {
				currentName = this.getControlledEntity().inventory.modifiers[i]?.name || 'Пусто';
			} else if (type === 'chip') {
				currentName = this.getControlledEntity().inventory.chips[i]?.name || 'Пусто';
			}
			ctx.fillText(currentName, startX + slotWidth / 2, slotY + 50);
		}

		// === ПОДБИРАЕМЫЙ ПРЕДМЕТ СПРАВА ===
		const pickupX = canvas.width - 200;
		const pickupY = 150;
		ctx.fillStyle = '#ccc';
		ctx.fillRect(pickupX, pickupY, 150, 100);
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 2;
		ctx.strokeRect(pickupX, pickupY, 150, 100);

		ctx.fillStyle = '#000';
		ctx.font = '16px Arial';
		ctx.textAlign = 'center';
		ctx.fillText(item.name, pickupX + 75, pickupY + 30);
		ctx.fillText(
			type === 'weapon' ? 'Оружие' :
				type === 'modifier' ? 'Модификатор' : 'Чип',
			pickupX + 75, pickupY + 60
		);

		// === ИНСТРУКЦИЯ ===
		ctx.fillStyle = '#fff';
		ctx.font = '16px Arial';
		ctx.textAlign = 'center';
		ctx.fillText(`Выберите слот для размещения ${type === 'weapon' ? 'оружия' : type}`, canvas.width / 2, 100);

		// === КНОПКА "ПРОПУСТИТЬ" ===
		const skipX = canvas.width / 2 - 50;
		const skipY = canvas.height - 60;
		const skipW = 100;
		const skipH = 40;

		const skipHovered = pir(this.mouse, { x: skipX, y: skipY, width: skipW, height: skipH });
		ctx.fillStyle = skipHovered ? '#bbb' : '#aaa';
		ctx.fillRect(skipX, skipY, skipW, skipH);
		ctx.strokeStyle = '#888';
		ctx.lineWidth = 2;
		ctx.strokeRect(skipX, skipY, skipW, skipH);

		ctx.fillStyle = '#000';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('Пропустить', skipX + skipW / 2, skipY + skipH / 2);
	}
}
