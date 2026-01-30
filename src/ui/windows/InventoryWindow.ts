import { Window } from '../Window';
import { Entity } from '../../entities/Entity';
import { Button } from '../components/Button';
import { Label } from '../components/Label';
import { ItemSlot } from '../components/ItemSlot';
import { VerticalLayout } from '../containers/VerticalLayout';

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
    
    // Set window properties
    this.x = (canvasWidth - 500) / 2;
    this.y = (canvasHeight - 400) / 2;
    this.width = 500;
    this.height = 400;
    this.title = 'Инвентарь';
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
    
    // Create vertical layout for inventory sections
    const layout = new VerticalLayout();
    layout.x = 20;
    layout.y = 40;
    layout.width = this.width - 40;
    layout.spacing = 20;
    
    // Add weapon section
    if (this.entity.inventory.weapon) {
      const weaponLabel = new Label('Оружие:');
      layout.addChild(weaponLabel);
      
      const weaponSlot = new ItemSlot(0, 80, 80);
      weaponSlot.setItem(this.entity.inventory.weapon);
      layout.addChild(weaponSlot);
    }
    
    // Add modifiers section
    if (this.entity.inventory.modifiers && this.entity.inventory.modifiers.length > 0) {
      const modifiersLabel = new Label('Модификаторы:');
      layout.addChild(modifiersLabel);
      
      for (let i = 0; i < this.entity.inventory.modifiers.length; i++) {
        const modifierSlot = new ItemSlot(i, 60, 60);
        modifierSlot.setItem(this.entity.inventory.modifiers[i]);
        layout.addChild(modifierSlot);
      }
    }
    
    // Add chips section
    if (this.entity.inventory.chips && this.entity.inventory.chips.length > 0) {
      const chipsLabel = new Label('Чипы:');
      layout.addChild(chipsLabel);
      
      for (let i = 0; i < this.entity.inventory.chips.length; i++) {
        const chipSlot = new ItemSlot(i, 60, 60);
        chipSlot.setItem(this.entity.inventory.chips[i]);
        layout.addChild(chipSlot);
      }
    }
    
    this.root.addChild(layout);
    
    // Add close button
    const closeButton = new Button('Закрыть', 100, 40);
    closeButton.x = (this.width - 100) / 2;
    closeButton.y = this.height - 60;
    closeButton.setOnClick(() => {
      if (this.onCloseCallback) {
        this.onCloseCallback();
      }
    });
    this.root.addChild(closeButton);
  }

  /**
   * Установить обработчик закрытия окна
   * @param callback Функция, вызываемая при закрытии
   */
  setOnClose(callback: () => void): void {
    this.onCloseCallback = callback;
  }
}