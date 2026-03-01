import { Chunk, TileType, CHUNK_CONFIG } from '../Types';
import Engine from '../../components/Engine';
import { WorldManager } from '../WorldManager';

/**
 * Контейнер чанка с кэшированной отрисовкой и поддержкой LOD (уровней детализации).
 */
export class ChunkView {
	private static readonly MAX_LOD_LEVELS = 5;

	private canvases = new Map<number, OffscreenCanvas>();
	private contexts = new Map<number, OffscreenCanvasRenderingContext2D>();
	private isDirty: boolean[] = [];
	private lastRenderedGeneration: number[] = [];

	constructor(
		public chunk: Chunk,
		private worldManager: WorldManager,
		private engine: Engine
	) {
		this.initializeCanvases();
	}

	/**
	 * Инициализирует оффскрин-канвасы для каждого уровня LOD.
	 */
	private initializeCanvases(): void {
		for (let lod = 0; lod < ChunkView.MAX_LOD_LEVELS; lod++) {
			const size = CHUNK_CONFIG.FULL_SIZE / Math.pow(2, lod);
			const canvas = new OffscreenCanvas(size, size);
			const ctx = canvas.getContext('2d');

			if (!ctx) throw new Error('Cannot create chunk canvas context');

			ctx.imageSmoothingEnabled = false;
			this.canvases.set(lod, canvas);
			this.contexts.set(lod, ctx);

			// Инициализируем состояние для каждого уровня
			this.isDirty[lod] = true;
			this.lastRenderedGeneration[lod] = -1;
		}
	}

	/**
	 * Помечает чанк как изменённый (все уровни LOD будут перерисованы при следующем draw).
	 */
	markDirty(): void {
		for (let lod = 0; lod < ChunkView.MAX_LOD_LEVELS; lod++) {
			this.isDirty[lod] = true;
		}
	}

	/**
	 * Возвращает уровень детализации (0..4) по текущему масштабу камеры.
	 * @param scale - Масштаб (0 = максимальная детализация, отрицательные = упрощение)
	 * @returns Индекс LOD
	 */
	public getLODForScale(scale: number): number {
		if (scale >= 0) return 0;
		if (scale >= -1) return 1;
		if (scale >= -2) return 2;
		if (scale >= -3) return 3;
		return 4;
	}

	/**
	 * Рисует чанк в оффскрин-канвас для указанного LOD (если кэш устарел).
	 * @param lod - Уровень детализации
	 */
	private renderToCache(lod: number): void {
		if (!this.isDirty[lod] && this.chunk.generation === this.lastRenderedGeneration[lod]) {
			return;
		}

		const ctx = this.contexts.get(lod);
		const canvas = this.canvases.get(lod);

		if (!ctx || !canvas) return;

		const tileSize = CHUNK_CONFIG.TILE_SIZE / Math.pow(2, lod);

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		for (let x = 0; x < CHUNK_CONFIG.SIZE; x++) {
			for (let y = 0; y < CHUNK_CONFIG.SIZE; y++) {
				this.renderTile(ctx, x, y, tileSize);
			}
		}

		this.isDirty[lod] = false;
		this.lastRenderedGeneration[lod] = this.chunk.generation;
	}

	/**
	 * Рисует один тайл в контекст кэша (текстуры пола, стен, камней и т.д.).
	 * @param ctx - Контекст оффскрин-канваса
	 * @param tileX - Локальная X тайла
	 * @param tileY - Локальная Y тайла
	 * @param tileSize - Размер тайла в пикселях для этого LOD
	 */
	private renderTile(
		ctx: OffscreenCanvasRenderingContext2D,
		tileX: number,
		tileY: number,
		tileSize: number
	): void {
		const tileType = this.chunk.tiles[tileX][tileY];
		const worldX = tileX * tileSize;
		const worldY = tileY * tileSize;

		let image = "";
		let seed = tileX;

		for (let i = 0; i < tileY; i++) {
			seed = (seed * 73129 + 95121) % 12345;
		}

		switch (tileType) {
			case TileType.EMPTY:
				image = `/js-rogue-like/images/floor_${seed % 4 + 3}.png`;
				ctx.fillStyle = '#333';
				break;
			case TileType.WALL: {
				const wallIndex = this.worldManager.getWallTextureIndex(this.chunk, tileX, tileY, TileType.WALL);
				const spriteX = (wallIndex % 4) * (CHUNK_CONFIG.TILE_SIZE + 1);
				const spriteY = Math.floor(wallIndex / 4) * (CHUNK_CONFIG.TILE_SIZE + 1);
				const wallsImg = this.engine.getImage('/js-rogue-like/images/walls.png');

				if (wallsImg) {
					const sourceSize = CHUNK_CONFIG.TILE_SIZE;
					ctx.drawImage(
						wallsImg,
						spriteX, spriteY, sourceSize, sourceSize,
						worldX, worldY, tileSize, tileSize
					);
				}
				return;
			}
			case TileType.ROCK:
				image = `/js-rogue-like/images/trash_${(tileX + tileY) % 3}.png`;
				ctx.fillStyle = '#333';
				break;
			case TileType.BUILDING:
				image = `/js-rogue-like/images/floor_${seed % 3}.png`;
				ctx.fillStyle = '#333';
				break;
			case TileType.WATER:
				ctx.fillStyle = '#369';
				break;
			default:
				ctx.fillStyle = '#F0F';
		}

		ctx.fillRect(worldX, worldY, tileSize, tileSize);
		if (image) {
			const img = this.engine.getImage(image);
			if (img) {
				ctx.drawImage(img, worldX, worldY, tileSize, tileSize);
			}
		}
	}

	/**
	 * Отрисовать кэшированный чанк на основной канвас
	 * @param targetCtx Контекст основного канваса
	 * @param screenX Позиция на экране по X
	 * @param screenY Позиция на экране по Y
	 * @param scale Текущий масштаб камеры
	 */
	draw(targetCtx: CanvasRenderingContext2D, screenX: number, screenY: number, scale: number): void {
		const lod = this.getLODForScale(scale);
		const canvas = this.canvases.get(lod);

		if (!canvas) return;

		this.renderToCache(lod);

		targetCtx.drawImage(
			canvas,
			0, 0, canvas.width, canvas.height,
			screenX, screenY, CHUNK_CONFIG.FULL_SIZE, CHUNK_CONFIG.FULL_SIZE
		);
	}

	/**
	 * Освобождает оффскрин-канвасы (вызывать при выгрузке чанка).
	 */
	dispose(): void {
		this.canvases.clear();
		this.contexts.clear();
	}

	/**
	 * Возвращает номер поколения чанка, при котором был последний рендер для данного LOD.
	 * @param lod - Уровень детализации (по умолчанию 0)
	 * @returns Номер поколения или -1
	 */
	getLastRenderedGeneration(lod = 0): number {
		return this.lastRenderedGeneration[lod] ?? -1;
	}
}
