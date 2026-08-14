import Entity from '../entities/Entity';

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
	abstract update(entity: Entity) : void;
}
