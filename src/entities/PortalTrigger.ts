import Entity from './Entity';
import { Game } from '../core/Game';

export class PortalTrigger extends Entity {
  private targetWorldId: string;
  private description: string;
  private radius: number = 30; // Radius of the portal trigger area
  
  constructor(x: number, y: number, targetWorldId: string, description: string) {
    super(x, y, 0, 0); // width and height will be set later
    this.targetWorldId = targetWorldId;
    this.description = description;
    this.width = this.radius * 2;
    this.height = this.radius * 2;
  }

  public update(): void {
    // Portal triggers don't really need to update, but we can add animation or effects here
  }

  public render(context: CanvasRenderingContext2D): void {
    // Draw a visible representation of the portal
    context.save();
    
    // Draw outer glow
    const gradient = context.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius
    );
    gradient.addColorStop(0, 'rgba(100, 100, 255, 0.8)');
    gradient.addColorStop(0.7, 'rgba(50, 50, 150, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 50, 0)');
    
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fill();
    
    // Draw inner circle
    context.fillStyle = 'rgba(100, 150, 255, 0.3)';
    context.beginPath();
    context.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
    context.fill();
    
    // Draw center
    context.fillStyle = 'rgba(200, 220, 255, 0.8)';
    context.beginPath();
    context.arc(this.x, this.y, this.radius * 0.3, 0, Math.PI * 2);
    context.fill();
    
    context.restore();
  }

  public checkCollisionWithPlayer(playerX: number, playerY: number): boolean {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= this.radius;
  }

  public getTargetWorldId(): string {
    return this.targetWorldId;
  }

  public getDescription(): string {
    return this.description;
  }
}