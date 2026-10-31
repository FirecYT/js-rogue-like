import { IController } from './Controller';
import MouseInput from '../components/MouseInput';
import Entity from '../entities/Entity';
import { InputAction } from '../input/InputAction';
import { InputMapper } from '../input/InputMapper';
import { WorldService } from '../services/WorldService';

/**
 * Контроллер игрока по клавиатуре через InputMapper
 */
export class PlayerController implements IController {
	/**
	 * @param mouse - Состояние мыши для прицеливания и стрельбы.
	 * @param input - Маппер действий для абстрагирования от конкретных клавиш.
	 */
	constructor(
		private mouse: MouseInput,
		private input: InputMapper
	) { }

	update(entity: Entity, world: WorldService): void {
		this.handleMovement(entity, world);
		this.handleDash(entity);
		this.handleChips(entity);
		this.handleShooting(entity);
	}

	/**
	 * Движение WASD/стрелки с нормализацией диагонали и коллизиями через WorldService.
	 */
	private handleMovement(entity: Entity, world: WorldService): void {
		let dx = 0;
		let dy = 0;

		if (this.input.isDown(InputAction.MoveLeft)) dx -= entity.speed;
		if (this.input.isDown(InputAction.MoveRight)) dx += entity.speed;
		if (this.input.isDown(InputAction.MoveUp)) dy -= entity.speed;
		if (this.input.isDown(InputAction.MoveDown)) dy += entity.speed;

		// Нормализация диагонали, чтобы скорость была одинаковой во всех направлениях
		if (dx !== 0 && dy !== 0) {
			const inv = 1 / Math.SQRT2;
			dx *= inv;
			dy *= inv;
		}

		// Коллизия: tryMove проверяет каждую ось отдельно (скольжение вдоль стен)
		const newPos = world.tryMove(
			entity.x,
			entity.y,
			dx,
			dy,
			entity.width,
			entity.height
		);
		entity.x = newPos.x;
		entity.y = newPos.y;
	}

	/**
	 * Рывок (Dash): использование чипа 'dash' по Shift.
	 */
	private handleDash(entity: Entity): void {
		if (!this.input.isDown(InputAction.Dash)) return;
		const dashIdx = entity.inventory.chips.findIndex(
			(c) => c?.id === 'dash'
		);
		if (dashIdx !== -1 && entity.inventory.isChipReady(dashIdx)) {
			entity.inventory.useChip(dashIdx);
		}
	}

	/**
	 * Использование чипов по клавишам 1-5/Q.
	 */
	private handleChips(entity: Entity): void {
		const chipActions = [
			InputAction.Chip1,
			InputAction.Chip2,
			InputAction.Chip3,
			InputAction.Chip4,
			InputAction.Chip5,
		];
		for (let i = 0; i < chipActions.length; i++) {
			if (this.input.isPressed(chipActions[i]) && entity.inventory.chips[i]) {
				entity.inventory.useChip(i);
			}
		}
	}

	/**
	 * Стрельба по ЛКМ: вычисляет угол к курсору и вызывает fire на инвентаре.
	 * Оружие само эмитит событие weaponFired через EventBus.
	 */
	private handleShooting(entity: Entity): void {
		if (!this.mouse.pressed || !entity.inventory.weapon) return;
		if (!entity.inventory.isWeaponReady()) return;

		// mouse.cx/cy — смещение от центра канваса, entity — в мировых координатах
		const targetX = entity.x + this.mouse.cx;
		const targetY = entity.y + this.mouse.cy;
		const angle = Math.atan2(
			targetY - entity.y,
			targetX - entity.x
		);
		entity.inventory.fire(angle);
	}
}
