import Cooldown from "../../components/Cooldown";
import Entity from "../../entities/Entity";
import { Chip } from "../Chip";

export const DashChip: Chip = {
	id: 'dash',
	name: 'Dash',
	type: 'chip',
	isActive: true,
	cooldown: new Cooldown(30), // 30 frames cooldown (0.5 seconds at 60fps)
	
	onUpdate(entity: Entity) {
		// Check if dash is currently active by looking at the chip's own cooldown
		if (this.cooldown && !this.cooldown.isReady()) {
			// Increase speed while dash is active
			entity.speed = 6; // Fast dash speed
		} else {
			// Reset to normal speed if not dashing
			entity.speed = 2; // Normal speed
		}
	},
	
	use(entity: Entity) {
		// The dash cooldown is handled by the chip's own cooldown
		// Just start the cooldown which will be handled by onUpdate
		this.cooldown?.start();
	}
};