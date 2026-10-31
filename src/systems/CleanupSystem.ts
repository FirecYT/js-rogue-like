import type { ISystem } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import type Entity from '../entities/Entity';
import { TrainingDummy } from '../entities/TrainingDummy';

/**
 * Система очистки: удаляет мёртвые сущности из массива entities.
 * Защищает управляемую сущность (обычно игрока) и респавнящиеся сущности (манекены) от удаления.
 */
export class CleanupSystem implements ISystem {
	public readonly phase = UpdatePhase.Cleanup;
	public enabled = true;

	/**
	 * @param entities - Массив всех сущностей в игре
	 * @param getControlled - Функция для получения текущей управляемой сущности
	 */
	constructor(
		private readonly entities: Entity[],
		private readonly getControlled: () => Entity
	) {}

	/**
	 * Удаляет все мёртвые сущности, кроме текущей управляемой и респавнящихся (манекенов).
	 * Итерация в обратном порядке для безопасного удаления во время итерации.
	 */
	update(): void {
		const controlled = this.getControlled();
		for (let i = this.entities.length - 1; i >= 0; i--) {
			const entity = this.entities[i];
			// Пропускаем управляемую сущность и респавнящиеся (манекены)
			if (entity === controlled) continue;
			if (entity instanceof TrainingDummy) continue;

			if (entity.isDead()) {
				this.entities.splice(i, 1);
			}
		}
	}

	/**
	 * Освобождение ресурсов (не требуется для этой системы).
	 */
	dispose(): void {
		// Nothing to dispose
	}
}
