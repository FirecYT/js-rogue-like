import Engine from '../components/Engine';
import Player from '../Player';
import { Weapon } from '../items/Weapon';
import { Modifier } from '../items/Modifier';
import { Chip } from '../items/Chip';
import { Item } from '../items/Item';
import { PickupItem } from '../entities/PickupItem';
import { pir } from '../utils';

interface UIButton {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    color: string;
    hoverColor: string;
    isHovered?: boolean;
}

export class PickupUISystem {
    private isActive = false;
    private pickupItem: PickupItem | null = null;
    private currentState: 'weapon' | 'modifier' | 'chip' | null = null;
    private selectedSlotIndex: number | null = null;
    private mouseHoverWeapon = false;
    
    private buttons: UIButton[] = [];
    
    constructor(
        private engine: Engine,
        private player: Player,
        private mouse: { x: number; y: number; pressed: boolean },
        private canvasScale: number = 1
    ) {}

    activate(pickupItem: PickupItem) {
        this.pickupItem = pickupItem;
        this.currentState = pickupItem.item.type;
        this.isActive = true;
        this.selectedSlotIndex = null;
        this.mouseHoverWeapon = false;
        this.updateButtons();
    }

    deactivate() {
        this.isActive = false;
        this.currentState = null;
        this.pickupItem = null;
        this.selectedSlotIndex = null;
        this.mouseHoverWeapon = false;
        this.buttons = [];
    }

    update() {
        if (!this.isActive || !this.pickupItem) return;

        // Update button states based on mouse position
        this.updateButtonStates();

        // Handle button clicks
        if (this.mouse.pressed) {
            this.handleButtonClicks();
        }

        // Handle special cases
        if (this.currentState === 'weapon') {
            this.handleWeaponUI();
        } else if (this.currentState === 'modifier' || this.currentState === 'chip') {
            this.handleModifierOrChipUI();
        }
    }

    private updateButtonStates() {
        if (!this.isActive || !this.pickupItem) return;

        for (const button of this.buttons) {
            const scaledRect = {
                x: button.x * this.canvasScale,
                y: button.y * this.canvasScale,
                width: button.width * this.canvasScale,
                height: button.height * this.canvasScale
            };

            if (pir(this.mouse, scaledRect)) {
                button.isHovered = true;
            } else {
                button.isHovered = false;
            }
        }

        // Check if mouse is over current weapon area for weapon UI
        if (this.currentState === 'weapon') {
            const weaponArea = {
                x: 100 * this.canvasScale,
                y: 150 * this.canvasScale,
                width: 150 * this.canvasScale,
                height: 100 * this.canvasScale
            };
            
            this.mouseHoverWeapon = pir(this.mouse, weaponArea);
        }
    }

    private handleButtonClicks() {
        if (!this.isActive || !this.pickupItem) return;

        for (const button of this.buttons) {
            const scaledRect = {
                x: button.x * this.canvasScale,
                y: button.y * this.canvasScale,
                width: button.width * this.canvasScale,
                height: button.height * this.canvasScale
            };

            if (pir(this.mouse, scaledRect)) {
                if (button.label === 'Replace') {
                    this.handleReplace();
                    this.deactivate();
                    return;
                } else if (button.label === 'Keep') {
                    this.deactivate();
                    return;
                }
            }
        }

        // Handle clicking on current weapon area for weapon UI
        if (this.currentState === 'weapon') {
            const weaponArea = {
                x: 100 * this.canvasScale,
                y: 150 * this.canvasScale,
                width: 150 * this.canvasScale,
                height: 100 * this.canvasScale
            };
            
            if (pir(this.mouse, weaponArea)) {
                this.handleReplace();
                this.deactivate();
                return;
            }
        }

        // Handle clicking on modifier/chip slots based on unified approach
        if (this.currentState === 'modifier' || this.currentState === 'chip') {
            this.handleSlotClicks();
        }
    }

    private handleSlotClicks() {
        if (!this.isActive || !this.pickupItem) return;

        const slotWidth = 80;
        const slotHeight = 80;
        const slotSpacing = 90;
        const startX = 100;
        const startY = 150;

        // Calculate number of slots needed based on current weapon
        let numSlots = 0;
        if (this.player.inventory.weapon) {
            numSlots = this.player.inventory.weapon.modifiersSlots;
        }

        // For chips, we use a fixed number of slots
        if (this.currentState === 'chip') {
            numSlots = 5; // Fixed number of chip slots
        }

        // Only allow clicking on slots if there are multiple slots
        if (numSlots > 1) {
            for (let i = 0; i < numSlots; i++) {
                const slotX = startX + i * slotSpacing;
                const slotY = startY;
                
                const scaledRect = {
                    x: slotX * this.canvasScale,
                    y: slotY * this.canvasScale,
                    width: slotWidth * this.canvasScale,
                    height: slotHeight * this.canvasScale
                };

                if (pir(this.mouse, scaledRect)) {
                    this.handleModifierOrChipPlacement(i);
                    this.deactivate();
                    return;
                }
            }
        } else if (numSlots === 1 && this.currentState !== 'weapon') {
            // If there's only one slot and it's not a weapon, clicking anywhere on the slot should trigger replacement
            const slotX = startX;
            const slotY = startY;
            
            const scaledRect = {
                x: slotX * this.canvasScale,
                y: slotY * this.canvasScale,
                width: slotWidth * this.canvasScale,
                height: slotHeight * this.canvasScale
            };

            if (pir(this.mouse, scaledRect)) {
                // For single slot, place the item in slot 0
                this.handleModifierOrChipPlacement(0);
                this.deactivate();
                return;
            }
        }
    }

    private handleWeaponUI() {
        if (!this.isActive || !this.pickupItem) return;
    }

    private handleModifierOrChipUI() {
        if (!this.isActive || !this.pickupItem) return;
    }

    private handleReplace() {
        if (!this.pickupItem) return;

        switch (this.pickupItem.item.type) {
            case 'weapon':
                this.replaceWeapon(this.pickupItem.item as Weapon);
                break;
            case 'modifier':
                // For modifiers, if there's only one slot, place in slot 0
                if (this.player.inventory.weapon) {
                    const numSlots = this.player.inventory.weapon.modifiersSlots;
                    if (numSlots === 1) {
                        this.handleModifierOrChipPlacement(0);
                    }
                }
                break;
            case 'chip':
                // For chips, place in the first available slot
                // Find an empty chip slot
                const emptySlotIndex = this.player.inventory.chips.findIndex(c => c === null);
                if (emptySlotIndex !== -1) {
                    const chip = this.pickupItem.item as Chip;
                    this.player.inventory.chips[emptySlotIndex] = chip;
                    chip.onEquip?.(this.player);
                } else {
                    // If no empty slot, try to find and replace first slot
                    const chip = this.pickupItem.item as Chip;
                    this.player.inventory.chips[0] = chip;
                    chip.onEquip?.(this.player);
                }
                break;
        }
    }

    private handleModifierOrChipPlacement(slotIndex: number) {
        if (!this.pickupItem) return;

        if (this.pickupItem.item.type === 'modifier') {
            const modifier = this.pickupItem.item as Modifier;
            
            // If slot is occupied, remove the old modifier
            if (this.player.inventory.modifiers[slotIndex]) {
                // Could potentially drop the old modifier, but for now just replace
            }
            
            // Place the new modifier in the slot
            this.player.inventory.modifiers[slotIndex] = modifier;
        } else if (this.pickupItem.item.type === 'chip') {
            const chip = this.pickupItem.item as Chip;
            
            // Place the chip in the specified slot, replacing any existing chip
            this.player.inventory.chips[slotIndex] = chip;
            chip.onEquip?.(this.player);
        }
    }

    private replaceWeapon(newWeapon: Weapon) {
        // Store the old weapon to potentially drop it later
        const oldWeapon = this.player.inventory.weapon;
        
        // Set the new weapon
        this.player.inventory.setWeapon(newWeapon);
    }

    private updateButtons() {
        this.buttons = [
            {
                x: 200,
                y: 400,
                width: 100,
                height: 40,
                label: 'Replace',
                color: '#4a4',
                hoverColor: '#5b5'
            },
            {
                x: 350,
                y: 400,
                width: 100,
                height: 40,
                label: 'Keep',
                color: '#aaa',
                hoverColor: '#bbb'
            }
        ];
    }

    render() {
        if (!this.isActive || !this.pickupItem) return;

        // Draw semi-transparent overlay
        this.engine.context.fillStyle = '#0008';
        this.engine.context.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);

        // Render unified UI based on item type
        this.renderUnifiedUI();

        // Render buttons
        for (const button of this.buttons) {
            const isHovered = pir(this.mouse, {
                x: button.x * this.canvasScale,
                y: button.y * this.canvasScale,
                width: button.width * this.canvasScale,
                height: button.height * this.canvasScale
            });

            this.engine.context.fillStyle = isHovered ? button.hoverColor : button.color;
            this.engine.context.fillRect(
                button.x, button.y, 
                button.width, button.height
            );

            // Draw button border
            this.engine.context.strokeStyle = button.label === 'Replace' ? '#0f0' : '#888';
            this.engine.context.lineWidth = 2;
            this.engine.context.strokeRect(
                button.x, button.y, 
                button.width, button.height
            );

            // Draw button text
            this.engine.context.fillStyle = '#000';
            this.engine.context.font = '16px Arial';
            this.engine.context.textAlign = 'center';
            this.engine.context.textBaseline = 'middle';
            this.engine.context.fillText(
                button.label, 
                button.x + button.width / 2, 
                button.y + button.height / 2
            );
        }
    }

    private renderUnifiedUI() {
        if (this.currentState === 'weapon') {
            this.renderWeaponUI();
        } else if (this.currentState === 'modifier' || this.currentState === 'chip') {
            this.renderModifierOrChipUI();
        }
    }

    private renderWeaponUI() {
        // Draw current weapon area (left side)
        this.engine.context.fillStyle = this.mouseHoverWeapon ? '#4a4' : '#aaa';
        this.engine.context.fillRect(100, 150, 150, 100);
        
        this.engine.context.strokeStyle = '#fff';
        this.engine.context.lineWidth = 2;
        this.engine.context.strokeRect(100, 150, 150, 100);
        
        this.engine.context.fillStyle = '#000';
        this.engine.context.font = '14px Arial';
        this.engine.context.textAlign = 'center';
        this.engine.context.textBaseline = 'middle';
        
        if (this.player.inventory.weapon) {
            this.engine.context.fillText(
                this.player.inventory.weapon.name, 
                175, 180
            );
            this.engine.context.fillText(
                `Damage: ${this.player.inventory.weapon.damage}`, 
                175, 200
            );
            this.engine.context.fillText(
                `Fire Rate: ${this.player.inventory.weapon.fireRate}`, 
                175, 220
            );
        } else {
            this.engine.context.fillText('No weapon', 175, 200);
        }

        // Draw pickup weapon area (right side)
        this.engine.context.fillStyle = '#aaa';
        this.engine.context.fillRect(300, 150, 150, 100);
        
        this.engine.context.strokeStyle = '#fff';
        this.engine.context.lineWidth = 2;
        this.engine.context.strokeRect(300, 150, 150, 100);
        
        const pickupWeapon = this.pickupItem!.item as Weapon;
        this.engine.context.fillStyle = '#000';
        this.engine.context.fillText(
            pickupWeapon.name, 
            375, 180
        );
        this.engine.context.fillText(
            `Damage: ${pickupWeapon.damage}`, 
            375, 200
        );
        this.engine.context.fillText(
            `Fire Rate: ${pickupWeapon.fireRate}`, 
            375, 220
        );
        
        // Draw instructions
        this.engine.context.fillStyle = '#fff';
        this.engine.context.font = '16px Arial';
        this.engine.context.textAlign = 'center';
        this.engine.context.fillText('Click on current weapon or "Replace" to equip new weapon', 250, 120);
        this.engine.context.fillText('"Keep" to leave current weapon unchanged', 250, 450);
    }

    private renderModifierOrChipUI() {
        const slotWidth = 80;
        const slotHeight = 80;
        const slotSpacing = 90;
        const startX = 100;
        const startY = 150;

        // Calculate number of slots based on item type and current weapon
        let numSlots = 0;
        if (this.currentState === 'modifier' && this.player.inventory.weapon) {
            numSlots = this.player.inventory.weapon.modifiersSlots;
        } else if (this.currentState === 'chip') {
            numSlots = 5; // Fixed number of chip slots
        }

        // Determine if we're showing the Replace button or individual slots
        const showReplaceButton = numSlots === 1;

        if (showReplaceButton) {
            // Draw single slot that acts as a button (with possibility to click to replace)
            const slotX = startX;
            
            // Draw slot background
            this.engine.context.fillStyle = '#aaa';
            this.engine.context.fillRect(slotX, startY, slotWidth, slotHeight);
            
            // Draw slot border
            this.engine.context.strokeStyle = '#fff';
            this.engine.context.lineWidth = 2;
            this.engine.context.strokeRect(slotX, startY, slotWidth, slotHeight);
            
            // Draw slot info
            this.engine.context.fillStyle = '#000';
            this.engine.context.font = '14px Arial';
            this.engine.context.textAlign = 'center';
            this.engine.context.textBaseline = 'middle';
            this.engine.context.fillText(
                this.currentState === 'modifier' ? 'Modifier Slot' : 'Chip Slot', 
                slotX + slotWidth / 2, 
                startY + slotHeight / 2 - 10
            );
            
            // If there's an existing item in this slot, show it
            if (this.currentState === 'modifier' && this.player.inventory.modifiers[0]) {
                this.engine.context.fillText(
                    this.player.inventory.modifiers[0].name, 
                    slotX + slotWidth / 2, 
                    startY + slotHeight / 2 + 10
                );
            } else if (this.currentState === 'chip' && this.player.inventory.chips[0]) {
                this.engine.context.fillText(
                    this.player.inventory.chips[0].name, 
                    slotX + slotWidth / 2, 
                    startY + slotHeight / 2 + 10
                );
            }
        } else {
            // Draw multiple slots
            for (let i = 0; i < numSlots; i++) {
                const slotX = startX + i * slotSpacing;
                
                // Draw slot background
                this.engine.context.fillStyle = '#aaa';
                this.engine.context.fillRect(slotX, startY, slotWidth, slotHeight);
                
                // Draw slot border
                this.engine.context.strokeStyle = '#fff';
                this.engine.context.lineWidth = 2;
                this.engine.context.strokeRect(slotX, startY, slotWidth, slotHeight);
                
                // Draw slot number
                this.engine.context.fillStyle = '#000';
                this.engine.context.font = '14px Arial';
                this.engine.context.textAlign = 'center';
                this.engine.context.textBaseline = 'middle';
                this.engine.context.fillText(
                    `Slot ${i + 1}`, 
                    slotX + slotWidth / 2, 
                    startY + slotHeight / 2 - 10
                );
                
                // If there's an item in this slot, display it
                if (this.currentState === 'modifier' && this.player.inventory.modifiers[i]) {
                    this.engine.context.fillText(
                        this.player.inventory.modifiers[i].name, 
                        slotX + slotWidth / 2, 
                        startY + slotHeight / 2 + 10
                    );
                } else if (this.currentState === 'chip' && this.player.inventory.chips[i]) {
                    this.engine.context.fillText(
                        this.player.inventory.chips[i].name, 
                        slotX + slotWidth / 2, 
                        startY + slotHeight / 2 + 10
                    );
                }
            }
        }

        // Draw pickup item area (right side)
        this.engine.context.fillStyle = '#aaa';
        this.engine.context.fillRect(500, 150, 150, 100);
        
        this.engine.context.strokeStyle = '#fff';
        this.engine.context.lineWidth = 2;
        this.engine.context.strokeRect(500, 150, 150, 100);
        
        const pickupItem = this.pickupItem!.item;
        this.engine.context.fillStyle = '#000';
        this.engine.context.font = '14px Arial';
        this.engine.context.textAlign = 'center';
        this.engine.context.textBaseline = 'middle';
        this.engine.context.fillText(
            pickupItem.name, 
            575, 180
        );
        this.engine.context.fillText(
            this.currentState.charAt(0).toUpperCase() + this.currentState.slice(1), 
            575, 200
        );
        
        // Draw instructions
        this.engine.context.fillStyle = '#fff';
        this.engine.context.font = '16px Arial';
        this.engine.context.textAlign = 'center';
        
        if (showReplaceButton) {
            this.engine.context.fillText(`Click on the slot or \"Replace\" to equip the ${this.currentState}`, 300, 120);
        } else {
            this.engine.context.fillText(`Click on a slot to place the ${this.currentState}`, 300, 120);
        }
        this.engine.context.fillText('Click \"Keep\" to ignore', 300, 450);
    }

    isActive(): boolean {
        return this.isActive;
    }
}