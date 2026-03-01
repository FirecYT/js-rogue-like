/**
 * Движок отрисовки: канвас, контекст, загрузка и отрисовка изображений.
 */
export default class Engine {
	public canvas: HTMLCanvasElement;
	public context: CanvasRenderingContext2D;
	private images: Map<string, HTMLImageElement> = new Map<string, HTMLImageElement>();
	private imageLoadingPromises: Map<string, Promise<HTMLImageElement>> = new Map<string, Promise<HTMLImageElement>>();

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
		if (this.images.has(url)) {
			return Promise.resolve(this.images.get(url) as HTMLImageElement);
		}
		if (this.imageLoadingPromises.has(url)) {
			return this.imageLoadingPromises.get(url) as Promise<HTMLImageElement>;
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
		const promises = urls.map(url => this.loadImage(url));
		await Promise.all(promises);
		return this.images;
	}

	/**
	 * Рисует изображение на канвасе.
	 * @param image - URL (из кэша движка) или HTMLImageElement
	 * @param x - Позиция X
	 * @param y - Позиция Y
	 * @param width - Ширина (опционально)
	 * @param height - Высота (опционально)
	 */
	drawImage(
		image: HTMLImageElement | string,
		x: number,
		y: number,
		width?: number,
		height?: number
	): void {
		let img: HTMLImageElement;
		if (typeof image === 'string') {
			if (!this.images.has(image)) {
				console.warn(`Image not loaded: ${image}`);
				return;
			}
			img = this.images.get(image) as HTMLImageElement;
		} else {
			img = image;
		}
		if (width != null && height != null) {
			this.context.drawImage(img, x, y, width, height);
		} else {
			this.context.drawImage(img, x, y);
		}
	}

	/**
	 * Рисует часть изображения (спрайт из спрайтшита).
	 * @param image - URL или HTMLImageElement
	 * @param sx - X в источнике
	 * @param sy - Y в источнике
	 * @param sw - Ширина в источнике
	 * @param sh - Высота в источнике
	 * @param dx - X на канвасе
	 * @param dy - Y на канвасе
	 * @param dw - Ширина на канвасе
	 * @param dh - Высота на канвасе
	 */
	drawSprite(
		image: HTMLImageElement | string,
		sx: number, sy: number, sw: number, sh: number,
		dx: number, dy: number, dw: number, dh: number
	): void {
		let img: HTMLImageElement;
		if (typeof image === 'string') {
			if (!this.images.has(image)) {
				console.warn(`Image not loaded: ${image}`);
				return;
			}
			img = this.images.get(image) as HTMLImageElement;
		} else {
			img = image;
		}
		this.context.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
	}

	/**
	 * Рисует изображение с поворотом вокруг центра (x, y).
	 * @param image - URL или HTMLImageElement
	 * @param x - Центр по X
	 * @param y - Центр по Y
	 * @param angle - Угол в радианах
	 * @param width - Ширина (опционально)
	 * @param height - Высота (опционально)
	 */
	drawImageRotated(
		image: HTMLImageElement | string,
		x: number,
		y: number,
		angle: number,
		width?: number,
		height?: number
	): void {
		let img: HTMLImageElement;
		if (typeof image === 'string') {
			if (!this.images.has(image)) {
				console.warn(`Image not loaded: ${image}`);
				return;
			}
			img = this.images.get(image) as HTMLImageElement;
		} else {
			img = image;
		}
		this.context.save();
		this.context.translate(x, y);
		this.context.rotate(angle);
		const drawWidth = width ?? img.width;
		const drawHeight = height ?? img.height;
		this.context.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
		this.context.restore();
	}

	/**
	 * Рисует изображение с масштабированием.
	 * @param image - URL или HTMLImageElement
	 * @param x - Позиция X
	 * @param y - Позиция Y
	 * @param scaleX - Масштаб по X
	 * @param scaleY - Масштаб по Y
	 * @param width - Базовая ширина (опционально)
	 * @param height - Базовая высота (опционально)
	 */
	drawImageScaled(
		image: HTMLImageElement | string,
		x: number,
		y: number,
		scaleX: number,
		scaleY: number,
		width?: number,
		height?: number
	): void {
		let img: HTMLImageElement;
		if (typeof image === 'string') {
			if (!this.images.has(image)) {
				console.warn(`Image not loaded: ${image}`);
				return;
			}
			img = this.images.get(image) as HTMLImageElement;
		} else {
			img = image;
		}
		const drawWidth = (width ?? img.width) * scaleX;
		const drawHeight = (height ?? img.height) * scaleY;
		this.context.drawImage(img, x, y, drawWidth, drawHeight);
	}

	/**
	 * Рисует изображение с заданной прозрачностью.
	 * @param image - URL или HTMLImageElement
	 * @param x - Позиция X
	 * @param y - Позиция Y
	 * @param alpha - Прозрачность от 0 до 1
	 * @param width - Ширина (опционально)
	 * @param height - Высота (опционально)
	 */
	drawImageWithAlpha(
		image: HTMLImageElement | string,
		x: number,
		y: number,
		alpha: number,
		width?: number,
		height?: number
	): void {
		this.context.save();
		this.context.globalAlpha = alpha;
		this.drawImage(image, x, y, width, height);
		this.context.restore();
	}

	/**
	 * Проверяет, загружено ли изображение по URL.
	 * @param url - URL изображения
	 * @returns true, если изображение в кэше
	 */
	isImageLoaded(url: string): boolean {
		return this.images.has(url);
	}

	/**
	 * Возвращает загруженное изображение по URL.
	 * @param url - URL изображения
	 * @returns HTMLImageElement или undefined
	 */
	getImage(url: string): HTMLImageElement | undefined {
		return this.images.get(url);
	}

	/**
	 * Очищает кэш изображений и активные промисы загрузки.
	 */
	clearImageCache(): void {
		this.images.clear();
		this.imageLoadingPromises.clear();
	}

	/**
	 * Создаёт изображение из процедурной отрисовки на временном канвасе.
	 * @param width - Ширина канваса
	 * @param height - Высота канваса
	 * @param drawCallback - Функция отрисовки (получает контекст)
	 * @returns Созданное изображение
	 */
	createImageFromData(
		width: number,
		height: number,
		drawCallback: (ctx: CanvasRenderingContext2D) => void
	): HTMLImageElement {
		const offscreenCanvas = document.createElement('canvas');
		offscreenCanvas.width = width;
		offscreenCanvas.height = height;
		const offscreenCtx = offscreenCanvas.getContext('2d');
		if (!offscreenCtx) {
			throw new Error("Can't create offscreen context");
		}
		drawCallback(offscreenCtx);
		const img = new Image();
		img.src = offscreenCanvas.toDataURL();
		return img;
	}

	/**
	 * Загружает спрайтшит и возвращает функцию получения координат спрайта по индексам (x, y).
	 * @param url - URL изображения спрайтшита
	 * @param spriteWidth - Ширина одного спрайта
	 * @param spriteHeight - Высота одного спрайта
	 * @returns Промис с объектом { image, getSprite(x, y) -> { sx, sy, sw, sh } }
	 */
	async loadSpriteSheet(
		url: string,
		spriteWidth: number,
		spriteHeight: number
	): Promise<{ image: HTMLImageElement; getSprite: (x: number, y: number) => { sx: number; sy: number; sw: number; sh: number } }> {
		const image = await this.loadImage(url);
		const getSprite = (x: number, y: number) => ({
			sx: x * spriteWidth,
			sy: y * spriteHeight,
			sw: spriteWidth,
			sh: spriteHeight
		});
		return { image, getSprite };
	}

	/**
	 * Устанавливает размер канваса.
	 * @param width - Ширина
	 * @param height - Высота
	 */
	resize(width: number, height: number): void {
		this.canvas.width = width;
		this.canvas.height = height;
	}

	/**
	 * Рисует многострочный текст (каждая строка через \n) с межстрочным интервалом 16.
	 * @param text - Текст с переносами строк
	 * @param x - Позиция X
	 * @param y - Позиция Y первой строки
	 */
	multiline(text: string, x: number, y: number): void {
		const lines = text.split('\n');
		for (let i = 0; i < lines.length; i++) {
			this.context.fillText(lines[i], x, y + i * 16);
		}
	}
}
