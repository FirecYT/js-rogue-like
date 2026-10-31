import Entity from '../entities/Entity';
import type { ProjectileSpec } from '../items/CastState';

/** Карта событий: имя события -> тип данных */
export interface EventMap {
	/** Сущность убита другой сущностью (есть атакующий). */
	entityKilled: { killer: Entity; victim: Entity };
	/** Сущность умерла (независимо от причины). */
	entityDied: { entity: Entity };
	/** Оружие произвело выстрел: готовые спецификации снарядов. */
	weaponFired: { source: Entity; specs: ProjectileSpec[] };
	/** Запуск катсцены: массив строк для отображения. */
	cutsceneStart: { lines: string[] };
}

/** Функция отписки, возвращаемая EventBus.on(). */
export type Unsubscribe = () => void;

/** Внутреннее представление слушателя (стирает тип данных события). */
type AnyListener = (data: never) => void;

/**
 * Шина событий для подписки и публикации событий игры.
 * on() возвращает функцию отписки — системы обязаны вызывать её в dispose(),
 * чтобы подписки не переживали игровой сеанс.
 */
export class EventBus {
	private readonly listeners = new Map<keyof EventMap, AnyListener[]>();

	/**
	 * Подписаться на событие.
	 * @param event - Имя события
	 * @param callback - Функция, вызываемая при наступлении события
	 * @returns Функция отписки
	 */
	on<K extends keyof EventMap>(
		event: K,
		callback: (data: EventMap[K]) => void
	): Unsubscribe {
		let list = this.listeners.get(event);
		if (!list) {
			list = [];
			this.listeners.set(event, list);
		}
		list.push(callback as AnyListener);
		return () => this.off(event, callback);
	}

	/**
	 * Отписать конкретного слушателя от события.
	 * @param event - Имя события
	 * @param callback - Та же функция, что передавалась в on()
	 */
	off<K extends keyof EventMap>(
		event: K,
		callback: (data: EventMap[K]) => void
	): void {
		const list = this.listeners.get(event);
		if (!list) return;
		const idx = list.indexOf(callback as AnyListener);
		if (idx !== -1) {
			list.splice(idx, 1);
		}
	}

	/**
	 * Опубликовать событие (вызвать всех подписчиков).
	 * Итерация по копии списка: слушатель может отписаться во время обработки.
	 * @param event - Имя события
	 * @param data - Данные события
	 */
	emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
		const list = this.listeners.get(event);
		if (!list || list.length === 0) return;
		for (const callback of list.slice()) {
			(callback as (payload: EventMap[K]) => void)(data);
		}
	}

	/**
	 * Удалить все подписки (используется при полном сбросе игрового сеанса).
	 */
	clear(): void {
		this.listeners.clear();
	}
}

/** Глобальная шина событий игры. */
export const eventBus = new EventBus();
