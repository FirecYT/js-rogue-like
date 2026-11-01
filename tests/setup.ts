/**
 * Глобальная заглушка localStorage для node-окружения vitest:
 * сервисы (MetaStorage, SettingsService) обращаются к нему напрямую.
 */
class MemoryStorage {
	private store = new Map<string, string>();

	getItem(key: string): string | null {
		return this.store.has(key) ? this.store.get(key)! : null;
	}

	setItem(key: string, value: string): void {
		this.store.set(key, String(value));
	}

	removeItem(key: string): void {
		this.store.delete(key);
	}

	clear(): void {
		this.store.clear();
	}
}

(globalThis as unknown as { localStorage: MemoryStorage }).localStorage =
	new MemoryStorage();
