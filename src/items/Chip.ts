import Entity from '../entities/Entity';
import { Item } from './Item';

export interface Chip extends Item {
	type: 'chip';
	isActive: boolean;
	use?(entity: Entity): void;
	onUpdate?(entity: Entity): void
}

export function isChip(item: Item): item is Chip {
	return item.type === 'chip';
}
