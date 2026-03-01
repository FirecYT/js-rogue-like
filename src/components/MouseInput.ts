/**
 * Состояние мыши относительно канваса: координаты и нажатие.
 */
export default class MouseInput {
	/** Координата X относительно канваса */
	public x = 0;
	/** Координата Y относительно канваса */
	public y = 0;
	/** Смещение X от центра канваса */
	public cx = 0;
	/** Смещение Y от центра канваса */
	public cy = 0;
	/** Нажата ли кнопка мыши */
	public pressed = false;

	/**
	 * Подписывается на события мыши канваса и обновляет x, y, cx, cy, pressed.
	 * @param canvas - Элемент canvas
	 */
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
