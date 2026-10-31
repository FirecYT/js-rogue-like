import type { ISystem, IRenderable } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import type { Effect } from '../effects/Effect';
import type Entity from '../entities/Entity';
import type { WorldService } from '../services/WorldService';
import { eventBus } from '../events/EventBus';
import { BulletEffect } from '../effects/BulletEffect';
import { LaserBeam } from '../effects/LaserBeam';
import { FireZone } from '../effects/FireZone';
import { ExplosionEffect } from '../effects/ExplosionEffect';
import type { Weapon } from '../items/Weapon';

/**
 * Карта типов эффектов: имя -> функция-конструктор.
 * Позволяет оружию декларативно указывать, какой эффект создавать при выстреле.
 */
export type EffectFactoryFn = (
	source: Entity,
	angle: number,
	weapon: Weapon
) => Effect[];

/**
 * Система эффектов: управляет жизненным циклом снарядов, лучей, зон и взрывов.
 * Подписан на событие weaponFired и создаёт соответствующие эффекты на основе типа оружия.
 * Применяет модификаторы оружия к создаваемым эффектам (DIP).
 */
export class EffectSystem implements ISystem, IRenderable {
	public readonly phase = UpdatePhase.Effects;
	public enabled = true;

	private effects: Effect[] = [];

	/**
	 * Реестр фабрик эффектов по ID оружия.
	 * Позволяет оружию регистрировать свои типы эффектов (OCP).
	 */
	private effectFactories = new Map<string, EffectFactoryFn>();

	/**
	 * @param entities - Массив всех сущностей для проверки попаданий
	 * @param world - Сервис мира для проверки коллизий эффектов с тайлами
	 */
	constructor(
		private readonly entities: Entity[],
		private readonly world: WorldService
	) {
		this.setupEventListeners();
		this.registerDefaultFactories();
	}

	/**
	 * Регистрирует стандартные фабрики эффектов.
	 */
	private registerDefaultFactories(): void {
		// Базовая пуля (по умолчанию для любого оружия без своей фабрики)
		this.effectFactories.set('bullet', (source, angle, weapon) => {
			return [new BulletEffect(source.x, source.y, angle, source, weapon.damage)];
		});

		// Лазерный луч
		this.effectFactories.set('laser', (source, angle) => {
			return [new LaserBeam(source.x, source.y, angle, source)];
		});

		// Огненная зона
		this.effectFactories.set('fire_zone', (source, angle) => {
			return [new FireZone(source.x, source.y, angle, source)];
		});

		// Взрыв в точке попадания (используется для взрывных оружий)
		this.effectFactories.set('explosion', (source, _angle) => {
			// Взрыв создаётся в точке цели (примерно 200 единиц вперёд)
			const tx = source.x + Math.cos(_angle) * 200;
			const ty = source.y + Math.sin(_angle) * 200;
			return [new ExplosionEffect(tx, ty, source)];
		});
	}

	/**
	 * Подписывается на событие weaponFired и создаёт эффекты на основе типа оружия.
	 */
	private setupEventListeners(): void {
		eventBus.on('weaponFired', ({ source, angle, weapon }) => {
			this.createEffects(source, angle, weapon);
		});
	}

	/**
	 * Создаёт эффекты для выстрела: применяет модификаторы и создаёт нужное количество снарядов.
	 * @param source - Сущность-источник выстрела
	 * @param angle - Угол выстрела в радианах
	 * @param weapon - Оружие, из которого произведён выстрел
	 */
	private createEffects(source: Entity, angle: number, weapon: Weapon): void {
		// Получаем фабрику по типу эффекта; fallback — обычная пуля
		const factory =
			this.effectFactories.get(weapon.effectType ?? 'bullet') ??
			this.effectFactories.get('bullet');

		if (!factory) {
			console.warn(
				`No effect factory found for weapon "${weapon.id}" (effectType: "${weapon.effectType}")`
			);
			return;
		}

		// Создаём нужное количество снарядов (с разбросом для нескольких)
		const count = weapon.projectileCount ?? 1;
		const spreadAngle = weapon.spreadAngle ?? 0;

		for (let i = 0; i < count; i++) {
			let projectileAngle = angle;
			if (count > 1) {
				// Равномерный разброс вокруг основного угла
				const t = count === 1 ? 0 : i / (count - 1) - 0.5;
				projectileAngle += t * spreadAngle;
			}

			const effects = factory(source, projectileAngle, weapon);

			// Применяем модификаторы к каждому эффекту
			for (let effect of effects) {
				effect = this.applyModifiers(effect, source);
				this.add(effect);
			}
		}
	}

	/**
	 * Применяет все модификаторы из инвентаря источника к эффекту.
	 * @param effect - Базовый эффект
	 * @param source - Сущность-источник (для получения модификаторов)
	 * @returns Модифицированный эффект
	 */
	private applyModifiers(effect: Effect, source: Entity): Effect {
		for (const modifier of source.inventory.modifiers) {
			if (modifier) {
				effect = modifier.apply(effect);
			}
		}
		return effect;
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
		for (let i = this.effects.length - 1; i >= 0; i--) {
			this.effects[i].update(this.entities, this.world);
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
	 * Освобождение ресурсов.
	 */
	dispose(): void {
		this.clear();
	}
}
