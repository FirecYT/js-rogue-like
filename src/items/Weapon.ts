import Entity from '../entities/Entity';
import { EffectSystem } from '../systems/EffectSystem';

export interface Weapon {
	id: string;
	name: string;
	type: 'weapon';
	fireRate: number;
	damage: number;
	projectileCount: number;
	modifiersSlots: number;

	fire(source: Entity, angle: number, effectSystem: EffectSystem): void;
	onEquip?(entity: Entity): void;
}
