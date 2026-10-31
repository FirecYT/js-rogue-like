import type Entity from '../entities/Entity';
import type { InputMapper } from '../input/InputMapper';
import { InputAction } from '../input/InputAction';

/**
 * Общая обработка чипов для всех контроллеров игрока: рывок (Shift)
 * и активные чипы по клавишам 1-5/Q. Вынесено из контроллеров, чтобы
 * схемы управления (top-down, танковая) не дублировали логику чипов.
 * @param entity - Управляемая сущность
 * @param input - Маппер действий
 */
export function handleChipInputs(entity: Entity, input: InputMapper): void {
	if (input.isDown(InputAction.Dash)) {
		const dashIdx = entity.inventory.chips.findIndex(
			(c) => c?.id === 'dash'
		);
		if (dashIdx !== -1 && entity.inventory.isChipReady(dashIdx)) {
			entity.inventory.useChip(dashIdx);
		}
	}

	const chipActions = [
		InputAction.Chip1,
		InputAction.Chip2,
		InputAction.Chip3,
		InputAction.Chip4,
		InputAction.Chip5,
	];
	for (let i = 0; i < chipActions.length; i++) {
		if (input.isPressed(chipActions[i]) && entity.inventory.chips[i]) {
			entity.inventory.useChip(i);
		}
	}
}
