import Cooldown from "../../components/Cooldown";
import Entity from "../../entities/Entity";
import { Chip } from "../Chip";

export class TeleportChip implements Chip {
	id = 'teleport';
	name = 'Quantum Leap';
	type = 'chip' as const;
	isActive = true;
	cooldown = new Cooldown(120);
	use(entity: Entity) {
		const angle = Math.random() * Math.PI * 2;
		entity.x += Math.cos(angle) * 100;
		entity.y += Math.sin(angle) * 100;
	}
}
