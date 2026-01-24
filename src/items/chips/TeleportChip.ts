import Cooldown from "../../components/Cooldown";
import Entity from "../../entities/Entity";
import { Chip } from "../Chip";

export const TeleportChip: Chip = {
	id: 'teleport',
	name: 'Quantum Leap',
	type: 'chip',
	isActive: true,
	cooldown: new Cooldown(120), // 120 frames cooldown
	use(entity: Entity) {
		const angle = Math.random() * Math.PI * 2;
		entity.x += Math.cos(angle) * 100;
		entity.y += Math.sin(angle) * 100;
	}
};
