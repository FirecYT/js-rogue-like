import Entity from '../entities/Entity';
import { Player } from '../Player';

export class EntityManager {
  private entities: Entity[] = [];
  private player: Player | null = null;

  public addEntity(entity: Entity): void {
    this.entities.push(entity);
  }

  public removeEntity(entity: Entity): boolean {
    const index = this.entities.indexOf(entity);
    if (index !== -1) {
      this.entities.splice(index, 1);
      return true;
    }
    return false;
  }

  public getEntities(): Entity[] {
    return [...this.entities]; // Return a copy to prevent external modification
  }

  public getPlayer(): Player | null {
    return this.player;
  }

  public setPlayer(player: Player): void {
    this.player = player;
  }

  public update(): void {
    // Update all entities
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      
      if (entity.isDead()) {
        if (entity !== this.player) { // Don't remove the player
          this.entities.splice(i, 1);
        }
      } else {
        // Update entity (this would depend on the specific entity type)
        // For now, we'll just call a generic update method if it exists
        if (typeof (entity as any).update === 'function') {
          (entity as any).update();
        }
      }
    }
  }

  public render(context: CanvasRenderingContext2D): void {
    // Render all entities
    for (const entity of this.entities) {
      if (!entity.isDead()) {
        entity.render(context);
      }
    }
  }

  public clearEntities(): void {
    // Keep the player if it exists, remove all other entities
    if (this.player) {
      this.entities = [this.player];
    } else {
      this.entities = [];
    }
  }

  public findEntitiesInRange(x: number, y: number, range: number): Entity[] {
    const result: Entity[] = [];
    const rangeSquared = range * range;
    
    for (const entity of this.entities) {
      if (entity !== this.player) { // Exclude player from range checks
        const dx = entity.x - x;
        const dy = entity.y - y;
        const distanceSquared = dx * dx + dy * dy;
        
        if (distanceSquared <= rangeSquared) {
          result.push(entity);
        }
      }
    }
    
    return result;
  }
}