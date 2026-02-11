import { Effect } from '../effects/Effect';
import Entity from '../entities/Entity';
import { WorldManager } from '../world/WorldManager';

export class EffectSystem {
    private effects: Effect[] = [];
    private worldManager: WorldManager | null = null;

    constructor(worldManager?: WorldManager) {
        this.worldManager = worldManager || null;
    }

    setWorldManager(worldManager: WorldManager): void {
        this.worldManager = worldManager;
    }

    addEffect(effect: Effect): void {
        this.effects.push(effect);
    }

    update(entities: Entity[]): void {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            this.effects[i].update(entities, this.worldManager);
            if (this.effects[i].isDead()) {
                this.effects.splice(i, 1);
            }
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        for (const effect of this.effects) {
            effect.render(ctx);
        }
    }

    getEffects(): Effect[] {
        return this.effects;
    }
}
