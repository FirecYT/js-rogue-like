import { Window } from '../Window';
import { PickupItem } from '../../entities/PickupItem';
import { Entity } from '../../entities/Entity';
import { Button } from '../components/Button';
import { Label } from '../components/Label';
import { AbsoluteContainer } from '../containers/AbsoluteContainer';
import { ItemSlot } from '../components/ItemSlot';

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
    
    // Set window properties
    this.x = (canvasWidth - 400) / 2;
    this.y = (canvasHeight - 300) / 2;
    this.width = 400;
    this.height = 300;
    this.title = 'Выбор слота';
    this.causesPause = true;
    
    // Create UI elements
    this.createUI();
  }

  /**
   * Create the UI elements for the window
   */
  private createUI(): void {
    // Clear existing children
    this.root.children = [];
    
    // Add instruction label
    const instructionLabel = new Label(`Выберите слот для размещения ${this.pickupItem.item.type}`);
    instructionLabel.x = 20;
    instructionLabel.y = 40;
    this.root.addChild(instructionLabel);
    
    // Determine number of slots based on item type
    let numSlots = 0;
    if (this.pickupItem.item.type === 'weapon') {
      numSlots = 1;
    } else if (this.pickupItem.item.type === 'modifier' && this.entity.inventory.weapon) {
      numSlots = this.entity.inventory.weapon.modifiersSlots || 0;
    } else if (this.pickupItem.item.type === 'chip') {
      numSlots = 5;
    }
    
    // Create item slots
    this.slots = [];
    for (let i = 0; i < numSlots; i++) {
      const slot = new ItemSlot(i, 60, 60);
      
      // Set slot position
      slot.x = 40;
      slot.y = 80 + i * 70;
      
      // If we're dealing with modifiers or chips, show the current item in the slot
      if (this.pickupItem.item.type === 'modifier') {
        slot.setItem(this.entity.inventory.modifiers[i] || null);
      } else if (this.pickupItem.item.type === 'chip') {
        slot.setItem(this.entity.inventory.chips[i] || null);
      }
      
      this.root.addChild(slot);
      this.slots.push(slot);
      
      // Add slot label
      const slotLabel = new Label(`Слот ${i + 1}`);
      slotLabel.x = 120;
      slotLabel.y = 80 + i * 70 + 15;
      this.root.addChild(slotLabel);
    }
    
    // Add the pickup item preview
    const pickupLabel = new Label(`Подбираемый предмет: ${this.pickupItem.item.name}`);
    pickupLabel.x = 250;
    pickupLabel.y = 80;
    this.root.addChild(pickupLabel);
    
    // Add skip button
    const skipButton = new Button('Пропустить', 100, 40);
    skipButton.x = (this.width - 100) / 2;
    skipButton.y = this.height - 60;
    skipButton.setOnClick(() => {
      if (this.onCancelCallback) {
        this.onCancelCallback();
      }
    });
    this.root.addChild(skipButton);
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
    // Check if any of the slots were clicked
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      
      // Check if click is inside the slot
      if (
        mouseX >= slot.x && 
        mouseX <= slot.x + slot.width &&
        mouseY >= slot.y && 
        mouseY <= slot.y + slot.height
      ) {
        // Confirm selection
        if (this.onConfirmCallback) {
          this.onConfirmCallback(i);
        }
        break;
      }
    }
  }
}