import Engine from '../../components/Engine';
import { WorldManager } from '../WorldManager';
import { ChunkView } from './ChunkView';

/**
 * Менеджер визуальных представлений чанков (ChunkView)
 * Отвечает за создание, обновление и кэширование отрисовки чанков
 */
export class ChunkViewManager {
	private views = new Map<string, ChunkView>();

	constructor(
		private worldManager: WorldManager,
		private engine: Engine
	) { }

	/**
	 * Возвращает или создаёт ChunkView для чанка; при отсутствии чанка выгружает вью и возвращает null.
	 * @param chunkX - X чанка
	 * @param chunkY - Y чанка
	 * @param scale - Масштаб (для выбора LOD и проверки поколения)
	 * @returns ChunkView или null
	 */
	getView(chunkX: number, chunkY: number, scale: number): ChunkView | null {
		const key = `${chunkX},${chunkY}`;
		const chunk = this.worldManager.getChunk(chunkX, chunkY);

		if (!chunk) {
			if (this.views.has(key)) {
				this.unloadView(chunkX, chunkY);
			}
			return null;
		}

		let view = this.views.get(key);

		if (!view) {
			view = new ChunkView(chunk, this.worldManager, this.engine);
			this.views.set(key, view);
		} else if (chunk.generation !== view.getLastRenderedGeneration(view.getLODForScale(scale))) {
			view.markDirty();
		}

		return view;
	}

	/**
	 * Выгружает вью чанка (dispose и удаление из кэша).
	 * @param chunkX - X чанка
	 * @param chunkY - Y чанка
	 */
	unloadView(chunkX: number, chunkY: number): void {
		const key = `${chunkX},${chunkY}`;
		const view = this.views.get(key);
		if (view) {
			view.dispose();
			this.views.delete(key);
		}
	}

	/**
	 * Очищает все вью и освобождает ресурсы.
	 */
	clearAll(): void {
		for (const view of this.views.values()) {
			view.dispose();
		}
		this.views.clear();
	}

	/**
	 * Возвращает все активные ChunkView.
	 * @returns Массив вью
	 */
	getAllViews(): ChunkView[] {
		return Array.from(this.views.values());
	}
}
