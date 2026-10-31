/**
 * Движок отрисовки: канвас, контекст, загрузка и кэш изображений.
 * Отрисовку мира выполняет @firec/map-module через визуальные провайдеры,
 * поэтому Engine предоставляет только доступ к картинкам и контексту.
 */
export default class Engine {
	public canvas: HTMLCanvasElement;
	public context: CanvasRenderingContext2D;
	private images: Map<string, HTMLImageElement> = new Map<
		string,
		HTMLImageElement
	>();
	private imageLoadingPromises: Map<string, Promise<HTMLImageElement>> =
		new Map<string, Promise<HTMLImageElement>>();

	/**
	 * @param canvas - Элемент canvas для отрисовки
	 */
	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		const context = canvas.getContext('2d');
		if (!context) {
			throw new Error("Can't get context");
		}
		this.context = context;
		this.canvas.width = this.canvas.parentElement?.clientWidth || 640;
		this.canvas.height = this.canvas.parentElement?.clientHeight || 480;
		this.context.imageSmoothingEnabled = false;
	}

	/**
	 * Очищает весь канвас.
	 */
	clear(): void {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	/**
	 * Загружает изображение по URL (с кэшем и дедупликацией запросов).
	 * @param url - URL изображения
	 * @returns Промис с загруженным изображением
	 */
	loadImage(url: string): Promise<HTMLImageElement> {
		const cached = this.images.get(url);
		if (cached) {
			return Promise.resolve(cached);
		}
		const pending = this.imageLoadingPromises.get(url);
		if (pending) {
			return pending;
		}
		const promise = new Promise<HTMLImageElement>((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				this.images.set(url, img);
				this.imageLoadingPromises.delete(url);
				resolve(img);
			};
			img.onerror = () => {
				this.imageLoadingPromises.delete(url);
				reject(new Error(`Failed to load image: ${url}`));
			};
			img.src = url;
		});
		this.imageLoadingPromises.set(url, promise);
		return promise;
	}

	/**
	 * Загружает несколько изображений по URL.
	 * @param urls - Массив URL изображений
	 * @returns Промис с картой URL -> HTMLImageElement
	 */
	async loadImages(urls: string[]): Promise<Map<string, HTMLImageElement>> {
		await Promise.all(urls.map((url) => this.loadImage(url)));
		return this.images;
	}

	/**
	 * Возвращает загруженное изображение по URL.
	 * @param url - URL изображения
	 * @returns HTMLImageElement или undefined, если не загружено
	 */
	getImage(url: string): HTMLImageElement | undefined {
		return this.images.get(url);
	}

	/**
	 * Освобождает ресурсы: очищает кэш изображений и активные промисы загрузки.
	 */
	dispose(): void {
		this.images.clear();
		this.imageLoadingPromises.clear();
	}
}
