import { Window } from '../Window';
import { PickupItem } from '../../entities/PickupItem';
import Entity from '../../entities/Entity';
import { Button } from '../components/Button';
import { Label } from '../components/Label';
import { ItemSlot } from '../components/ItemSlot';
import { isChip } from '../../items/Chip';
import { isWeapon } from '../../items/Weapon';
import { isModifier } from '../../items/Modifier';
import { Item } from '../../items/Item';
import { VerticalLayout } from '../containers/VerticalLayout';
import { HorizontalLayout } from '../containers/HorizontalLayout';

/**
 * Окно выбора слота для подбираемого предмета
 */
export class PickupWindow extends Window {
	private pickupItem: PickupItem;
	private entity: Entity;
	private entities: Entity[];
	private onConfirmCallback: ((slotIndex: number) => void) | null = null;
	private onCancelCallback: (() => void) | null = null;
	private slots: ItemSlot[] = [];

	/**
	 * Создать окно подбора предмета
	 * @param pickupItem Подбираемый предмет
	 * @param entity Управляемая сущность
	 * @param entities Массив всех сущностей
	 * @param canvasWidth Ширина канваса
	 * @param canvasHeight Высота канваса
	 */
	constructor(
		pickupItem: PickupItem,
		entity: Entity,
		entities: Entity[],
		canvasWidth: number,
		canvasHeight: number
	) {
		super();

		this.pickupItem = pickupItem;
		this.entity = entity;
		this.entities = entities;

		this.x = (canvasWidth - 400) / 2;
		this.y = (canvasHeight - 300) / 2;
		this.width = 400;
		this.height = 300;
		this.title = 'Выбор слота';
		this.causesPause = true;

		this.createUI();
		this.autoSize();
		this.centerWindow(canvasWidth, canvasHeight);
	}

	/**
	 * Создаёт элементы окна: метка, слоты текущих предметов, слот подбираемого предмета, кнопка «Пропустить».
	 */
	private createUI(): void {
		this.root.children = [];

		const layout = new VerticalLayout();
		layout.spacing = 10;
		layout.padding = {top: 40, right: 20, bottom: 20, left: 20};

		const instructionLabel = new Label(`Выберите слот для размещения ${this.pickupItem.item.type}`);
		layout.addChild(instructionLabel);

		const choiceLayout = new VerticalLayout();

		const currentLabel = new Label(`Текущие слоты:`);
		choiceLayout.addChild(currentLabel);

		const currentSlotsLayout = new HorizontalLayout();
		let numSlots = 0;
		if (isWeapon(this.pickupItem.item)) {
			numSlots = 1;
		} else if (isModifier(this.pickupItem.item) && this.entity.inventory.weapon) {
			numSlots = this.entity.inventory.weapon.modifiersSlots || 0;
		} else if (isChip(this.pickupItem.item)) {
			numSlots = 5;
		}

		this.slots = [];
		for (let i = 0; i < numSlots; i++) {
			let item: Item | null = null;

			if (isWeapon(this.pickupItem.item)) {
				item = this.entity.inventory.weapon;
			} else if (isModifier(this.pickupItem.item)) {
				item = this.entity.inventory.modifiers[i];
			} else if (isChip(this.pickupItem.item)) {
				item = this.entity.inventory.chips[i];
			}

			const slot = new ItemSlot(60, 60, item);

			currentSlotsLayout.addChild(slot);

			this.slots.push(slot);
		}

		choiceLayout.addChild(currentSlotsLayout);

		const pickupLabel = new Label(`Подбираемый предмет:`);
		choiceLayout.addChild(pickupLabel);

		const pickupSlot = new ItemSlot(60, 60, this.pickupItem.item);

		choiceLayout.addChild(pickupSlot);

		layout.addChild(choiceLayout);

		const skipButton = new Button('Пропустить', layout.width - layout.padding.left - layout.padding.right, 40);
		skipButton.setOnClick(() => {
			if (this.onCancelCallback) {
				this.onCancelCallback();
			}
		});
		layout.addChild(skipButton);

		this.root.addChild(layout);
	}

	/**
	 * Установить обработчик подтверждения выбора слота
	 * @param callback Функция, вызываемая при подтверждении (получает индекс слота)
	 */
	setOnConfirm(callback: (slotIndex: number) => void): void {
		this.onConfirmCallback = callback;
	}

	/**
	 * Установить обработчик отмены
	 * @param callback Функция, вызываемая при отмене
	 */
	setOnCancel(callback: () => void): void {
		this.onCancelCallback = callback;
	}

	/**
	 * Обработка клика внутри окна
	 * @param mouseX Координата клика по оси X
	 * @param mouseY Координата клика по оси Y
	 */
	handleClick(mouseX: number, mouseY: number): void {
		for (let i = 0; i < this.slots.length; i++) {
			const slot = this.slots[i];
			const { x: slotX, y: slotY } = slot.getGlobalPosition();

			if (
				mouseX >= slotX &&
				mouseX <= slotX + slot.width &&
				mouseY >= slotY &&
				mouseY <= slotY + slot.height
			) {
				if (this.onConfirmCallback) {
					this.onConfirmCallback(i);
				}
				break;
			}
		}
	}
}
