import { Effect } from '../effects/Effect';
import { Item } from './Item';

export interface Modifier extends Item {
	type: 'modifier';
	apply(base: Effect): Effect;
}
