export default class Cooldown {
	private maximumValue: number;
	private value = 0;

	constructor(seconds: number) {
		this.maximumValue = seconds * 60;
	}

	getMaximum() {
		return this.maximumValue;
	}

	edit(frames: number) {
		this.maximumValue = frames;
	}

	set() {
		this.value = this.maximumValue;
	}

	get() {
		return this.value == 0;
	}

	val() {
		return this.value / this.maximumValue;
	}

	update() {
		if (this.value > 0) {
			this.value--;
		}
	}
}
