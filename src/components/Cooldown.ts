/**
 * Таймер перезарядки в кадрах с колбэками onReady, onStart, onUpdate.
 */
export default class Cooldown {
	private maxFrames: number;
	private currentFrames = 0;
	private onReadyCallbacks: (() => void)[] = [];
	private onStartCallbacks: (() => void)[] = [];
	private onUpdateCallbacks: ((progress: number) => void)[] = [];

	/**
	 * @param frames - Длительность перезарядки в кадрах
	 */
	constructor(frames: number) {
		this.maxFrames = frames;
	}

	/**
	 * Возвращает длительность перезарядки в кадрах.
	 * @returns Максимальное количество кадров
	 */
	getMaximum(): number {
		return this.maxFrames;
	}

	/**
	 * Устанавливает длительность перезарядки.
	 * @param frames - Количество кадров
	 * @returns this для цепочки вызовов
	 */
	setDuration(frames: number): this {
		this.maxFrames = frames;
		return this;
	}

	/**
	 * Запускает перезарядку (сбрасывает счётчик на maxFrames и вызывает onStart).
	 * @returns this для цепочки вызовов
	 */
	start(): this {
		this.currentFrames = this.maxFrames;
		this.onStartCallbacks.forEach(callback => callback());
		return this;
	}

	/**
	 * Проверяет, закончилась ли перезарядка.
	 * @returns true, если currentFrames === 0
	 */
	isReady(): boolean {
		return this.currentFrames === 0;
	}

	/**
	 * Возвращает прогресс перезарядки (1 = только началось, 0 = готово).
	 * @returns currentFrames / maxFrames
	 */
	progress(): number {
		return this.currentFrames / this.maxFrames;
	}

	/**
	 * Обновляет счётчик на один кадр; при достижении 0 вызывает onReady.
	 */
	update(): void {
		if (this.currentFrames > 0) {
			this.currentFrames--;
			this.onUpdateCallbacks.forEach(callback => callback(this.progress()));
			if (this.currentFrames === 0) {
				this.onReadyCallbacks.forEach(callback => callback());
			}
		}
	}

	/**
	 * Подписывается на окончание перезарядки.
	 * @param callback - Функция без аргументов
	 * @returns this для цепочки вызовов
	 */
	onReady(callback: () => void): this {
		this.onReadyCallbacks.push(callback);
		return this;
	}

	/**
	 * Подписывается на старт перезарядки.
	 * @param callback - Функция без аргументов
	 * @returns this для цепочки вызовов
	 */
	onStart(callback: () => void): this {
		this.onStartCallbacks.push(callback);
		return this;
	}

	/**
	 * Подписывается на каждый кадр во время перезарядки.
	 * @param callback - Функция (progress: number)
	 * @returns this для цепочки вызовов
	 */
	onUpdate(callback: (progress: number) => void): this {
		this.onUpdateCallbacks.push(callback);
		return this;
	}

	/**
	 * Удаляет подписчика onReady.
	 * @param callback - Тот же колбэк, что был передан в onReady
	 * @returns this для цепочки вызовов
	 */
	removeOnReady(callback: () => void): this {
		this.onReadyCallbacks = this.onReadyCallbacks.filter(cb => cb !== callback);
		return this;
	}

	/**
	 * Удаляет подписчика onStart.
	 * @param callback - Тот же колбэк, что был передан в onStart
	 * @returns this для цепочки вызовов
	 */
	removeOnStart(callback: () => void): this {
		this.onStartCallbacks = this.onStartCallbacks.filter(cb => cb !== callback);
		return this;
	}

	/**
	 * Удаляет подписчика onUpdate.
	 * @param callback - Тот же колбэк, что был передан в onUpdate
	 * @returns this для цепочки вызовов
	 */
	removeOnUpdate(callback: (progress: number) => void): this {
		this.onUpdateCallbacks = this.onUpdateCallbacks.filter(cb => cb !== callback);
		return this;
	}

	/**
	 * Очищает все подписки (onReady, onStart, onUpdate).
	 * @returns this для цепочки вызовов
	 */
	clearAllListeners(): this {
		this.onReadyCallbacks = [];
		this.onStartCallbacks = [];
		this.onUpdateCallbacks = [];
		return this;
	}
}
