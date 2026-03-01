import { Chip } from '../Chip';

/**
 * Чип «Перерождение»: при смерти носителя управление передаётся ближайшей союзной сущности с этим чипом (логика в RebirthSystem).
 */
export class RebirthChip implements Chip {
	id = 'rebirth';
	name = 'Перерождение';
	type = 'chip' as const;
	isActive = false;
}
