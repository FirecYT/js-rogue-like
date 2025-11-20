export default class Engine {
	public canvas: HTMLCanvasElement;
	public context: CanvasRenderingContext2D;
	private images: Map<string, HTMLImageElement> = new Map<string, HTMLImageElement>();
	private imageLoadingPromises: Map<string, Promise<HTMLImageElement>> = new Map<string, Promise<HTMLImageElement>>();

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;

		const context = canvas.getContext('2d');

		if (!context) {
			throw new Error("Can't get context");
		}

		this.context = context;

		this.canvas.width = document.body.clientWidth;
		this.canvas.height = document.body.clientHeight;

		this.context.imageSmoothingEnabled = false;
	}

	clear() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	// Загрузка изображения
	loadImage(url: string): Promise<HTMLImageElement> {
		// Если изображение уже загружено, возвращаем его
		if (this.images.has(url)) {
			return Promise.resolve(this.images.get(url) as HTMLImageElement);
		}

		// Если изображение уже загружается, возвращаем существующий промис
		if (this.imageLoadingPromises.has(url)) {
			return this.imageLoadingPromises.get(url) as Promise<HTMLImageElement>;
		}

		// Создаем новый промис для загрузки
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

	// Загрузка нескольких изображений
	async loadImages(urls: string[]): Promise<Map<string, HTMLImageElement>> {
		const promises = urls.map(url => this.loadImage(url));
		await Promise.all(promises);
		return this.images;
	}

	// Отрисовка изображения
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

		if (width && height) {
			this.context.drawImage(img, x, y, width, height);
		} else {
			this.context.drawImage(img, x, y);
		}
	}

	// Отрисовка части изображения (спрайт из спрайтшита)
	drawSprite(
		image: HTMLImageElement | string,
		sx: number, // source x
		sy: number, // source y
		sw: number, // source width
		sh: number, // source height
		dx: number, // destination x
		dy: number, // destination y
		dw: number, // destination width
		dh: number  // destination height
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

	// Отрисовка изображения с поворотом
	drawImageRotated(
		image: HTMLImageElement | string,
		x: number,
		y: number,
		angle: number, // угол в радианах
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

		const drawWidth = width || img.width;
		const drawHeight = height || img.height;

		this.context.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
		this.context.restore();
	}

	// Отрисовка изображения с масштабированием
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

		const drawWidth = (width || img.width) * scaleX;
		const drawHeight = (height || img.height) * scaleY;

		this.context.drawImage(img, x, y, drawWidth, drawHeight);
	}

	// Отрисовка с прозрачностью
	drawImageWithAlpha(
		image: HTMLImageElement | string,
		x: number,
		y: number,
		alpha: number, // от 0 до 1
		width?: number,
		height?: number
	): void {
		this.context.save();
		this.context.globalAlpha = alpha;
		this.drawImage(image, x, y, width, height);
		this.context.restore();
	}

	// Проверка, загружено ли изображение
	isImageLoaded(url: string): boolean {
		return this.images.has(url);
	}

	// Получение загруженного изображения
	getImage(url: string): HTMLImageElement | undefined {
		return this.images.get(url);
	}

	// Очистка кеша изображений
	clearImageCache(): void {
		this.images.clear();
		this.imageLoadingPromises.clear();
	}

	// Создание изображения из данных (для procedural generation)
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

	// Вспомогательная функция для загрузки спрайтшита с автоматической нарезкой
	async loadSpriteSheet(
		url: string,
		spriteWidth: number,
		spriteHeight: number
	): Promise<{ image: HTMLImageElement; getSprite: (x: number, y: number) => { sx: number; sy: number; sw: number; sh: number } }> {
		const image = await this.loadImage(url);

		// const cols = Math.floor(image.width / spriteWidth);
		// const rows = Math.floor(image.height / spriteHeight);

		const getSprite = (x: number, y: number) => ({
			sx: x * spriteWidth,
			sy: y * spriteHeight,
			sw: spriteWidth,
			sh: spriteHeight
		});

		return { image, getSprite };
	}

	resize(width: number, height: number): void {
		this.canvas.width = width;
		this.canvas.height = height;
	}

	// update () {
	// 	player.update();
	// }

	// render () {
	// 	player.render(this.context)
	// }

	// tick () {
	// 	this.update();
	// 	this.render();

	// 	requestAnimationFrame(this.tick);
	// }
}
