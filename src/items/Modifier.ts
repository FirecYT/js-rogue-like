import { Item } from './Item';
import { Weapon } from './Weapon';

export interface Modifier extends Item {
  type: 'modifier';
  applyTo(weapon: Weapon): Weapon;
}
