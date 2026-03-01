import Entity from '../entities/Entity';
import { EffectSystem } from '../systems/EffectSystem';
import { WorldManager } from '../world/WorldManager';

/**
 * Базовый класс контроллера: обновление сущности (движение, стрельба и т.д.) каждый кадр.
 */
export abstract class Controller {
	/**
	 * Вызывается каждый кадр для управляемой сущности.
	 * @param entity - Управляемая сущность
	 * @param world - Менеджер мира (коллизии, путь)
	 * @param effectSystem - Система эффектов (для выстрелов)
	 */
	abstract update(entity: Entity, world: WorldManager, effectSystem: EffectSystem): void;
}
