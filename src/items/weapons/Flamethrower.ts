import { Weapon } from '../Weapon';
import Entity from '../../entities/Entity';
import { EffectSystem } from '../../systems/EffectSystem';
import { FireZone } from '../../effects/FireZone';
import { EffectFactory } from '../../systems/EffectFactory';

export class Flamethrower extends Weapon {
    id = 'flamethrower';
    name = 'Flamethrower';
    type = 'weapon' as const;
    fireRate = 10;
    damage = 1;
    projectileCount = 1;
    modifiersSlots = 1;

    fire(source: Entity, angle: number, effectSystem: EffectSystem): void {
        const base = new FireZone(source.x, source.y, angle, source);
		const finalEffect = EffectFactory.create(base, source.inventory.modifiers, effectSystem);
        effectSystem.addEffect(finalEffect);
    }

    onEquip?(entity: Entity): void {
        if (entity.inventory.weapon && entity.inventory.weapon.cooldown) {
            entity.inventory.weapon.cooldown.setDuration(this.fireRate);
        }
    }
}
