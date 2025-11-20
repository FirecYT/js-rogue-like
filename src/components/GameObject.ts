export default abstract class GameObject {
	public maxHP: number;

	constructor(
		public x: number,
		public y: number,
		protected hp = 1
	) {
		this.maxHP = hp;
	}

	abstract update(): void;
	abstract render(ctx: CanvasRenderingContext2D): void;

	protected initHP(hp: number) {
		this.hp = hp;
		this.maxHP = hp;
	}

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
