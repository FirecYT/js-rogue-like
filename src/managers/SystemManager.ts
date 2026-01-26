import Engine from '../components/Engine';
import MouseInput from '../components/MouseInput';
import { Player } from '../Player';
import { EntityManager } from './EntityManager';
import { WorldManager } from './WorldManager';
import { PlayerProgression } from '../systems/PlayerProgression';
import { BossSpawnSystem } from '../systems/BossSpawnSystem';
import { EnemySpawnerSystem } from '../systems/EnemySpawnerSystem';
import { UISystem } from '../systems/UISystem';
import { PlayerController } from '../controllers/PlayerController';
import { ControlSwitchSystem } from '../systems/ControlSwitchSystem';
import { InventorySystem } from '../systems/InventorySystem';
import { EffectSystem } from '../systems/EffectSystem';
import { PickupUISystem } from '../systems/PickupUISystem';
import { RebirthSystem } from '../systems/RebirthSystem';
import { FloatingText } from '../components/FloatingText';

export class SystemManager {
  private engine: Engine;
  private mouse: MouseInput;
  private entityManager: EntityManager;
  private worldManager: WorldManager;
  
  // Game systems
  private playerProgression: PlayerProgression;
  private bossSpawnSystem: BossSpawnSystem;
  private enemySpawner: EnemySpawnerSystem;
  private uiSystem: UISystem;
  private controlSwitchSystem: ControlSwitchSystem;
  private inventorySystem: InventorySystem;
  private effectSystem: EffectSystem;
  private pickupUISystem: PickupUISystem;
  private rebirthSystem: RebirthSystem;
  
  // Additional data
  private floatingTexts: FloatingText[] = [];
  private state = 0;
  
  constructor(
    engine: Engine,
    mouse: MouseInput,
    entityManager: EntityManager,
    worldManager: WorldManager
  ) {
    this.engine = engine;
    this.mouse = mouse;
    this.entityManager = entityManager;
    this.worldManager = worldManager;
    
    // Initialize systems
    this.playerProgression = new PlayerProgression();
    this.effectSystem = new EffectSystem();
  }

  public initialize(player: Player): void {
    // Initialize player controller
    const playerController = new PlayerController(this.mouse);
    
    // Initialize control switch system
    this.controlSwitchSystem = new ControlSwitchSystem(
      player,
      playerController
    );
    
    // Initialize other systems
    this.enemySpawner = new EnemySpawnerSystem(player, this.entityManager.getEntities(), this.worldManager);
    
    this.bossSpawnSystem = new BossSpawnSystem(
      this.worldManager,
      this.entityManager.getEntities(),
      player,
      this.floatingTexts,
      []
    );
    
    this.uiSystem = new UISystem(
      this.engine,
      () => this.controlSwitchSystem.getCurrentControlled(),
      this.mouse,
      this.playerProgression,
      this.floatingTexts,
      () => this.state,
      (newState) => { this.state = newState; }
    );
    
    this.inventorySystem = new InventorySystem(
      this.engine,
      this.mouse,
      () => this.controlSwitchSystem.getCurrentControlled()
    );
    
    this.pickupUISystem = new PickupUISystem(
      this.engine,
      () => this.controlSwitchSystem.getCurrentControlled(),
      this.mouse,
      this.entityManager.getEntities()
    );
    
    this.rebirthSystem = new RebirthSystem(
      this.entityManager.getEntities(),
      this.controlSwitchSystem
    );
  }

  public update(state: number): void {
    this.state = state;
    
    const controlled = this.controlSwitchSystem.getCurrentControlled();
    
    // Update world
    this.worldManager.update(controlled.x, controlled.y);
    
    // Update boss spawn system
    this.bossSpawnSystem.update();
    
    // Update inventory system
    this.inventorySystem.update();
    
    // Update systems that require special handling
    if (!(this.state & 1)) {
      // Update entities with controllers
      const entities = this.entityManager.getEntities();
      for (const e of entities) {
        if (!e.isDead()) {
          if ('controller' in e) {
            (e.controller as any)?.update(e, this.worldManager, this.effectSystem);
          }
          e.inventory?.update();
        }
      }
      
      // Update enemy spawner
      this.enemySpawner.update();
    }
    
    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      this.floatingTexts[i].update();
      
      if (this.floatingTexts[i].isDead()) {
        this.floatingTexts.splice(i, 1);
      }
    }
    
    // Handle entity collisions and interactions
    this.handleEntityInteractions();
    
    // Update effects
    this.effectSystem.update(this.entityManager.getEntities());
  }

  private handleEntityInteractions(): void {
    const entities = this.entityManager.getEntities();
    const minDistSq = 10 * 10;

    // Apply repulsion forces between entities
    for (let i = 0; i < entities.length; i++) {
      if (entities[i].isDead()) continue;

      for (let j = i + 1; j < entities.length; j++) {
        if (entities[j].isDead()) continue;

        const dx = entities[i].x - entities[j].x;
        const dy = entities[i].y - entities[j].y;
        const distSq = dx * dx + dy * dy;

        if (distSq < minDistSq && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const force = 10 / dist;

          entities[i].x += (dx / dist) * force;
          entities[i].y += (dy / dist) * force;

          entities[j].x -= (dx / dist) * force;
          entities[j].y -= (dy / dist) * force;
        }
      }
    }

    // Check for pickup collisions
    const controlled = this.controlSwitchSystem.getCurrentControlled();
    if (!this.pickupUISystem.isActive()) {
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];

        // Check if entity is a pickup item
        if (entity.hasOwnProperty('onPickup')) {
          const dx = controlled.x - entity.x;
          const dy = controlled.y - entity.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // If player is close enough to pickup item
          if (distance < 20) { // Adjust pickup radius as needed
            this.pickupUISystem.activate(entity);
            (entity as any).onPickup(controlled);
            // Remove the pickup item from the world after activation
            entities.splice(i, 1);
            break; // Only handle one pickup at a time
          }
        }
      }
    }
  }

  public updateUI(state: number): void {
    this.state = state;
    this.uiSystem.update();
    this.pickupUISystem.update();
  }

  public renderUI(): void {
    this.uiSystem.render();
    this.inventorySystem.render();
    this.pickupUISystem.render();
  }

  public renderEffects(context: CanvasRenderingContext2D): void {
    this.effectSystem.render(context);
    
    // Render floating texts
    for (const floatingText of this.floatingTexts) {
      floatingText.render(context);
    }
  }

  public cleanup(): void {
    // Clear floating texts
    this.floatingTexts = [];
    
    // Reset state
    this.state = 0;
  }
  
  public getEffectSystem(): EffectSystem {
    return this.effectSystem;
  }
}