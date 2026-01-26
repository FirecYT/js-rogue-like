import Entity from '../entities/Entity';
import { EffectSystem } from '../systems/EffectSystem';
import { WorldManager } from '../world/WorldManager';

export abstract class Controller {
	abstract update(entity: Entity, world: WorldManager, effectSystem: EffectSystem): void;
}
