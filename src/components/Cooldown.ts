export default class Cooldown {
	private maxFrames: number;
	private currentFrames = 0;
	private onReadyCallbacks: (() => void)[] = [];
	private onStartCallbacks: (() => void)[] = [];
	private onUpdateCallbacks: ((progress: number) => void)[] = [];

	constructor(frames: number) {
		this.maxFrames = frames;
	}

	getMaximum() {
		return this.maxFrames;
	}

	setDuration(frames: number) {
		this.maxFrames = frames;

		return this;
	}

	start() {
		this.currentFrames = this.maxFrames;
		this.onStartCallbacks.forEach(callback => callback());

		return this;
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

			this.onUpdateCallbacks.forEach(callback => callback(this.progress()));

			if (this.currentFrames === 0) {
				this.onReadyCallbacks.forEach(callback => callback());
			}
		}
	}

	onReady(callback: () => void) {
		this.onReadyCallbacks.push(callback);

		return this;
	}

	onStart(callback: () => void) {
		this.onStartCallbacks.push(callback);

		return this;
	}

	onUpdate(callback: (progress: number) => void) {
		this.onUpdateCallbacks.push(callback);

		return this;
	}

	removeOnReady(callback: () => void) {
		this.onReadyCallbacks = this.onReadyCallbacks.filter(cb => cb !== callback);

		return this;
	}

	removeOnStart(callback: () => void) {
		this.onStartCallbacks = this.onStartCallbacks.filter(cb => cb !== callback);

		return this;
	}

	removeOnUpdate(callback: (progress: number) => void) {
		this.onUpdateCallbacks = this.onUpdateCallbacks.filter(cb => cb !== callback);

		return this;
	}

	clearAllListeners() {
		this.onReadyCallbacks = [];
		this.onStartCallbacks = [];
		this.onUpdateCallbacks = [];

		return this;
	}
}
