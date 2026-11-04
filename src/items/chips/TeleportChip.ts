import Cooldown from '../../components/Cooldown';
import Entity from '../../entities/Entity';
import { Chip } from '../Chip';

/**
 * Чип «Квантовый прыжок»: телепортация в случайном направлении на 100 единиц.
 */
export class TeleportChip implements Chip {
	id = 'teleport';
	name = 'Quantum Leap';
	type = 'chip' as const;
	isActive = true;
	cooldown = new Cooldown(120);
	/** Дальность прыжка в пикселях (настраивается админ-панелью полигона). */
	public distance = 100;

	/**
	 * Телепортирует сущность на 100 единиц в случайном направлении.
	 * @param entity - Сущность
	 */
	use(entity: Entity): void {
		const angle = Math.random() * Math.PI * 2;
		entity.x += Math.cos(angle) * this.distance;
		entity.y += Math.sin(angle) * this.distance;
	}
}
