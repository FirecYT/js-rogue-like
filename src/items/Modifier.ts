import { Effect } from '../effects/Effect';
import { Item } from './Item';

export interface Modifier extends Item {
	type: 'modifier';
	apply(base: Effect): Effect;
}

export function isModifier(item: Item): item is Modifier {
	return item.type === 'modifier';
}
