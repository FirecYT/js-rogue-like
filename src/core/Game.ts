import Engine from '../components/Engine';
import { WorldManager } from '../managers/WorldManager';
import { World } from '../worlds/World';
import { MainWorld } from '../worlds/MainWorld';
import { TestWorld } from '../worlds/TestWorld';
import { EntityManager } from '../managers/EntityManager';
import { SystemManager } from '../managers/SystemManager';
import { Player } from '../Player';
import MouseInput from '../components/MouseInput';
import Keyboard from '../components/Keyboard';
import { Camera } from '../components/Camera';
import { PortalTrigger } from '../entities/PortalTrigger';

export class Game {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private mouse: MouseInput;
  private keyboard: Keyboard;
  private camera: Camera;
  
  private worldManager: WorldManager;
  private entityManager: EntityManager;
  private systemManager: SystemManager;
  
  private currentPlayer: Player;
  private activeWorld: World | null = null;
  
  private scale = 0;
  private state = 0;
  
  constructor(canvasId: string = '#canvas') {
    this.canvas = document.querySelector<HTMLCanvasElement>(canvasId) as HTMLCanvasElement;
    
    if (!this.canvas) {
      throw new Error('Canvas not found');
    }
    
    this.mouse = new MouseInput(this.canvas);
    this.engine = new Engine(this.canvas);
    this.keyboard = Keyboard.getInstance();
    this.camera = new Camera(this.canvas);
    
    this.worldManager = new WorldManager();
    this.entityManager = new EntityManager();
    this.systemManager = new SystemManager(this.engine, this.mouse, this.entityManager, this.worldManager);
    
    // Create the initial player
    this.currentPlayer = new Player(0, 0); // Will be positioned properly when world loads
    
    // Initialize worlds
    this.worldManager.addWorld('main', new MainWorld());
    this.worldManager.addWorld('test', new TestWorld());
    
    // Set initial world to main world
    this.setWorld('main');
  }
  
  public async initialize(): Promise<void> {
    await this.engine.loadImages([
      'images/trash_0.png',
      'images/trash_1.png',
      'images/trash_2.png',
      'images/floor_0.png',
      'images/floor_1.png',
      'images/floor_2.png',
      'images/floor_3.png',
      'images/floor_4.png',
      'images/floor_5.png',
      'images/floor_6.png',
      'images/walls.png',
    ]);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initialize systems
    this.systemManager.initialize(this.currentPlayer);
  }
  
  private setupEventListeners(): void {
    this.canvas.addEventListener('wheel', (event) => {
      this.scale -= Math.sign(event.deltaY);
    });
  }
  
  public setWorld(worldId: string): void {
    const world = this.worldManager.getWorld(worldId);
    if (!world) {
      console.error(`World with ID '${worldId}' not found`);
      return;
    }
    
    // Clean up the current world if there is one
    if (this.activeWorld) {
      this.activeWorld.unload();
      this.entityManager.clearEntities();
      this.systemManager.cleanup();
    }
    
    // Inform the WorldManager about the current world
    this.worldManager.setCurrentWorldId(worldId);
    
    // Switch to the new world
    this.activeWorld = world;
    this.activeWorld.load(this.currentPlayer, this.entityManager, this.systemManager);
    
    // Update player position based on world requirements
    this.currentPlayer.setPosition(
      this.activeWorld.getPlayerStartX(),
      this.activeWorld.getPlayerStartY()
    );
    
    // Add player to entity manager
    this.entityManager.addEntity(this.currentPlayer);
  }
  
  public getCurrentWorld(): World | null {
    return this.activeWorld;
  }
  
  public getPlayer(): Player {
    return this.currentPlayer;
  }
  
  public update(): void {
    if (!this.activeWorld) return;
    
    // Check for portal transitions first
    const targetWorld = this.checkPortalTransition();
    if (targetWorld) {
      this.setWorld(targetWorld);
      return; // Skip rest of update after world transition
    }
    
    // Update the active world
    this.activeWorld.update(this.currentPlayer, this.entityManager, this.systemManager);
    
    // Update camera to follow player
    this.camera.update();
    this.camera.follow(this.currentPlayer);
    
    // Update systems
    this.systemManager.update(this.state);
    
    // Update entities
    this.entityManager.update();
    
    // Update UI systems
    this.systemManager.updateUI(this.state);
  }
  
  private checkPortalTransition(): string | null {
    if (!this.activeWorld) return null;
    
    // Check if player is colliding with any portal in the current world
    const entities = this.entityManager.getEntities();
    
    for (const entity of entities) {
      if (entity instanceof PortalTrigger) {
        const dx = this.currentPlayer.x - entity.x;
        const dy = this.currentPlayer.y - entity.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= 30) { // Assuming 30 is the portal radius
          return (entity as PortalTrigger).getTargetWorldId();
        }
      }
    }
    
    return null;
  }
  
  public render(): void {
    if (!this.activeWorld) return;
    
    this.engine.clear();
    
    this.engine.context.fillStyle = '#222';
    this.engine.context.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);
    
    this.engine.context.save();
    this.engine.context.translate(
      Math.floor(this.engine.canvas.width / 2),
      Math.floor(this.engine.canvas.height / 2)
    );
    this.engine.context.scale(2 ** this.scale, 2 ** this.scale);
    const { offsetX, offsetY } = this.camera.getOffset();
    this.engine.context.translate(offsetX, offsetY);
    
    // Render the active world
    this.activeWorld.render(this.engine, this.currentPlayer, this.entityManager);
    
    // Render entities
    this.entityManager.render(this.engine.context);
    
    // Render effects
    this.systemManager.renderEffects(this.engine.context);
    
    this.engine.context.restore();
    
    // Render UI
    this.systemManager.renderUI();
  }
  
  public run(): void {
    const gameLoop = () => {
      this.update();
      this.render();
      requestAnimationFrame(gameLoop);
    };
    
    requestAnimationFrame(gameLoop);
  }
}