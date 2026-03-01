import Entity from "../entities/Entity";
import Cooldown from "../components/Cooldown";

/**
 * Базовый интерфейс предмета: id, имя, тип, перезарядка, колбэки экипировки/снятия.
 */
export interface Item {
	id: string;
	name: string;
	type: 'weapon' | 'modifier' | 'chip';
	cooldown?: Cooldown;
	onEquip?(entity: Entity): void;
	onUnequip?(entity: Entity): void;
}
