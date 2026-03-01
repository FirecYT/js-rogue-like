/**
 * Синглтон состояния клавиатуры: удержание и одноразовое нажатие клавиш.
 */
export default class Keyboard {
	private static instance: Keyboard;
	private keysDown = new Set<string>();
	private keysPressed = new Set<string>();

	constructor() {
		document.addEventListener('keydown', (e) => {
			e.preventDefault();
			if (!this.keysDown.has(e.code)) {
				this.keysDown.add(e.code);
				this.keysPressed.add(e.code);
			}
		});
		document.addEventListener('keyup', (e) => {
			e.preventDefault();
			this.keysDown.delete(e.code);
		});
	}

	/**
	 * Возвращает единственный экземпляр клавиатуры.
	 * @returns Экземпляр Keyboard
	 */
	public static getInstance(): Keyboard {
		if (!Keyboard.instance) {
			Keyboard.instance = new Keyboard();
		}
		return Keyboard.instance;
	}

	/**
	 * Была ли клавиша нажата в текущем кадре (одно нажатие = один true до следующего update).
	 * @param key - Код клавиши (например, 'KeyA', 'Digit1')
	 * @returns true, если клавиша нажата в этом кадре
	 */
	public isKeyPressedOnce(key: string): boolean {
		return this.keysPressed.has(key);
	}

	/**
	 * Удерживается ли клавиша в данный момент.
	 * @param key - Код клавиши
	 * @returns true, если клавиша удерживается
	 */
	public isKeyDown(key: string): boolean {
		return this.keysDown.has(key);
	}

	/**
	 * Очищает множество «одноразовых» нажатий (вызывать раз в кадр).
	 */
	public update(): void {
		this.keysPressed.clear();
	}
}
