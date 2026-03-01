import Cooldown from "../../components/Cooldown";
import Entity from "../../entities/Entity";
import { Chip } from "../Chip";

/**
 * Чип «Квантовый прыжок»: телепортация в случайном направлении на 100 единиц.
 */
export class TeleportChip implements Chip {
	id = 'teleport';
	name = 'Quantum Leap';
	type = 'chip' as const;
	isActive = true;
	cooldown = new Cooldown(120);

	/**
	 * Телепортирует сущность на 100 единиц в случайном направлении.
	 * @param entity - Сущность
	 */
	use(entity: Entity): void {
		const angle = Math.random() * Math.PI * 2;
		entity.x += Math.cos(angle) * 100;
		entity.y += Math.sin(angle) * 100;
	}
}
