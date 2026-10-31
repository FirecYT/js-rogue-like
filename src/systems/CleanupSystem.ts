import type { ISystem } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import type { EntityWorld } from '../core/EntityWorld';
import type Entity from '../entities/Entity';

/**
 * Система очистки: удаляет мёртвые сущности из массива entities.
 * Защищает управляемую сущность (обычно игрока) и помеченные как persistent
 * (респавнящиеся) сущности от удаления.
 */
export class CleanupSystem implements ISystem {
	public readonly phase = UpdatePhase.Cleanup;
	public enabled = true;

	/**
	 * @param entities - Массив всех сущностей в игре
	 * @param getControlled - Функция для получения текущей управляемой сущности
	 */
	constructor(
		private readonly entityWorld: EntityWorld,
		private readonly getControlled: () => Entity
	) {}

	/**
	 * Удаляет все мёртвые сущности, кроме текущей управляемой и persistent-сущностей.
	 * Итерация в обратном порядке для безопасного удаления во время итерации.
	 */
	update(): void {
		const controlled = this.getControlled();
		this.entityWorld.cleanupDead(
			(entity) => entity === controlled || entity.persistent
		);
	}

	/**
	 * Освобождение ресурсов (не требуется для этой системы).
	 */
	dispose(): void {
		// Nothing to dispose
	}
}
