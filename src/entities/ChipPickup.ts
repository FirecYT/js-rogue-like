import { PickupItem } from './PickupItem';
import Entity from './Entity';
import { Chip } from '../items/Chip';

export class ChipPickup extends PickupItem {
    constructor(
        x: number,
        y: number,
        chip: Chip
    ) {
        super(x, y, chip);
    }

    render(ctx: CanvasRenderingContext2D): void {
        // Render chip pickup with distinctive color
        ctx.fillStyle = '#00f'; // Blue for chips
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw chip indicator
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('C', this.x, this.y);
    }
    
    onPickup(entity: Entity): boolean {
        // This will trigger the chip selection UI
        return true; // Return true to indicate pickup was handled
    }
}