import Cooldown from '../../components/Cooldown';
import type Entity from '../../entities/Entity';
import { Chip } from '../Chip';

/** Объём восстановления ремкомплекта. */
const HEAL_AMOUNT = 300;

/**
 * Чип «Ремкомплект»: мгновенно восстанавливает 300 HP носителю.
 * Долгая перезарядка — плата за то, что смерть откладывается.
 */
export class HealChip implements Chip {
	id = 'heal';
	name = 'Repair Kit';
	type = 'chip' as const;
	isActive = true;
	cooldown = new Cooldown(900);

	/**
	 * Восстанавливает HP сущности.
	 * @param entity - Носитель чипа
	 */
	use(entity: Entity): void {
		entity.heal(HEAL_AMOUNT);
	}
}
