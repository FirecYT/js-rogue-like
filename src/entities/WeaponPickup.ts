import { PickupItem } from './PickupItem';
import Entity from './Entity';
import { Weapon } from '../items/Weapon';

export class WeaponPickup extends PickupItem {
    constructor(
        x: number,
        y: number,
        weapon: Weapon
    ) {
        super(x, y, weapon);
    }

    render(ctx: CanvasRenderingContext2D): void {
        // Render weapon pickup with distinctive color
        ctx.fillStyle = '#f00'; // Red for weapons
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw weapon indicator
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('W', this.x, this.y);
    }
    
    onPickup(entity: Entity): boolean {
        // This will trigger the weapon selection UI
        return true; // Return true to indicate pickup was handled
    }
}