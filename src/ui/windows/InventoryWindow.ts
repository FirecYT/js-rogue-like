import { Window } from '../Window';
import Entity from '../../entities/Entity';
import { Button } from '../components/Button';
import { Label } from '../components/Label';
import { ItemSlot } from '../components/ItemSlot';
import { VerticalLayout } from '../containers/VerticalLayout';
import { HorizontalLayout } from '../containers/HorizontalLayout';

/**
 * Окно инвентаря
 */
export class InventoryWindow extends Window {
	private entity: Entity;
	private onCloseCallback: (() => void) | null = null;

	/**
	 * Создать окно инвентаря
	 * @param entity Управляемая сущность
	 * @param canvasWidth Ширина канваса
	 * @param canvasHeight Высота канваса
	 */
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

		this.x = (canvasWidth - this.width) / 2;
		this.y = (canvasHeight - this.height) / 2;

		this.root.x = this.x;
		this.root.y = this.y;
	}

	/**
	 * Create the UI elements for the window
	 */
	private createUI(): void {
		this.root.children = [];

		const layout = new VerticalLayout();
		layout.spacing = 10;
		layout.padding = {top: 40, right: 20, bottom: 20, left: 20};

		const itemsLayout = new HorizontalLayout();

		const weaponLayout = new VerticalLayout();

		const weaponLabel = new Label('Оружие:');
		weaponLayout.addChild(weaponLabel);

		const weaponSlot = new ItemSlot(80, 80, this.entity.inventory.weapon);
		weaponLayout.addChild(weaponSlot);

		itemsLayout.addChild(weaponLayout);

		const modifiersLayout = new VerticalLayout();

		const modifiersLabel = new Label('Модификаторы:');
		modifiersLayout.addChild(modifiersLabel);

		for (const modifier of this.entity.inventory.modifiers) {
			const modifierSlot = new ItemSlot(60, 60, modifier);
			modifiersLayout.addChild(modifierSlot);
		}

		itemsLayout.addChild(modifiersLayout);

		const chipsLayout = new VerticalLayout();

		const chipsLabel = new Label('Чипы:');
		chipsLayout.addChild(chipsLabel);

		for (const chip of this.entity.inventory.chips) {
			const chipSlot = new ItemSlot(60, 60, chip);
			chipsLayout.addChild(chipSlot);
		}

		itemsLayout.addChild(chipsLayout);

		layout.addChild(itemsLayout);

		const closeButton = new Button('Закрыть', layout.width - layout.padding.left - layout.padding.right, 40);
		closeButton.setOnClick(() => {
			if (this.onCloseCallback) {
				this.onCloseCallback();
			}
		});

		layout.addChild(closeButton);

		this.root.addChild(layout);
	}

	/**
	 * Установить обработчик закрытия окна
	 * @param callback Функция, вызываемая при закрытии
	 */
	setOnClose(callback: () => void): void {
		this.onCloseCallback = callback;
	}
}
