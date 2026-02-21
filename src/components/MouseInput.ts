export default class MouseInput {
	public x = 0;
	public y = 0;
	public cx = 0;
	public cy = 0;
	public pressed = false;

	constructor(canvas: HTMLCanvasElement) {
		canvas.addEventListener('mousemove', e => {
			this.x = e.offsetX;
			this.y = e.offsetY;
			this.cx = e.offsetX - canvas.width / 2;
			this.cy = e.offsetY - canvas.height / 2;
		});
		canvas.addEventListener('mousedown', () => this.pressed = true);
		canvas.addEventListener('mouseup', () => this.pressed = false);
	}
}
