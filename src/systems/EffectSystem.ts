import { Effect } from '../effects/Effect';
import Entity from '../entities/Entity';
import { WorldManager } from '../world/WorldManager';

/**
 * Система эффектов: хранение, обновление и отрисовка активных эффектов.
 */
export class EffectSystem {
	private effects: Effect[] = [];
	private worldManager: WorldManager | null = null;

	/**
	 * @param worldManager - Менеджер мира (опционально, для передачи в update эффектов)
	 */
	constructor(worldManager?: WorldManager) {
		this.worldManager = worldManager ?? null;
	}

	/**
	 * Устанавливает менеджер мира.
	 * @param worldManager - WorldManager
	 */
	setWorldManager(worldManager: WorldManager): void {
		this.worldManager = worldManager;
	}

	/**
	 * Добавляет эффект в список.
	 * @param effect - Эффект
	 */
	addEffect(effect: Effect): void {
		this.effects.push(effect);
	}

	/**
	 * Обновляет все эффекты и удаляет мёртвые.
	 * @param entities - Список сущностей для передачи в update
	 */
	update(entities: Entity[]): void {
		for (let i = this.effects.length - 1; i >= 0; i--) {
			this.effects[i].update(entities, this.worldManager);
			if (this.effects[i].isDead()) {
				this.effects.splice(i, 1);
			}
		}
	}

	/**
	 * Отрисовывает все эффекты.
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		for (const effect of this.effects) {
			effect.render(ctx);
		}
	}

	/**
	 * Возвращает текущий список эффектов.
	 * @returns Массив активных эффектов
	 */
	getEffects(): Effect[] {
		return this.effects;
	}
}
