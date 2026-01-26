import Engine from '../components/Engine';
import { Player } from '../Player';
import { EntityManager } from '../managers/EntityManager';
import { SystemManager } from '../managers/SystemManager';
import { WorldManager } from '../managers/WorldManager';
import { PortalTrigger } from '../entities/PortalTrigger';

export abstract class World {
  protected worldManager: WorldManager;
  protected entityManager: EntityManager;
  protected systemManager: SystemManager;

  constructor(worldManager?: WorldManager, entityManager?: EntityManager, systemManager?: SystemManager) {
    if (worldManager) this.worldManager = worldManager;
    if (entityManager) this.entityManager = entityManager;
    if (systemManager) this.systemManager = systemManager;
  }

  public abstract load(player: Player, entityManager: EntityManager, systemManager: SystemManager): void;
  public abstract unload(): void;
  public abstract update(player: Player, entityManager: EntityManager, systemManager: SystemManager): void;
  public abstract render(engine: Engine, player: Player, entityManager: EntityManager): void;
  public abstract getPlayerStartX(): number;
  public abstract getPlayerStartY(): number;
  
  protected checkPortalTransitions(player: Player): string | null {
    const entities = this.entityManager.getEntities();
    
    for (const entity of entities) {
      if (entity instanceof PortalTrigger) {
        if (entity.checkCollisionWithPlayer(player.x, player.y)) {
          return entity.getTargetWorldId();
        }
      }
    }
    
    return null;
  }
}