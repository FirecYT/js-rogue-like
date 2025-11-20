import GameObject from "./GameObject";

export default class FloatingText extends GameObject {
	private text: string;

	constructor(x: number, y: number, text: string, lifetime: number) {
		super(x, y, lifetime);

		this.text = text;
	}

	update(): void {
		this.hp--;
		this.y -= 0.5;
	}

	render(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = '#ff0';
		ctx.fillText(this.text, this.x, this.y);
	}
}
