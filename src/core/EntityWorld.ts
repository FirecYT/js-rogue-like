import type Entity from '../entities/Entity';

/**
 * Контейнер игровых сущностей: единственный владелец коллекции сущностей.
 * Добавление и удаление выполняется только через этот класс — системы больше
 * не мутируют общий массив напрямую, а получают read-only представление.
 */
export class EntityWorld {
	private readonly items: Entity[] = [];

	/**
	 * Добавляет сущность в мир.
	 * @param entity - Сущность для добавления
	 */
	spawn(entity: Entity): void {
		this.items.push(entity);
	}

	/**
	 * Немедленно удаляет сущность из мира.
	 * @param entity - Сущность для удаления
	 */
	remove(entity: Entity): void {
		const index = this.items.indexOf(entity);
		if (index !== -1) {
			this.items.splice(index, 1);
		}
	}

	/**
	 * Все сущности мира (read-only представление для итерации).
	 */
	get all(): readonly Entity[] {
		return this.items;
	}

	/**
	 * Количество сущностей в мире.
	 */
	get count(): number {
		return this.items.length;
	}

	/**
	 * Удаляет все мёртвые сущности, кроме защищённых предикатом
	 * (управляемая сущность, persistent-сущности).
	 * @param isProtected - Предикат защиты от удаления
	 */
	cleanupDead(isProtected: (entity: Entity) => boolean): void {
		for (let i = this.items.length - 1; i >= 0; i--) {
			const entity = this.items[i];
			if (!isProtected(entity) && entity.isDead()) {
				this.items.splice(i, 1);
			}
		}
	}

	/**
	 * Удаляет все сущности (сброс уровня/сеанса).
	 */
	clear(): void {
		this.items.length = 0;
	}
}
