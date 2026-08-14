import { Controller } from './Controller';
import MouseInput from '../components/MouseInput';
import Entity from '../entities/Entity';
import { InputAction } from '../input/InputAction';
import { InputMapper } from '../input/InputMapper';

/**
 * Контроллер игрока: WASD, прицеливание мышью, стрельба по ЛКМ, чипы по Q/1-5, даш по Shift.
 */
export class PlayerController extends Controller {
	/**
	 * @param mouse - Состояние мыши (для прицела и нажатия)
	 */
	constructor(private mouse: MouseInput, private input: InputMapper) {
		super();
	}

	/**
	 * Движение с проверкой проходимости, стрельба по нажатию мыши, использование чипов по клавишам.
	 * @param entity - Игрок
	 * @param world - Мир
	 * @param effectSystem - Система эффектов
	 */
	update(
		entity: Entity
		// world: WorldManager,
		// effectSystem: EffectSystem
	): void {
		const speed = entity.speed;
		// const originalX = entity.x;
		// const originalY = entity.y;

		if (this.input.isDown(InputAction.MoveLeft)) {
			entity.x -= speed;
			// if (!world.isWorldPositionPassable(entity.x, entity.y))
			// 	entity.x = originalX;
		}
		if (this.input.isDown(InputAction.MoveRight)) {
			entity.x += speed;
			// if (!world.isWorldPositionPassable(entity.x, entity.y))
			// 	entity.x = originalX;
		}
		if (this.input.isDown(InputAction.MoveUp)) {
			entity.y -= speed;
			// if (!world.isWorldPositionPassable(entity.x, entity.y))
			// 	entity.y = originalY;
		}
		if (this.input.isDown(InputAction.MoveDown)) {
			entity.y += speed;
			// if (!world.isWorldPositionPassable(entity.x, entity.y))
			// 	entity.y = originalY;
		}

		if (this.input.isDown(InputAction.Dash)) {
			const dashChipIndex = entity.inventory.chips.findIndex(
				(chip) => chip?.id === 'dash'
			);
			if (
				dashChipIndex !== -1 &&
				entity.inventory.isChipReady(dashChipIndex)
			) {
				entity.inventory.useChip(dashChipIndex);
			}
		}

		// if (entity.inventory.weapon) {
		// 	const mouseWorldX = entity.x + this.mouse.cx;
		// 	const mouseWorldY = entity.y + this.mouse.cy;
		// 	const angle = getAngleBetweenPoints(
		// 		entity.x,
		// 		entity.y,
		// 		mouseWorldX,
		// 		mouseWorldY
		// 	);
		// 	if (this.mouse.pressed && entity.inventory.isWeaponReady()) {
		// 		entity.inventory.fire(angle, effectSystem);
		// 	}
		// }

		if (
			this.input.isPressed(InputAction.Chip1) &&
			entity.inventory.chips[0]
		) {
			entity.inventory.useChip(0);
		} else if (
			this.input.isPressed(InputAction.Chip2) &&
			entity.inventory.chips[1]
		) {
			entity.inventory.useChip(1);
		} else if (
			this.input.isPressed(InputAction.Chip3) &&
			entity.inventory.chips[2]
		) {
			entity.inventory.useChip(2);
		} else if (
			this.input.isPressed(InputAction.Chip4) &&
			entity.inventory.chips[3]
		) {
			entity.inventory.useChip(3);
		} else if (
			this.input.isPressed(InputAction.Chip5) &&
			entity.inventory.chips[4]
		) {
			entity.inventory.useChip(4);
		}
	}
}
