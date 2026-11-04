import Cooldown from '../../components/Cooldown';
import type Entity from '../../entities/Entity';
import { Chip } from '../Chip';
import { eventBus } from '../../events/EventBus';

/** Урон импульсной волны. */
const NOVA_DAMAGE = 40;
/** Радиус импульсной волны. */
const NOVA_RADIUS = 140;

/**
 * Чип «Импульс»: круговая волна вокруг носителя, отбрасывающая урон
 * всем враждебным сущностям поблизости. Реализован как запрос эффекта
 * через шину событий (снаряд 'explosion' материализует EffectSystem).
 */
export class NovaChip implements Chip {
	id = 'nova';
	name = 'Impulse';
	type = 'chip' as const;
	isActive = true;
	cooldown = new Cooldown(480);

	/**
	 * Создаёт импульсную волну с центром в носителе.
	 * @param entity - Носитель чипа
	 */
	use(entity: Entity): void {
		eventBus.emit('weaponFired', {
			source: entity,
			specs: [
				{
					projectileId: 'explosion',
					angle: 0,
					damage: NOVA_DAMAGE,
					pierce: false,
					wave: null,
					explodeOnHit: false,
					destruct: false,
					homing: false,
					radius: NOVA_RADIUS,
				},
			],
		});
	}
}
