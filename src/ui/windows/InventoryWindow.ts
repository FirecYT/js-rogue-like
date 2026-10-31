import { Window } from '../Window';
import type Entity from '../../entities/Entity';
import type { SlotRef } from '../../components/Inventory';
import { Button } from '../components/Button';
import { Label } from '../components/Label';
import { ItemSlot } from '../components/ItemSlot';
import { VerticalLayout } from '../containers/VerticalLayout';
import { HorizontalLayout } from '../containers/HorizontalLayout';
import type { Item } from '../../items/Item';
import type { PickupItem } from '../../entities/PickupItem';
import { createPickupFromItem } from '../../utils';
import type MouseInput from '../../components/MouseInput';

/** Слот окна вместе со ссылкой на слот инвентаря. */
interface BoundSlot {
	slot: ItemSlot;
	ref: SlotRef;
}

/**
 * Окно инвентаря с перетаскиванием предметов.
 * Слоты окна — чистое представление инвентаря сущности (single source of truth):
 * содержимое читается каждый кадр через inventory.getAt, а все изменения
 * выполняются доменными методами (swapSlots/removeAt). Локальной копии предметов нет.
 */
export class InventoryWindow extends Window {
	private onCloseCallback: (() => void) | null = null;
	private onItemDropped: ((pickup: PickupItem) => void) | null = null;

	private boundSlots: BoundSlot[] = [];

	/** Ссылка на слот, из которого начато перетаскивание, и сам предмет. */
	private dragRef: SlotRef | null = null;
	private dragItem: Item | null = null;
	/** Слот-цель под курсором (для подсветки). */
	private dropTarget: BoundSlot | null = null;

	/**
	 * @param entity - Сущность, чей инвентарь отображается
	 * @param canvasWidth - Ширина канваса
	 * @param canvasHeight - Высота канваса
	 */
	constructor(
		private readonly entity: Entity,
		canvasWidth: number,
		canvasHeight: number
	) {
		super();

		this.title = 'Инвентарь';
		this.causesPause = true;

		this.createUI();
		this.autoSize();
		this.centerWindow(canvasWidth, canvasHeight);
	}

	private createUI(): void {
		this.root.children = [];
		this.boundSlots = [];

		const layout = new VerticalLayout();
		layout.spacing = 10;
		layout.padding = { top: 40, right: 20, bottom: 20, left: 20 };

		const inventory = this.entity.inventory;

		// === ОРУЖИЕ ===
		const weaponLayout = new VerticalLayout();
		weaponLayout.addChild(new Label('Оружие:'));
		const weaponSlot = new ItemSlot(80, 80);
		weaponLayout.addChild(weaponSlot);
		this.boundSlots.push({ slot: weaponSlot, ref: { type: 'weapon', index: -1 } });

		// === ОЧЕРЕДЬ ЗАКЛИНАНИЙ ===
		const spellsLayout = new VerticalLayout();
		spellsLayout.addChild(new Label('Очередь заклинаний:'));
		const spellsRow = new HorizontalLayout();
		const queueLength = inventory.weapon?.queue.length ?? 0;
		for (let i = 0; i < queueLength; i++) {
			const slot = new ItemSlot(60, 60);
			spellsRow.addChild(slot);
			this.boundSlots.push({ slot, ref: { type: 'spell', index: i } });
		}
		spellsLayout.addChild(spellsRow);

		// === ЧИПЫ ===
		const chipsLayout = new VerticalLayout();
		chipsLayout.addChild(new Label('Чипы:'));
		const chipsRow = new HorizontalLayout();
		for (let i = 0; i < inventory.chips.length; i++) {
			const slot = new ItemSlot(60, 60);
			chipsRow.addChild(slot);
			this.boundSlots.push({ slot, ref: { type: 'chip', index: i } });
		}
		chipsLayout.addChild(chipsRow);

		const itemsLayout = new HorizontalLayout();
		itemsLayout.addChild(weaponLayout);
		itemsLayout.addChild(spellsLayout);
		itemsLayout.addChild(chipsLayout);
		layout.addChild(itemsLayout);

		const closeButton = new Button(
			'Закрыть',
			layout.width - layout.padding.left - layout.padding.right,
			40
		);
		closeButton.setOnClick(() => {
			this.onCloseCallback?.();
		});
		layout.addChild(closeButton);

		this.root.addChild(layout);
	}

	update(mouse: MouseInput): void {
		super.update(mouse);
		this.lastMousePos = { x: mouse.x, y: mouse.y };

		// Синхронизация слотов с инвентарём (источник перетаскивания показываем пустым)
		for (const { slot, ref } of this.boundSlots) {
			const isDragSource =
				this.dragRef !== null &&
				this.dragRef.type === ref.type &&
				this.dragRef.index === ref.index;
			slot.setItem(isDragSource ? null : this.entity.inventory.getAt(ref));
		}

		if (mouse.pressed && !this.dragItem) {
			this.startDrag(mouse);
		}
		if (this.dragItem) {
			this.dropTarget = this.findDropTarget(mouse);
		}
		if (!mouse.pressed && this.dragItem) {
			this.handleDrop(mouse);
		}
	}

	/** Начинает перетаскивание, если курсор над непустым слотом. */
	private startDrag(mouse: MouseInput): void {
		for (const bound of this.boundSlots) {
			if (!this.isOverSlot(bound.slot, mouse)) continue;
			const item = this.entity.inventory.getAt(bound.ref);
			if (!item) continue;
			this.dragRef = bound.ref;
			this.dragItem = item;
			break;
		}
	}

	/** Ищет слот-цель под курсором, совместимый с перетаскиваемым предметом. */
	private findDropTarget(mouse: MouseInput): BoundSlot | null {
		if (!this.dragItem) return null;
		for (const bound of this.boundSlots) {
			if (!this.isOverSlot(bound.slot, mouse)) continue;
			if (bound.ref.type !== this.dragItem.type) return null;
			if (
				this.dragRef &&
				this.dragRef.type === bound.ref.type &&
				this.dragRef.index === bound.ref.index
			) {
				return null; // тот же слот
			}
			return bound;
		}
		return null;
	}

	/** Завершает перетаскивание: обмен слотов, выброс наружу или отмена. */
	private handleDrop(mouse: MouseInput): void {
		const ref = this.dragRef;
		const item = this.dragItem;
		this.dragRef = null;
		this.dragItem = null;
		this.dropTarget = null;
		if (!ref || !item) return;

		// Цель — совместимый слот: обмен содержимым
		const target = this.findDropTarget(mouse);
		if (target) {
			this.entity.inventory.swapSlots(ref, target.ref);
			return;
		}

		// Бросок за пределы окна — выброс предмета в мир
		if (!this.isPointInsideWindow(mouse.x, mouse.y)) {
			const dropped = this.entity.inventory.removeAt(ref);
			if (dropped) {
				this.onItemDropped?.(
					createPickupFromItem(dropped, this.entity.x, this.entity.y)
				);
			}
		}
		// Иначе (внутри окна, не над слотом) — отмена, предмет остаётся в слоте
	}

	private isOverSlot(slot: ItemSlot, mouse: MouseInput): boolean {
		const pos = slot.getGlobalPosition();
		return (
			mouse.x >= pos.x &&
			mouse.x <= pos.x + slot.width &&
			mouse.y >= pos.y &&
			mouse.y <= pos.y + slot.height
		);
	}

	private isPointInsideWindow(x: number, y: number): boolean {
		return (
			x >= this.x && x <= this.x + this.width &&
			y >= this.y && y <= this.y + this.height
		);
	}

	render(ctx: CanvasRenderingContext2D): void {
		super.render(ctx);

		// Перетаскиваемый предмет рисуется поверх окна
		if (this.dragItem) {
			this.renderDraggedItem(ctx, this.dropTarget);
		}
	}

	private renderDraggedItem(
		ctx: CanvasRenderingContext2D,
		target: BoundSlot | null
	): void {
		const item = this.dragItem as Item;

		// Подсветка слота-цели
		if (target) {
			const pos = target.slot.getGlobalPosition();
			ctx.strokeStyle = '#6ff';
			ctx.lineWidth = 2;
			ctx.strokeRect(pos.x - 2, pos.y - 2, target.slot.width + 4, target.slot.height + 4);
		}

		// Предмет «в руке» следует за курсором
		const { x, y } = this.lastMousePos;
		ctx.globalAlpha = 0.9;
		ctx.fillStyle = '#2a4a2a';
		ctx.fillRect(x - 30, y - 30, 60, 60);
		ctx.strokeStyle = '#6ff';
		ctx.lineWidth = 2;
		ctx.strokeRect(x - 30, y - 30, 60, 60);
		ctx.fillStyle = '#fff';
		ctx.font = '12px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(item.name, x, y);
		ctx.globalAlpha = 1.0;
	}

	/** Позиция курсора на последний update (для отрисовки «в руке»). */
	private lastMousePos = { x: 0, y: 0 };

	setOnClose(callback: () => void): void {
		this.onCloseCallback = callback;
	}

	setOnItemDropped(callback: (pickup: PickupItem) => void): void {
		this.onItemDropped = callback;
	}
}
