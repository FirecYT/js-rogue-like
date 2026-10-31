/**
 * Состояние мыши относительно канваса: координаты, нажатие и прокрутка колеса.
 * Единая точка сбора всех событий мыши (SRP).
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
	/** Нажата ли левая кнопка мыши */
	public pressed = false;
	/**
	 * Дельта прокрутки колеса за последний кадр.
	 * Положительное значение — прокрутка вниз (от себя), отрицательное — вверх (к себе).
	 * Сбрасывается в 0 при вызове update().
	 */
	public wheelDelta = 0;

	/**
	 * Подписывается на события мыши канваса: движение, клики, прокрутка.
	 * @param canvas - Элемент canvas
	 */
	constructor(canvas: HTMLCanvasElement) {
		canvas.addEventListener('mousemove', (e) => {
			this.x = e.offsetX;
			this.y = e.offsetY;
			this.cx = e.offsetX - canvas.width / 2;
			this.cy = e.offsetY - canvas.height / 2;
		});
		canvas.addEventListener('mousedown', () => (this.pressed = true));
		canvas.addEventListener('mouseup', () => (this.pressed = false));
		canvas.addEventListener(
			'wheel',
			(e) => {
				this.wheelDelta += Math.sign(e.deltaY);
				e.preventDefault();
			},
			{ passive: false }
		);
	}

	/**
	 * Сбрасывает wheelDelta в 0 (вызывать раз в кадр после обработки).
	 */
	update(): void {
		this.wheelDelta = 0;
	}
}
