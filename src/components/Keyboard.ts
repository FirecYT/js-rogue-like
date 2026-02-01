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

	public static getInstance(): Keyboard {
		if (!Keyboard.instance) {
			Keyboard.instance = new Keyboard();
		}
		return Keyboard.instance;
	}

	public isKeyPressedOnce(key: string): boolean {
		return this.keysPressed.has(key);
	}

	public isKeyDown(key: string): boolean {
		return this.keysDown.has(key);
	}

	public update(): void {
		this.keysPressed.clear();
	}
}
