import { Window } from '../Window';
import type Entity from '../../entities/Entity';
import type { Trader } from '../../entities/Trader';
import type { SlotRef } from '../../components/Inventory';
import { Button } from '../components/Button';
import { Label } from '../components/Label';
import { ItemSlot } from '../components/ItemSlot';
import { VerticalLayout } from '../containers/VerticalLayout';
import { HorizontalLayout } from '../containers/HorizontalLayout';
import type MouseInput from '../../components/MouseInput';
import { eventBus } from '../../events/EventBus';

/**
 * Окно бартера: прилавок торговца (3 предложения) и ряд предметов игрока
 * того же типа, что и выбранное предложение. Клик по предложению выбирает
 * его, клик по предмету игрока совершает обмен 1:1 (предметы меняются
 * слотами: прилавок ↔ слот инвентаря).
 */
export class TradeWindow extends Window {
	private offerSlots: ItemSlot[] = [];
	private playerSlots: { slot: ItemSlot; ref: SlotRef }[] = [];
	private selectedOffer = -1;

	/**
	 * @param trader - Торговец с прилавком
	 * @param entity - Сущность-покупатель
	 * @param canvasWidth - Ширина канваса
	 * @param canvasHeight - Высота канваса
	 */
	constructor(
		private readonly trader: Trader,
		private readonly entity: Entity,
		canvasWidth: number,
		canvasHeight: number
	) {
		super();

		this.title = 'Бартер торговца руин';
		this.causesPause = true;
		this.lastCanvasWidth = canvasWidth;
		this.lastCanvasHeight = canvasHeight;

		this.createUI();
		this.autoSize();
		this.centerWindow(canvasWidth, canvasHeight);
	}

	/**
	 * Пересоздаёт UI: прилавок и (при выбранном предложении) ряд предметов игрока.
	 */
	private createUI(): void {
		this.root.children = [];
		this.offerSlots = [];
		this.playerSlots = [];

		const layout = new VerticalLayout();
		layout.spacing = 10;
		layout.padding = { top: 40, right: 20, bottom: 20, left: 20 };

		layout.addChild(new Label('Прилавок (клик — выбрать):'));
		const offerRow = new HorizontalLayout();
		offerRow.spacing = 8;
		for (const offer of this.trader.offers) {
			const slot = new ItemSlot(60, 60, offer);
			offerRow.addChild(slot);
			this.offerSlots.push(slot);
		}
		layout.addChild(offerRow);

		const selected = this.trader.offers[this.selectedOffer];
		if (selected) {
			layout.addChild(
				new Label(`Ваш товар того же типа («${selected.name}» → вам):`)
			);
			const playerRow = new HorizontalLayout();
			playerRow.spacing = 8;
			for (const ref of this.playerRefsOfType(selected.type)) {
				const slot = new ItemSlot(
					56,
					56,
					this.entity.inventory.getAt(ref)
				);
				playerRow.addChild(slot);
				this.playerSlots.push({ slot, ref });
			}
			if (this.playerSlots.length === 0) {
				layout.addChild(new Label('Нечего предложить.'));
			} else {
				layout.addChild(playerRow);
			}
		} else {
			layout.addChild(new Label('Выберите предложение прилавка.'));
		}

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

	/**
	 * Ссылки на занятые слоты инвентаря игрока заданного типа.
	 * @param type - Тип предмета
	 * @returns Массив ссылок слотов
	 */
	private playerRefsOfType(type: string): SlotRef[] {
		const inventory = this.entity.inventory;
		const refs: SlotRef[] = [];
		const pushIfFilled = (ref: SlotRef) => {
			if (inventory.getAt(ref)) refs.push(ref);
		};
		pushIfFilled({ type: 'weapon', index: -1 });
		for (let i = 0; i < (inventory.weapon?.modifierSlots.length ?? 0); i++) {
			pushIfFilled({ type: 'modifier', index: i });
		}
		for (let i = 0; i < inventory.chips.length; i++) {
			pushIfFilled({ type: 'chip', index: i });
		}
		return refs.filter((ref) => ref.type === type);
	}

	/**
	 * Обрабатывает клики: выбор предложения или совершение бартера.
	 * @param mouseX - Координата клика X
	 * @param mouseY - Координата клика Y
	 */
	handleClick(mouseX: number, mouseY: number): void {
		for (let i = 0; i < this.offerSlots.length; i++) {
			if (this.isOver(this.offerSlots[i], mouseX, mouseY)) {
				if (this.trader.offers[i]) {
					this.selectedOffer = i;
					this.createUI();
					this.autoSize();
					this.centerWindow(this.lastCanvasWidth, this.lastCanvasHeight);
				}
				return;
			}
		}
		for (const { slot, ref } of this.playerSlots) {
			if (this.isOver(slot, mouseX, mouseY)) {
				this.doBarter(ref);
				return;
			}
		}
	}

	/**
	 * Совершает бартер: предмет слота игрока уходит на прилавок,
	 * предложение торговца занимает слот игрока.
	 * @param ref - Слот инвентаря игрока
	 */
	private doBarter(ref: SlotRef): void {
		const playerItem = this.entity.inventory.getAt(ref);
		if (!playerItem || this.selectedOffer < 0) return;

		this.trader.barter(this.selectedOffer, playerItem, (offer) => {
			this.entity.inventory.setAt(ref, offer);
		});
		eventBus.emit('barterCompleted', {
			offerId: playerItem.id,
			playerId: playerItem.id,
		});
		this.selectedOffer = -1;
		this.createUI();
		this.autoSize();
		this.centerWindow(this.lastCanvasWidth, this.lastCanvasHeight);
	}

	private isOver(
		slot: ItemSlot,
		mouseX: number,
		mouseY: number
	): boolean {
		const pos = slot.getGlobalPosition();
		return (
			mouseX >= pos.x &&
			mouseX <= pos.x + slot.width &&
			mouseY >= pos.y &&
			mouseY <= pos.y + slot.height
		);
	}

	update(mouse: MouseInput): void {
		super.update(mouse);
	}

	private onCloseCallback: (() => void) | null = null;
	private lastCanvasWidth = 0;
	private lastCanvasHeight = 0;

	setOnClose(callback: () => void): void {
		this.onCloseCallback = callback;
	}
}
