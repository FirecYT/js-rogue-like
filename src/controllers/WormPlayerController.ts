import type { IController } from './Controller';
import type Entity from '../entities/Entity';
import type { WorldService } from '../services/WorldService';
import type MouseInput from '../components/MouseInput';
import type { InputMapper } from '../input/InputMapper';
import { InputAction } from '../input/InputAction';
import { handleChipInputs } from './ChipUsage';

/** Скорость поворота корпуса, радиан за кадр. */
const TURN_RATE = 0.05;
/** Доля скорости при движении задом. */
const REVERSE_FACTOR = 0.5;

/**
 * Танковая схема управления червём: W — вперёд по курсу, S — задом,
 * A/D — поворот корпуса. Стрельба ЛКМ — вдоль курса.
 * Контроллер создаётся при переходе управления на червя
 * (ControlSwitchService/перерождение) и наследует курс от ИИ-головы.
 */
export class WormPlayerController implements IController {
	/** Маркер схемы управления (для отладки и тестов). */
	public readonly scheme = 'tank';

	/**
	 * @param input - Маппер действий
	 * @param mouse - Состояние мыши (стрельба)
	 * @param heading - Начальный курс (наследуется от ИИ-головы)
	 */
	constructor(
		private readonly input: InputMapper,
		private readonly mouse: MouseInput,
		public heading = 0
	) {}

	/**
	 * Поворот, движение по курсу и стрельба вдоль курса.
	 * @param entity - Голова червя под управлением игрока
	 * @param world - Сервис мира для коллизий
	 */
	update(entity: Entity, world: WorldService): void {
		if (this.input.isDown(InputAction.MoveLeft)) this.heading -= TURN_RATE;
		if (this.input.isDown(InputAction.MoveRight)) this.heading += TURN_RATE;

		let throttle = 0;
		if (this.input.isDown(InputAction.MoveUp)) throttle = 1;
		else if (this.input.isDown(InputAction.MoveDown)) {
			throttle = -REVERSE_FACTOR;
		}

		if (throttle !== 0) {
			const nx = Math.cos(this.heading) * entity.speed * throttle;
			const ny = Math.sin(this.heading) * entity.speed * throttle;
			const newPos = world.tryMove(
				entity.x,
				entity.y,
				nx,
				ny,
				entity.width,
				entity.height
			);
			entity.x = newPos.x;
			entity.y = newPos.y;
		}

		handleChipInputs(entity, this.input);

		if (this.mouse.pressed && entity.inventory.weapon) {
			if (entity.inventory.isWeaponReady()) {
				entity.inventory.fire(this.heading);
			}
		}
	}
}
