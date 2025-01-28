export default class Engine {
	public canvas: HTMLCanvasElement;
	public context: CanvasRenderingContext2D;

	constructor (canvas: HTMLCanvasElement) {
		this.canvas = canvas;

		const context = canvas.getContext('2d');

		if (!context) {
			throw new Error('Can\'t get context');
		}

		this.context = context;

		this.canvas.width = 640;
		this.canvas.height = 480;
	}

	clear () {
		this.context.clearRect(
			0,
			0,
			this.canvas.width,
			this.canvas.height
		);
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
