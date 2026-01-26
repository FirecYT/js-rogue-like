import { Chip } from '../Chip';

export class RebirthChip implements Chip {
	id = 'rebirth';
	name = 'Перерождение';
	type = 'chip' as const;
	isActive = false;
}
