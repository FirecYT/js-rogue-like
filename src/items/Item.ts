import Entity from "../entities/Entity";
import Cooldown from "../components/Cooldown";

export interface Item {
	id: string;
	name: string;
	type: 'weapon' | 'modifier' | 'chip';
	cooldown?: Cooldown;
	onEquip?(entity: Entity): void;
	onUnequip?(entity: Entity): void;
}
