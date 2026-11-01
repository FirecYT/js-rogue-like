import type { RunStats } from './StatsService';

/** Снимок забега в слоте сохранения. */
export interface SaveData {
	version: 1;
	/** Seed забега (мир детерминированно воссоздаётся). */
	seed: number;
	/** Момент сохранения (ISO) для списка слотов. */
	date: string;
	player: {
		x: number;
		y: number;
		hp: number;
		level: number;
		experience: number;
	};
	inventory: {
		weapon: string | null;
		modifiers: (string | null)[];
		chips: (string | null)[];
	};
	stats: RunStats;
}

/** Краткая информация о слоте для списка «Продолжить/Сохранить». */
export interface SlotInfo {
	exists: boolean;
	date: string;
	level: number;
	ticks: number;
}

const SLOTS = 3;
const key = (slot: number): string => `jsrl.save.${slot}`;

/**
 * Читает информацию всех слотов (для списков выбора).
 * @returns Массив по числу слотов
 */
export function listSlots(): SlotInfo[] {
	const result: SlotInfo[] = [];
	for (let slot = 1; slot <= SLOTS; slot++) {
		const data = loadSave(slot);
		result.push(
			data
				? {
						exists: true,
						date: data.date,
						level: data.player.level,
						ticks: data.stats.ticks,
					}
				: { exists: false, date: '', level: 0, ticks: 0 }
		);
	}
	return result;
}

/**
 * Сохраняет забег в слот.
 * @param slot - Номер слота (1..3)
 * @param data - Снимок забега
 */
export function saveSave(slot: number, data: SaveData): void {
	try {
		localStorage.setItem(key(slot), JSON.stringify(data));
	} catch {
		// Нет доступа к хранилищу: сейвы недоступны, игра продолжается
	}
}

/**
 * Читает сохранение слота (null, если слот пуст или повреждён).
 * @param slot - Номер слота (1..3)
 * @returns Снимок забега или null
 */
export function loadSave(slot: number): SaveData | null {
	try {
		const raw = localStorage.getItem(key(slot));
		if (!raw) return null;
		const data = JSON.parse(raw) as SaveData;
		if (data.version !== 1 || typeof data.seed !== 'number') return null;
		return data;
	} catch {
		return null;
	}
}
