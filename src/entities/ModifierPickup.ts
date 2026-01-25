import { PickupItem } from './PickupItem';
import Entity from './Entity';
import { Modifier } from '../items/Modifier';

export class ModifierPickup extends PickupItem {
    constructor(
        x: number,
        y: number,
        modifier: Modifier
    ) {
        super(x, y, modifier);
    }

    render(ctx: CanvasRenderingContext2D): void {
        // Render modifier pickup with distinctive color
        ctx.fillStyle = '#0f0'; // Green for modifiers
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw modifier indicator
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('M', this.x, this.y);
    }
    
    onPickup(entity: Entity): boolean {
        // This will trigger the modifier selection UI
        return true; // Return true to indicate pickup was handled
    }
}