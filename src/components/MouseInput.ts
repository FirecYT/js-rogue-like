export default class MouseInput {
	public x = 0;
	public y = 0;
	public pressed = false;

	constructor(canvas: HTMLCanvasElement) {
		canvas.addEventListener('mousemove', e => {
			this.x = e.offsetX;
			this.y = e.offsetY;
		});
		canvas.addEventListener('mousedown', () => this.pressed = true);
		canvas.addEventListener('mouseup', () => this.pressed = false);
	}
}
