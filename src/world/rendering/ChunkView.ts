import { Chunk, TileType, CHUNK_CONFIG } from '../Types';
import Engine from '../../components/Engine';
import { WorldManager } from '../WorldManager';

/**
 * Контейнер чанка с кэшированной отрисовкой
 * Отвечает за рендеринг содержимого чанка в оффскрин-канвас
 */
export class ChunkView {
	private canvas: OffscreenCanvas;
	private ctx: OffscreenCanvasRenderingContext2D;
	private isDirty = true;
	private lastRenderedGeneration = -1;
	private rand;

	constructor(
		public chunk: Chunk,
		private worldManager: WorldManager,
		private engine: Engine
	) {
		this.rand = Math.floor(Math.random() * 1000);
		this.canvas = new OffscreenCanvas(CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE, CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE);

		const ctx = this.canvas.getContext('2d');
		if (!ctx) throw new Error('Cannot create chunk canvas context');

		this.ctx = ctx;
		this.ctx.imageSmoothingEnabled = false;
	}

	/**
	 * Пометить чанк как изменённый (требует перерисовки)
	 */
	markDirty(): void {
		this.isDirty = true;
	}

	/**
	 * Отрисовать чанк в кэш (выполняется один раз до первого использования или при изменении)
	 */
	private renderToCache(): void {
		// Проверяем, нужно ли обновлять кэш
		if (!this.isDirty && this.chunk.generation === this.lastRenderedGeneration) {
			return; // Кэш актуален
		}

		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Отрисовка всех тайлов чанка
		for (let x = 0; x < CHUNK_CONFIG.SIZE; x++) {
			for (let y = 0; y < CHUNK_CONFIG.SIZE; y++) {
				this.renderTile(x, y);
			}
		}

		this.isDirty = false;
		this.lastRenderedGeneration = this.chunk.generation;
	}

	/**
	 * Отрисовать один тайл в кэш
	 */
	private renderTile(tileX: number, tileY: number): void {
		const tileType = this.chunk.tiles[tileX][tileY];
		const worldX = tileX * CHUNK_CONFIG.TILE_SIZE;
		const worldY = tileY * CHUNK_CONFIG.TILE_SIZE;

		let image = "";
		let seed = tileX;
		for (let i = 0; i < tileY; i++) {
			seed = (seed * 73129 + 95121) % 12345;
		}

		switch (tileType) {
			case TileType.EMPTY:
				image = `images/floor_${seed % 4 + 3}.png`;
				this.ctx.fillStyle = '#333';
				break;
			case TileType.WALL: {
				const wallIndex = this.worldManager.getWallTextureIndex(this.chunk, tileX, tileY, TileType.WALL);

				const spriteX = (wallIndex % 4) * (CHUNK_CONFIG.TILE_SIZE + 1);
				const spriteY = Math.floor(wallIndex / 4) * (CHUNK_CONFIG.TILE_SIZE + 1);

				const wallsImg = this.engine.getImage('images/walls.png');

				if (wallsImg) {
					this.ctx.drawImage(
						wallsImg,
						spriteX, spriteY, CHUNK_CONFIG.TILE_SIZE, CHUNK_CONFIG.TILE_SIZE,
						worldX, worldY,
						CHUNK_CONFIG.TILE_SIZE, CHUNK_CONFIG.TILE_SIZE
					);
				}

				return;
			}
			case TileType.ROCK:
				image = `images/trash_${(tileX + tileY) % 3}.png`;
				this.ctx.fillStyle = '#333';
				break;
			case TileType.BUILDING:
				image = `images/floor_${seed % 3}.png`;
				this.ctx.fillStyle = '#333';
				break;
			case TileType.WATER:
				this.ctx.fillStyle = '#369';
				break;
			default:
				this.ctx.fillStyle = '#F0F';
		}

		// Заполняем фон тайла, если не стена
		this.ctx.fillRect(worldX, worldY, CHUNK_CONFIG.TILE_SIZE, CHUNK_CONFIG.TILE_SIZE);

		// Отрисовываем текстуру поверх фона
		if (image) {
			const img = this.engine.getImage(image);
			if (img) {
				this.ctx.drawImage(img, worldX, worldY, CHUNK_CONFIG.TILE_SIZE, CHUNK_CONFIG.TILE_SIZE);
			}
		}
	}


	/**
	 * Отрисовать кэшированный чанк на основной канвас
	 * @param targetCtx Контекст основного канваса
	 * @param screenX Позиция на экране по X
	 * @param screenY Позиция на экране по Y
	 */
	draw(targetCtx: CanvasRenderingContext2D, screenX: number, screenY: number): void {
		this.renderToCache();

		targetCtx.drawImage(
			this.canvas,
			0, 0, this.canvas.width, this.canvas.height,
			screenX, screenY, this.canvas.width, this.canvas.height
		);

		targetCtx.strokeStyle = '#F0F4';
		targetCtx.strokeRect(screenX, screenY, this.canvas.width, this.canvas.height);
	}

	/**
	 * Освободить ресурсы (при выгрузке чанка)
	 */
	dispose(): void {
		// Canvas автоматически очищается при удалении ссылки
		// Можно добавить дополнительную очистку, если нужно
	}

	/**
	 * Получить номер поколения, при котором был сделан последний рендер
	 */
	getLastRenderedGeneration(): number {
		return this.lastRenderedGeneration;
	}
}
