import Entity from '../entities/Entity';

export abstract class Effect {
	constructor(
		public x: number,
		public y: number,
		public angle: number,
		public source: Entity,
		public damage: number
	) { }

	abstract update(enities: Entity[]): void;
	abstract render(ctx: CanvasRenderingContext2D): void;
	abstract isDead(): boolean;

	onHit?(target: Entity): void;
	onDeath?(): void;
	shouldPassThrough(target: Entity): boolean { void target; return false; }
}
