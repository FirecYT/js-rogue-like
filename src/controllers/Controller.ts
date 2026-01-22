import { EffectSystem } from '../systems/EffectSystem';
import { WorldManager } from '../world/WorldManager';

export abstract class Controller<T = unknown> {
	abstract update(entity: T, world: WorldManager, effectSystem: EffectSystem): void;
}
