import { Weapon } from '../Weapon';
import Entity from '../../entities/Entity';
import { EffectSystem } from '../../systems/EffectSystem';
import { FireZone } from '../../effects/FireZone';

export class Flamethrower implements Weapon {
    id = 'flamethrower';
    name = 'Flamethrower';
    type = 'weapon' as const;
    fireRate = 10;
    damage = 1;
    projectileCount = 1;
    modifiersSlots = 1;

    fire(source: Entity, angle: number, effectSystem: EffectSystem): void {
        const fire = new FireZone(source.x, source.y, angle, source);
        effectSystem.addEffect(fire);
    }

    onEquip?(entity: Entity): void {
        const fireCd = entity.cooldowns.get('fire');
        if (fireCd) {
            fireCd.setDuration(this.fireRate);
        }
    }
}
