import Entity from "../entities/Entity";

/** Карта событий: имя события -> тип данных */
interface EventMap {
	enemyKilled: { killer: Entity; victim: Entity };
	entityDied: { entity: Entity };
	chunkUnloaded: { chunkX: number; chunkY: number };
}

/**
 * Шина событий для подписки и публикации событий игры.
 */
class EventBus {
	private listeners: { [K in keyof EventMap]?: ((data: EventMap[K]) => void)[] } = {};

	/**
	 * Подписаться на событие.
	 * @param event - Имя события
	 * @param callback - Функция, вызываемая при наступлении события (получает данные события)
	 */
	on<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void): void {
		if (!this.listeners[event]) this.listeners[event] = [];
		(this.listeners[event] as ((data: EventMap[K]) => void)[]).push(callback);
	}

	/**
	 * Опубликовать событие (вызвать всех подписчиков).
	 * @param event - Имя события
	 * @param data - Данные события
	 */
	emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
		const listeners = this.listeners[event];
		if (listeners) {
			listeners.forEach(callback => callback(data));
		}
	}
}

export const eventBus = new EventBus();
