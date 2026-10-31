import type { ISystem } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import type Entity from '../entities/Entity';
import type { WorldService } from '../services/WorldService';
import { isControllable } from '../types/EntityTraits';

/**
 * Система движения: обновляет контроллеры всех управляемых сущностей и их инвентари.
 * Следует SRP: отвечает только за обновление поведения, не за коллизии или эффекты.
 */
export class MovementSystem implements ISystem {
	public readonly phase = UpdatePhase.Movement;
	public enabled = true;

	/**
	 * @param entities - Массив всех сущностей в игре
	 * @param world - Сервис мира для передачи в контроллеры
	 */
	constructor(
		private readonly entities: Entity[],
		private readonly world: WorldService
	) {}

	/**
	 * Обновляет все управляемые сущности и их инвентари.
	 * Пропускает мёртвые сущности.
	 */
	update(): void {
		for (const entity of this.entities) {
			if (entity.isDead()) continue;

			// Обновляем контроллер, если сущность управляема
			if (isControllable(entity) && entity.controller) {
				entity.controller.update(entity, this.world);
			}

			// Обновляем инвентарь (перезарядки оружия и чипов)
			entity.inventory.update();

			// Обновляем кастомную логику сущности (например, респавн манекена)
			entity.update();
		}
	}

	/**
	 * Освобождение ресурсов (не требуется для этой системы).
	 */
	dispose(): void {
		// Nothing to dispose
	}
}
