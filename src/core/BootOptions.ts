/** Параметры запуска игры из URL (точка входа и смоук-тесты). */
export interface BootOptions {
	/** menu — главное меню с attract-камерой, play — сразу забег. */
	mode: 'menu' | 'play';
	/** Debug-сцена полигона (?playground). */
	playground: boolean;
	/** Слот сохранения для продолжения (1..3) или null. */
	slot: number | null;
	/** Фиксированный seed забега (?seed=N) или null — случайный. */
	seed: number | null;
}

/**
 * Разбирает query-строку страницы в параметры запуска:
 * без параметров — главное меню; ?run=new — новый забег;
 * ?slot=N — продолжение из слота; ?playground — полигон;
 * ?seed=N — фиксированный seed забега (детерминированные проверки).
 * @returns Параметры запуска
 */
export function parseBootOptions(): BootOptions {
	const params = new URLSearchParams(window.location.search);
	const playground = params.has('playground');
	const slotParam = params.get('slot');
	const slot = slotParam ? Number(slotParam) : null;
	const seedParam = params.get('seed');
	const seedParsed = seedParam !== null ? Number(seedParam) : NaN;
	const seed = Number.isFinite(seedParsed) ? seedParsed | 0 : null;
	const run = params.get('run');
	if (playground || run !== null || (slot !== null && !Number.isNaN(slot))) {
		return { mode: 'play', playground, slot, seed };
	}
	return { mode: 'menu', playground: false, slot: null, seed };
}

/**
 * Переход на другой режим игры перезагрузкой страницы (чистый бут).
 * @param query - Новая query-строка (например, '?run=new')
 */
export function navigateTo(query: string): void {
	window.location.search = query;
}
