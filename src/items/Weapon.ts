import Entity from '../entities/Entity';
import { Item } from './Item';
import Cooldown from '../components/Cooldown';
import { eventBus } from '../events/EventBus';
import type { ProjectileSpec, Spell } from './spells/Spell';
import { freshCastState } from './spells/Spell';

/**
 * Оружие-оболочка в духе Noita: характеристики корпуса + упорядоченная
 * очередь заклинаний. Выстрел = один «pull» очереди: модификаторы
 * накапливаются в состояние каста и потребляются ближайшим снарядом;
 * снаряд завершает цикл и порождает спецификации снарядов (ProjectileSpec),
 * которые EffectSystem материализует в эффекты.
 *
 * Очередь принадлежит экземпляру оружия: подобранное оружие приносит
 * свои заклинания с собой, выброшенное — уносит их.
 */
export abstract class Weapon implements Item {
	abstract id: string;
	abstract name: string;
	type = 'weapon' as const;
	/** Интервал между pull'ами очереди в тиках. */
	abstract fireRate: number;
	/** Ёмкость очереди (число слотов заклинаний). */
	abstract queueLength: number;
	/** Множитель урона корпуса: применяется ко всем снарядам каста. */
	damageMultiplier = 1;

	/** Перезарядка между pull'ами; длительность синхронизируется с fireRate при выстреле. */
	cooldown = new Cooldown(20);

	private queueSlots: (Spell | null)[] | null = null;
	private castIndex = 0;

	/** Очередь заклинаний оружия (лениво создаётся под queueLength). */
	get queue(): (Spell | null)[] {
		if (this.queueSlots === null) {
			this.queueSlots = Array<Spell | null>(this.queueLength).fill(null);
		}
		return this.queueSlots;
	}

	/**
	 * Заполняет очередь Starting-набором (используется конструкторами конкретных оружий).
	 * @param spells - Заклинания по порядку слотов
	 */
	protected setDefaultQueue(spells: Spell[]): void {
		const queue = this.queue;
		spells.forEach((spell, i) => {
			if (i < queue.length) {
				queue[i] = spell;
			}
		});
	}

	/**
	 * Производит pull очереди: разрешает каст и эмитит weaponFired
	 * со спецификациями снарядов. Пустой каст (очередь из модификаторов)
	 * выстрела не создаёт — pull всё равно потрачен.
	 * @param source - Сущность-источник
	 * @param angle - Угол выстрела в радианах
	 */
	fire(source: Entity, angle: number): void {
		const specs = this.pullCast(angle);
		if (specs.length > 0) {
			eventBus.emit('weaponFired', { source, specs });
		}
	}

	/**
	 * Разрешает один цикл каста: идёт по очереди от castIndex, модификаторы
	 * пополняют состояние каста, первый снаряд завершает цикл.
	 * @param angle - Базовый угол выстрела
	 * @returns Спецификации снарядов (пусто, если снаряд не встретился)
	 */
	private pullCast(angle: number): ProjectileSpec[] {
		const specs: ProjectileSpec[] = [];
		const queue = this.queue;
		if (queue.length === 0) return specs;

		const state = freshCastState();
		let steps = 0;
		while (steps++ < queue.length) {
			const spell = queue[this.castIndex];
			this.castIndex = (this.castIndex + 1) % queue.length;
			if (!spell) continue;
			if (spell.kind === 'modifier') {
				spell.applyToCast?.(state);
				continue;
			}
			spell.emitSpecs?.(specs, angle, state, this.damageMultiplier);
			break;
		}
		return specs;
	}
}

/**
 * Type guard: проверяет, является ли предмет оружием.
 * @param item - Предмет
 * @returns true, если item.type === 'weapon'
 */
export function isWeapon(item: Item): item is Weapon {
	return item.type === 'weapon';
}
