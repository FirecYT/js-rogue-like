export default abstract class GameObject {
	constructor(
		public x: number,
		public y: number,
		private hp = 1
	) {}

	abstract update(): void;
	abstract render(ctx: CanvasRenderingContext2D): void;

	isDead(): boolean {
		return this.hp <= 0;
	}

	getHP(): number {
		return this.hp;
	}

	takeDamage(damage: number): void {
		this.hp -= damage;
	}
}
