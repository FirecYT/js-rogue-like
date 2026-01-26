import Entity from "../entities/Entity";

interface EventMap {
	enemyKilled: { killer: Entity; victim: Entity };
	entityDied: { entity: Entity };
}

class EventBus {
	private listeners: { [K in keyof EventMap]?: ((data: EventMap[K]) => void)[] } = {};

	on<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void): void {
		if (!this.listeners[event]) this.listeners[event] = [];
		this.listeners[event].push(callback);
	}

	emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
		const listeners = this.listeners[event];
		if (listeners) {
			listeners.forEach(callback => callback(data));
		}
	}
}

export const eventBus = new EventBus();
