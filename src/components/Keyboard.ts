export default class Keyboard {
	private static instance: Keyboard;
	private keys: Set<string> = new Set<string>();

	constructor() {
		// Инициализация событий нажатия клавиш
		document.addEventListener('keydown', (event) => {
			this.keys.add(event.code);
		});

		// Инициализация событий отпускания клавиш
		document.addEventListener('keyup', (event) => {
			this.keys.delete(event.code);
		});
	}

	public static getInstance(): Keyboard {
		if (!Keyboard.instance) {
			Keyboard.instance = new Keyboard();
		}
		return Keyboard.instance;
	}

	public isKeyPressed(key: string): boolean {
		return this.keys.has(key);
	}
}
