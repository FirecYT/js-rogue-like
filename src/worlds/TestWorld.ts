import Engine from '../components/Engine';
import { Player } from '../Player';
import { EntityManager } from '../managers/EntityManager';
import { SystemManager } from '../managers/SystemManager';
import { World } from './World';
import { WorldManager } from '../managers/WorldManager';
import { CHUNK_CONFIG } from '../world/Types';
import { PortalTrigger } from '../entities/PortalTrigger';
import { BasicPistol } from '../items/weapons/BasicPistol';
import { Flamethrower } from '../items/weapons/Flamethrower';
import { LaserRifle } from '../items/weapons/LaserRifle';
import { DamageBoostModifier } from '../items/modifiers/DamageBoostModifier';
import { PierceModifier } from '../items/modifiers/PierceModifier';
import { SinusoidalModifier } from '../items/modifiers/SinusoidalModifier';
import { ExplosiveModifier } from '../items/modifiers/ExplosiveModifier';
import { TeleportChip } from '../items/chips/TeleportChip';
import { DashChip } from '../items/chips/DashChip';
import { RebirthChip } from '../items/chips/RebirthChip';
import { WeaponPickup } from '../entities/WeaponPickup';
import { ModifierPickup } from '../entities/ModifierPickup';
import { ChipPickup } from '../entities/ChipPickup';
import { Game } from '../core/Game';

export class TestWorld extends World {
  private playerStartX: number;
  private playerStartY: number;
  private effectSystem: any; // Will be set during initialization

  constructor() {
    super();
    this.playerStartX = 0;
    this.playerStartY = 0;
  }

  public load(player: Player, entityManager: EntityManager, systemManager: SystemManager): void {
    this.entityManager = entityManager;
    this.systemManager = systemManager;
    
    // Get reference to effect system for modifiers
    this.effectSystem = systemManager.getEffectSystem();
    
    // Reset player position
    player.setPosition(this.playerStartX, this.playerStartY);
    
    // Add portal back to main world
    entityManager.addEntity(new PortalTrigger(
      0, 0,      // Position of portal in test world
      'main',    // Target world ID
      'To Main World'  // Description
    ));
    
    // Add sample weapons for testing
    entityManager.addEntity(new WeaponPickup(100, 0, new BasicPistol()));
    entityManager.addEntity(new WeaponPickup(200, 0, new Flamethrower()));
    entityManager.addEntity(new WeaponPickup(300, 0, new LaserRifle()));
    
    // Add sample modifiers for testing
    entityManager.addEntity(new ModifierPickup(100, 100, new DamageBoostModifier(2.0)));
    entityManager.addEntity(new ModifierPickup(150, 100, new PierceModifier()));
    entityManager.addEntity(new ModifierPickup(200, 100, new SinusoidalModifier()));
    entityManager.addEntity(new ModifierPickup(250, 100, new ExplosiveModifier(this.effectSystem)));
    
    // Add sample chips for testing
    entityManager.addEntity(new ChipPickup(100, 200, new TeleportChip()));
    entityManager.addEntity(new ChipPickup(150, 200, new DashChip()));
    entityManager.addEntity(new ChipPickup(200, 200, new RebirthChip()));
    
    // Add various test elements to demonstrate all features
    this.createTestAreas();
  }

  private createTestAreas(): void {
    // Create areas demonstrating different tile types
    // Area 1: Different tile types
    // This would be handled by the WorldManager with a special test generator
    
    // Area 2: Different regions
    // This would be handled by the WorldManager with region definitions
    
    // Area 3: Different entity interactions
    // Already handled with pickups above
    
    // Area 4: Different systems in action
    // Systems are managed globally but can behave differently per world
  }

  public unload(): void {
    // Cleanup any resources specific to this world
  }

  public update(player: Player, entityManager: EntityManager, systemManager: SystemManager): void {
    // Check for portal transitions
    const targetWorld = this.checkPortalTransitions(player);
    if (targetWorld) {
      console.log(`Transitioning to world: ${targetWorld}`);
    }
  }

  public render(engine: Engine, player: Player, entityManager: EntityManager): void {
    // The rendering is handled by the WorldManager and individual systems
    // This method can be used for world-specific visual effects or overlays
    // For the test world, we might want to show additional debug information
  }

  public getPlayerStartX(): number {
    return this.playerStartX;
  }

  public getPlayerStartY(): number {
    return this.playerStartY;
  }
}