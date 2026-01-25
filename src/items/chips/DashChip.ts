import Cooldown from "../../components/Cooldown";
import Entity from "../../entities/Entity";
import { Chip } from "../Chip";

export class DashChip implements Chip {
	id = 'dash';
	name = 'Dash';
	type = 'chip' as const;
	isActive = true;
	cooldown = new Cooldown(60);
	public activeCooldown = new Cooldown(30);

	onUpdate(entity: Entity) {
		if (!this.activeCooldown.isReady()) {
			entity.speed = 6;
		} else {
			entity.speed = 2;
		}

		this.activeCooldown.update();
	}

	use(entity: Entity) {
		void entity;
		this.cooldown?.start();
		this.activeCooldown.start();
	}
}
