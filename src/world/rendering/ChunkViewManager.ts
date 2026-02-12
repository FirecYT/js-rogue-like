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
	 * Получить или создать визуальное представление для чанка
	 * @param chunkX Координата чанка X
	 * @param chunkY Координата чанка Y
	 * @returns ChunkView или null, если чанк не существует
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
	 * Уведомление о выгрузке чанка (например, при выходе за пределы видимости)
	 * @param chunkX Координата чанка X
	 * @param chunkY Координата чанка Y
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
	 * Полная очистка всех вьюшек (например, при смене уровня)
	 */
	clearAll(): void {
		for (const view of this.views.values()) {
			view.dispose();
		}
		this.views.clear();
	}

	/**
	 * Получить все активные вьюшки (например, для отладки или принудительного рендеринга)
	 */
	getAllViews(): ChunkView[] {
		return Array.from(this.views.values());
	}
}
