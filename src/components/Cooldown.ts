export default class Cooldown {
	private maxFrames: number;
	private currentFrames = 0;

	constructor(frames: number) {
		this.maxFrames = frames;
	}

	getMaximum() {
		return this.maxFrames;
	}

	setDuration(frames: number) {
		this.maxFrames = frames;
	}

	start() {
		this.currentFrames = this.maxFrames;
	}

	isReady() {
		return this.currentFrames == 0;
	}

	progress() {
		return this.currentFrames / this.maxFrames;
	}

	update() {
		if (this.currentFrames > 0) {
			this.currentFrames--;
		}
	}
}
