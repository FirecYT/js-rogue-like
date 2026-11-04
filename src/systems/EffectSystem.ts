import type { ISystem, IRenderable } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import type { Effect } from '../effects/Effect';
import type Entity from '../entities/Entity';
import type { WorldService } from '../services/WorldService';
import type { EntityWorld } from '../core/EntityWorld';
import { eventBus } from '../events/EventBus';
import type { Unsubscribe } from '../events/EventBus';
import type { ProjectileSpec } from '../items/CastState';
import { BulletEffect } from '../effects/BulletEffect';
import { LaserBeam } from '../effects/LaserBeam';
import { FireZone } from '../effects/FireZone';
import { ExplosionEffect } from '../effects/ExplosionEffect';
import { RocketEffect } from '../effects/RocketEffect';
import { PlasmaBall } from '../effects/PlasmaBall';

/** Фабрика эффекта по спецификации снаряда. */
type SpecFactory = (source: Entity, spec: ProjectileSpec) => Effect;

/**
 * Система эффектов: управляет жизненным циклом снарядов, лучей, зон и взрывов.
 * Подписана на weaponFired и материализует готовые спецификации снарядов
 * (ProjectileSpec) в эффекты: об очереди заклинаний и модификаторах здесь
 * ничего не известно — только о том, что уже разрешено кастом.
 */
export class EffectSystem implements ISystem, IRenderable {
	public readonly phase = UpdatePhase.Effects;
	public enabled = true;

	private effects: Effect[] = [];

	/** Функция отписки от шины событий (вызывается в dispose). */
	private unsubscribe: Unsubscribe | null = null;

	/** Реестр фабрик эффектов по идентификатору снаряда. */
	private specFactories = new Map<string, SpecFactory>();

	/**
	 * @param entityWorld - Контейнер сущностей для проверки попаданий
	 * @param world - Сервис мира для проверки коллизий эффектов с тайлами
	 */
	constructor(
		private readonly entityWorld: EntityWorld,
		private readonly world: WorldService
	) {
		this.setupEventListeners();
		this.registerDefaultFactories();
	}

	/**
	 * Регистрирует фабрики стандартных снарядов.
	 */
	private registerDefaultFactories(): void {
		this.specFactories.set('bullet', (source, spec) => {
			const effect = new BulletEffect(
				source.x,
				source.y,
				spec.angle,
				source,
				spec.damage
			);
			effect.pierce = spec.pierce;
			effect.wave = spec.wave;
			effect.destruct = spec.destruct;
			effect.explodeOnHit = spec.explodeOnHit;
			effect.homing = spec.homing;
			if (spec.explodeOnHit) {
				// Взрыв при пронзании цели…
				effect.onHit = (target) => {
					this.add(
						new ExplosionEffect(target.x, target.y, source, spec.damage)
					);
				};
				// …и в конце полёта
				effect.onDeath = () => {
					this.add(
						new ExplosionEffect(effect.x, effect.y, source, spec.damage)
					);
				};
			}
			return effect;
		});

		this.specFactories.set('laser', (source, spec) => {
			return new LaserBeam(source.x, source.y, spec.angle, source, spec.damage);
		});

		this.specFactories.set('fire_zone', (source, spec) => {
			return new FireZone(source.x, source.y, spec.angle, source, spec.damage);
		});

		this.specFactories.set('plasma', (source, spec) => {
			const plasma = new PlasmaBall(
				source.x,
				source.y,
				spec.angle,
				source,
				spec.damage
			);
			plasma.pierce = spec.pierce;
			plasma.wave = spec.wave;
			plasma.destruct = spec.destruct;
			plasma.explodeOnHit = spec.explodeOnHit;
			plasma.homing = spec.homing;
			if (spec.explodeOnHit) {
				plasma.onHit = (target) => {
					this.add(
						new ExplosionEffect(target.x, target.y, source, spec.damage)
					);
				};
				plasma.onDeath = () => {
					this.add(
						new ExplosionEffect(plasma.x, plasma.y, source, spec.damage)
					);
				};
			}
			return plasma;
		});

		// Мгновенный взрыв в точке источника (импульсный чип)
		this.specFactories.set('explosion', (source, spec) => {
			return new ExplosionEffect(
				source.x,
				source.y,
				source,
				spec.damage,
				spec.radius ?? 40
			);
		});

		this.specFactories.set('rocket', (source, spec) => {
			const rocket = new RocketEffect(
				source.x,
				source.y,
				spec.angle,
				source,
				spec.damage
			);
			rocket.onDeath = () => {
				this.add(new ExplosionEffect(rocket.x, rocket.y, source, rocket.damage));
			};
			return rocket;
		});
	}

	/**
	 * Подписывается на weaponFired и материализует спецификации снарядов.
	 */
	private setupEventListeners(): void {
		this.unsubscribe = eventBus.on('weaponFired', ({ source, specs }) => {
			for (const spec of specs) {
				this.materialize(source, spec);
			}
		});
	}

	/**
	 * Создаёт эффект по спецификации; неизвестный снаряд становится обычной пулей.
	 * @param source - Сущность-источник выстрела
	 * @param spec - Спецификация снаряда
	 */
	private materialize(source: Entity, spec: ProjectileSpec): void {
		const factory =
			this.specFactories.get(spec.projectileId) ??
			this.specFactories.get('bullet');
		if (!factory) {
			console.warn(`No effect factory for projectile "${spec.projectileId}"`);
			return;
		}
		this.add(factory(source, spec));
	}

	/**
	 * Добавляет эффект в систему.
	 * @param effect - Эффект для добавления
	 */
	add(effect: Effect): void {
		this.effects.push(effect);
	}

	/**
	 * Обновляет все эффекты и удаляет завершившиеся.
	 */
	update(): void {
		const entities = this.entityWorld.all;
		for (let i = this.effects.length - 1; i >= 0; i--) {
			this.effects[i].update(entities, this.world);
			if (this.effects[i].isDead()) {
				this.effects[i].onDeath?.();
				this.effects.splice(i, 1);
			}
		}
	}

	/**
	 * Отрисовывает все активные эффекты.
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		for (const effect of this.effects) {
			effect.render(ctx);
		}
	}

	/**
	 * Возвращает количество активных эффектов (для отладки).
	 */
	get count(): number {
		return this.effects.length;
	}

	/**
	 * Удаляет все эффекты (при уничтожении мира или сбросе уровня).
	 */
	clear(): void {
		this.effects.length = 0;
	}

	/**
	 * Освобождение ресурсов: отписка от событий и удаление всех эффектов.
	 */
	dispose(): void {
		this.unsubscribe?.();
		this.unsubscribe = null;
		this.clear();
	}
}
