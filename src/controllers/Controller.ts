import Entity from '../entities/Entity';
import type { WorldService } from '../services/WorldService';

/**
 * Интерфейс контроллера: обновление поведения сущности с доступом к сервисам мира.
 * Использование интерфейса (а не абстрактного класса) позволяет реализовывать
 * множественные стратегии без наследования.
 */
export interface IController {
	/**
	 * Вызывается каждый кадр для управляемой сущности.
	 * @param entity - Сущность, которой управляет контроллер
	 * @param world - Сервис мира для проверки коллизий, видимости и т.д.
	 */
	update(entity: Entity, world: WorldService): void;
}
