import GameObject from "./GameObject";

/**
 * Всплывающий текст с ограниченным временем жизни (HP как счётчик кадров).
 */
export default class FloatingText extends GameObject {
	private text: string;

	/**
	 * @param x - Мировая координата X
	 * @param y - Мировая координата Y
	 * @param text - Отображаемый текст
	 * @param lifetime - Время жизни в кадрах (передаётся как hp)
	 */
	constructor(x: number, y: number, text: string, lifetime: number) {
		super(x, y, lifetime);
		this.text = text;
	}

	/**
	 * Уменьшает «здоровье» на 1 и слегка поднимает текст вверх.
	 */
	update(): void {
		this.hp--;
		this.y -= 0.5;
	}

	/**
	 * Рисует текст жёлтым цветом.
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = '#ff0';
		ctx.fillText(this.text, this.x, this.y);
	}
}
