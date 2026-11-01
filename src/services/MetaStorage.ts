/** Мета-состояние между забегами: журнал и суммарная статистика. */
export interface MetaStats {
	/** Запусков забега. */
	runs: number;
	/** Завершённых забегов (смерть или выход с итогами). */
	runsEnded: number;
	/** Всего убийств за все забеги. */
	totalKills: number;
	/** Всего смертей управляемой сущности. */
	totalDeaths: number;
	/** Лучший забег по длительности (тиков), null — нет завершённых. */
	bestRunTicks: number | null;
	/** Всего обменов бартера. */
	totalTrades: number;
	/** Всего подобранных предметов. */
	totalPickups: number;
	/** Всего убитых боссов. */
	bossesKilled: number;
}

/** Полное мета-состояние localStorage. */
export interface MetaState {
	/** Открытые записи журнала (id с префиксами e:/i:/n:). */
	journal: string[];
	/** Открытые, но ещё не прочитанные в журнале записи (метка «Новое»). */
	journalNew: string[];
	stats: MetaStats;
}

const KEY = 'jsrl.meta.v1';

/** Мета-состояние по умолчанию. */
function defaultMeta(): MetaState {
	return {
		journal: [],
		journalNew: [],
		stats: {
			runs: 0,
			runsEnded: 0,
			totalKills: 0,
			totalDeaths: 0,
			bestRunTicks: null,
			totalTrades: 0,
			totalPickups: 0,
			bossesKilled: 0,
		},
	};
}

/**
 * Читает мета-состояние из localStorage (устойчиво к повреждению данных).
 * @returns Мета-состояние (по умолчанию, если хранилище пусто)
 */
export function loadMeta(): MetaState {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return defaultMeta();
		const parsed = JSON.parse(raw) as Partial<MetaState>;
		const base = defaultMeta();
		return {
			journal: Array.isArray(parsed.journal) ? parsed.journal : [],
			journalNew: Array.isArray(parsed.journalNew) ? parsed.journalNew : [],
			stats: { ...base.stats, ...(parsed.stats ?? {}) },
		};
	} catch {
		return defaultMeta();
	}
}

/**
 * Сохраняет мета-состояние в localStorage.
 * @param state - Состояние для сохранения
 */
export function saveMeta(state: MetaState): void {
	try {
		localStorage.setItem(KEY, JSON.stringify(state));
	} catch {
		// Приватный режим и т.п.: играем без персистентности
	}
}
