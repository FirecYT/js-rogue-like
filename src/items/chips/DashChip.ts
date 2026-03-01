import Cooldown from "../../components/Cooldown";
import Entity from "../../entities/Entity";
import { Chip } from "../Chip";

/**
 * Чип «Рывок»: при использовании временно увеличивает скорость; onUpdate поддерживает активную фазу.
 */
export class DashChip implements Chip {
	id = 'dash';
	name = 'Dash';
	type = 'chip' as const;
	isActive = true;
	cooldown = new Cooldown(60);
	public activeCooldown = new Cooldown(30);

	/**
	 * В активной фазе (пока activeCooldown не готов) устанавливает entity.speed = 6, иначе 2.
	 * @param entity - Сущность
	 */
	onUpdate(entity: Entity): void {
		if (!this.activeCooldown.isReady()) {
			entity.speed = 6;
		} else {
			entity.speed = 2;
		}
		this.activeCooldown.update();
	}

	/**
	 * Запускает перезарядку и активную фазу рывка.
	 * @param entity - Сущность (не используется)
	 */
	use(entity: Entity): void {
		void entity;
		this.cooldown?.start();
		this.activeCooldown.start();
	}
}
