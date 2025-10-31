export default class Engine {
	public canvas: HTMLCanvasElement;
	public context: CanvasRenderingContext2D;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;

		const context = canvas.getContext('2d');

		if (!context) {
			throw new Error("Can't get context");
		}

		this.context = context;

		this.canvas.width = document.body.clientWidth;
		this.canvas.height = document.body.clientHeight;
	}

	clear() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	// update () {
	// 	player.update();
	// }

	// render () {
	// 	player.render(this.context)
	// }

	// tick () {
	// 	this.update();
	// 	this.render();

	// 	requestAnimationFrame(this.tick);
	// }
}
