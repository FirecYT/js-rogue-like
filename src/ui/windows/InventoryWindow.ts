import { Window } from '../Window';
import Entity from '../../entities/Entity';
import { Button } from '../components/Button';
import { Label } from '../components/Label';
import { ItemSlot } from '../components/ItemSlot';
import { VerticalLayout } from '../containers/VerticalLayout';
import { HorizontalLayout } from '../containers/HorizontalLayout';
import { Item } from '../../items/Item';
import { Weapon } from '../../items/Weapon';
import { Modifier } from '../../items/Modifier';
import { Chip } from '../../items/Chip';
import { PickupItem } from '../../entities/PickupItem';
import { createPickupFromItem } from '../../utils';
import MouseInput from '../../components/MouseInput';

/**
 * Окно инвентаря с поддержкой перетаскивания предметов
 */
export class InventoryWindow extends Window {
	private entity: Entity;
	private onCloseCallback: (() => void) | null = null;
	private onItemDropped: ((pickup: PickupItem) => void) | null = null;

	// Слоты для прямого доступа
	private weaponSlot: ItemSlot | null = null;
	private modifierSlots: ItemSlot[] = [];
	private chipSlots: ItemSlot[] = [];

	// Состояние перетаскивания (всё хранится в окне!)
	private draggedItem: Item | null = null;
	private dragSource: { type: 'weapon' | 'modifier' | 'chip', index: number } | null = null;
	private dragVisual: { x: number, y: number, item: Item } | null = null;
	private dropTargetSlot: ItemSlot | null = null;

	constructor(
		entity: Entity,
		canvasWidth: number,
		canvasHeight: number
	) {
		super();

		this.entity = entity;

		this.x = (canvasWidth - 500) / 2;
		this.y = (canvasHeight - 400) / 2;
		this.width = 500;
		this.height = 400;
		this.title = 'Инвентарь';
		this.causesPause = true;

		this.createUI();
		this.autoSize();
		this.centerWindow(canvasWidth, canvasHeight);
	}

	private createUI(): void {
		this.root.children = [];
		this.modifierSlots = [];
		this.chipSlots = [];

		const layout = new VerticalLayout();
		layout.spacing = 10;
		layout.padding = { top: 40, right: 20, bottom: 20, left: 20 };

		// === ОРУЖИЕ ===
		const weaponLayout = new VerticalLayout();
		weaponLayout.addChild(new Label('Оружие:'));
		this.weaponSlot = new ItemSlot(80, 80, this.entity.inventory.weapon);
		weaponLayout.addChild(this.weaponSlot);

		// === МОДИФИКАТОРЫ ===
		const modifiersLayout = new VerticalLayout();
		modifiersLayout.addChild(new Label('Модификаторы:'));
		for (const modifier of this.entity.inventory.modifiers) {
			const slot = new ItemSlot(60, 60, modifier);
			modifiersLayout.addChild(slot);
			this.modifierSlots.push(slot);
		}

		// === ЧИПЫ ===
		const chipsLayout = new VerticalLayout();
		chipsLayout.addChild(new Label('Чипы:'));
		for (const chip of this.entity.inventory.chips) {
			const slot = new ItemSlot(60, 60, chip);
			chipsLayout.addChild(slot);
			this.chipSlots.push(slot);
		}

		// Объединяем в горизонтальный лейаут
		const itemsLayout = new HorizontalLayout();

		itemsLayout.addChild(weaponLayout);
		itemsLayout.addChild(modifiersLayout);
		itemsLayout.addChild(chipsLayout);

		layout.addChild(itemsLayout);

		// Кнопка закрытия
		const closeButton = new Button('Закрыть', layout.width - layout.padding.left - layout.padding.right, 40);
		closeButton.setOnClick(() => {
			if (this.onCloseCallback) this.onCloseCallback();
		});

		layout.addChild(closeButton);

		this.root.addChild(layout);
	}

	update(mouse: MouseInput): void {
		super.update(mouse);

		// Начало перетаскивания
		if (mouse.pressed && !this.draggedItem) {
			this.startDrag(mouse);
		}

		// Обновление позиции перетаскиваемого предмета
		if (this.draggedItem && this.dragVisual) {
			this.dragVisual.x = mouse.x;
			this.dragVisual.y = mouse.y;
			this.updateDropTarget(mouse);
		}

		// Завершение перетаскивания
		if (!mouse.pressed && this.draggedItem) {
			this.handleDrop(mouse);
		}
	}

	private startDrag(mouse: MouseInput): void {
		// Проверяем все слоты на клик
		const allSlots = [
			{ slot: this.weaponSlot, type: 'weapon', index: -1 },
			...this.modifierSlots.map((slot, i) => ({ slot, type: 'modifier' as const, index: i })),
			...this.chipSlots.map((slot, i) => ({ slot, type: 'chip' as const, index: i }))
		].filter(entry => entry.slot !== null) as { slot: ItemSlot; type: 'weapon' | 'modifier' | 'chip'; index: number }[];

		for (const { slot, type, index } of allSlots) {
			if (!slot.item) continue;

			const globalPos = slot.getGlobalPosition();

			if (mouse.x >= globalPos.x && mouse.x <= globalPos.x + slot.width &&
				mouse.y >= globalPos.y && mouse.y <= globalPos.y + slot.height) {

				// Сохраняем предмет и очищаем слот
				this.draggedItem = slot.item;
				this.dragSource = { type, index };
				slot.setItem(null);

				// Создаём визуальное представление
				this.dragVisual = {
					x: mouse.x,
					y: mouse.y,
					item: this.draggedItem
				};
				break;
			}
		}
	}

	private updateDropTarget(mouse: MouseInput): void {
		// Сбрасываем предыдущую цель
		if (this.dropTargetSlot) {
			this.dropTargetSlot = null;
		}

		// Ищем новый слот под курсором
		const allSlots = [
			{ slot: this.weaponSlot, type: 'weapon' },
			...this.modifierSlots.map(slot => ({ slot, type: 'modifier' as const })),
			...this.chipSlots.map(slot => ({ slot, type: 'chip' as const }))
		].filter(entry => entry.slot !== null) as { slot: ItemSlot; type: 'weapon' | 'modifier' | 'chip' }[];

		for (const { slot, type } of allSlots) {
			const globalPos = slot.getGlobalPosition();

			// Проверяем попадание курсора в слот
			if (mouse.x >= globalPos.x && mouse.x <= globalPos.x + slot.width &&
				mouse.y >= globalPos.y && mouse.y <= globalPos.y + slot.height) {

				// Проверяем совместимость типов предмета и слота
				if (this.draggedItem && this.isValidDropTarget(type, this.draggedItem)) {
					this.dropTargetSlot = slot;
				}
				break;
			}
		}
	}

	private handleDrop(mouse: MouseInput): void {
		if (!this.draggedItem || !this.dragSource) {
			this.resetDragState();
			return;
		}

		if (this.dropTargetSlot) {
			const targetItem = this.dropTargetSlot.item;
			this.dropTargetSlot.setItem(this.draggedItem);

			if (targetItem) {
				this.setItemAt(this.dragSource, targetItem);
			}

			this.updateEntityInventory();
		} else if (!this.isPointInsideWindow(mouse.x, mouse.y)) {
			this.throwItem(this.draggedItem);

			this.updateEntityInventory();
		} else {
			this.setItemAt(this.dragSource, this.draggedItem);
		}

		this.resetDragState();
	}

	private throwItem(item: Item): void {
		if (this.onItemDropped) {
			const pickup = createPickupFromItem(item, this.entity.x, this.entity.y);
			this.onItemDropped(pickup);
		}
	}

	private setItemAt(
		location: { type: 'weapon' | 'modifier' | 'chip', index: number },
		item: Item | null
	): void {
		switch (location.type) {
			case 'weapon':
				this.entity.inventory.setWeapon(item as Weapon | null);
				this.weaponSlot?.setItem(item);
				break;
			case 'modifier': {
				const slot = this.modifierSlots[location.index];
				this.entity.inventory.modifiers[location.index] = item as Modifier | null;
				slot?.setItem(item);
				break;
			}
			case 'chip': {
				const slot = this.chipSlots[location.index];
				this.entity.inventory.chips[location.index] = item as Chip | null;
				slot?.setItem(item);
				break;
			}
		}
	}

	private updateEntityInventory(): void {
		// Синхронизируем слоты с инвентарём сущности
		if (this.weaponSlot) {
			this.entity.inventory.setWeapon(this.weaponSlot.item as Weapon | null);
		}

		for (let i = 0; i < this.modifierSlots.length; i++) {
			this.entity.inventory.modifiers[i] = this.modifierSlots[i].item as Modifier | null;
		}

		for (let i = 0; i < this.chipSlots.length; i++) {
			this.entity.inventory.chips[i] = this.chipSlots[i].item as Chip | null;
		}
	}

	private isValidDropTarget(slotType: 'weapon' | 'modifier' | 'chip', item: Item): boolean {
		switch (slotType) {
			case 'weapon': return item.type === 'weapon';
			case 'modifier': return item.type === 'modifier';
			case 'chip': return item.type === 'chip';
			default: return false;
		}
	}

	private isPointInsideWindow(x: number, y: number): boolean {
		return x >= this.x && x <= this.x + this.width &&
			y >= this.y && y <= this.y + this.height;
	}

	private resetDragState(): void {
		this.draggedItem = null;
		this.dragSource = null;
		this.dragVisual = null;

		// Сбрасываем подсветку всех слотов
		if (this.dropTargetSlot) {
			this.dropTargetSlot = null;
		}
	}

	render(ctx: CanvasRenderingContext2D): void {
		super.render(ctx);

		// Отрисовка перетаскиваемого предмета ПОВЕРХ окна
		if (this.dragVisual) {
			this.renderDraggedItem(ctx, this.dragVisual.x, this.dragVisual.y, this.dragVisual.item);
		}
	}

	private renderDraggedItem(ctx: CanvasRenderingContext2D, x: number, y: number, item: Item): void {
		// Полупрозрачный прямоугольник
		ctx.globalAlpha = 0.9;
		ctx.fillStyle = '#2a4a2a';
		ctx.fillRect(x - 30, y - 30, 60, 60);

		// Рамка
		ctx.strokeStyle = '#6ff';
		ctx.lineWidth = 2;
		ctx.strokeRect(x - 30, y - 30, 60, 60);

		// Название предмета
		ctx.fillStyle = '#fff';
		ctx.font = '12px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(item.name, x, y);

		ctx.globalAlpha = 1.0;
	}

	setOnClose(callback: () => void): void {
		this.onCloseCallback = callback;
	}

	setOnItemDropped(callback: (pickup: PickupItem) => void): void {
		this.onItemDropped = callback;
	}
}
