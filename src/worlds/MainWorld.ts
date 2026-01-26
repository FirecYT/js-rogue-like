import Engine from '../components/Engine';
import { Player } from '../Player';
import { EntityManager } from '../managers/EntityManager';
import { SystemManager } from '../managers/SystemManager';
import { World } from './World';
import { WorldManager } from '../managers/WorldManager';
import { CHUNK_CONFIG, TileType } from '../world/Types';
import { PortalTrigger } from '../entities/PortalTrigger';
import { Game } from '../core/Game';

export class MainWorld extends World {
  private playerStartX: number;
  private playerStartY: number;

  constructor() {
    super();
    this.playerStartX = CHUNK_CONFIG.FULL_SIZE / 2 + CHUNK_CONFIG.HALF_SIZE;
    this.playerStartY = CHUNK_CONFIG.FULL_SIZE / 2 + CHUNK_CONFIG.HALF_SIZE;
  }

  public load(player: Player, entityManager: EntityManager, systemManager: SystemManager): void {
    this.entityManager = entityManager;
    this.systemManager = systemManager;
    
    // Reset player position
    player.setPosition(this.playerStartX, this.playerStartY);
    
    // Add portal to test world
    entityManager.addEntity(new PortalTrigger(
      500, 500,  // Position of portal in main world
      'test',     // Target world ID
      'To Test World'  // Description
    ));
  }

  public unload(): void {
    // Cleanup any resources specific to this world
    // The entity manager and system manager will handle entity cleanup
  }

  public update(player: Player, entityManager: EntityManager, systemManager: SystemManager): void {
    // Check for portal transitions
    const targetWorld = this.checkPortalTransitions(player);
    if (targetWorld) {
      // We need to get access to the Game instance to switch worlds
      // This would be passed down from the Game class
      console.log(`Transitioning to world: ${targetWorld}`);
      // In the real implementation, we'd call something like game.setWorld(targetWorld)
    }
  }

  public render(engine: Engine, player: Player, entityManager: EntityManager): void {
    // The rendering is handled by the WorldManager and individual systems
    // This method can be used for world-specific visual effects or overlays
  }

  public getPlayerStartX(): number {
    return this.playerStartX;
  }

  public getPlayerStartY(): number {
    return this.playerStartY;
  }
}