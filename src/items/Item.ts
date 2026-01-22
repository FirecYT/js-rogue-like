import Entity from "../entities/Entity";

export interface Item {
	id: string;
	name: string;
	type: 'weapon' | 'modifier' | 'chip';
	onEquip?(entity: Entity): void;
	onUnequip?(entity: Entity): void;
}
