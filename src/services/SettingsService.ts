/** Тумблеры HUD и интерфейса. */
export interface HudSettings {
	/** Метка имени региона в левом верхнем углу. */
	zoneLabel: boolean;
	/** Полоски HP врагов. */
	hpBars: boolean;
	/** Всплывающие тексты (урон, опыт, имена регионов). */
	floatingTexts: boolean;
}

/** Пользовательские настройки игры (персистентны в localStorage). */
export interface Settings {
	/** Переназначенные привязки: действие -> коды клавиш (пусто = дефолт). */
	bindings: Record<string, string[]>;
	/** Минимальный зум камеры (дальность отдаления), 0.1..0.5. */
	minZoom: number;
	/** Радиус загрузки чанков (дальность рендера), 6..14. */
	renderRadius: number;
	hud: HudSettings;
	/** Оверлей FPS и счётчика чанков. */
	debugOverlay: boolean;
}

const KEY = 'jsrl.settings.v1';

/** Настройки по умолчанию. */
export const DEFAULT_SETTINGS: Settings = {
	bindings: {},
	minZoom: 0.2,
	renderRadius: 8,
	hud: { zoneLabel: true, hpBars: true, floatingTexts: true },
	debugOverlay: false,
};

/**
 * Читает настройки из localStorage, сливая с дефолтами.
 * @returns Актуальные настройки
 */
export function loadSettings(): Settings {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return structuredClone(DEFAULT_SETTINGS);
		const parsed = JSON.parse(raw) as Partial<Settings>;
		const base = structuredClone(DEFAULT_SETTINGS);
		return {
			...base,
			...parsed,
			hud: { ...base.hud, ...(parsed.hud ?? {}) },
			bindings: { ...(parsed.bindings ?? {}) },
		};
	} catch {
		return structuredClone(DEFAULT_SETTINGS);
	}
}

/** Текущие настройки процесса (читаются рендером без перезагрузок). */
export const settingsState: { current: Settings } = {
	current: loadSettings(),
};

/**
 * Сохраняет настройки в localStorage и обновляет текущее состояние.
 * @param settings - Настройки для сохранения
 */
export function saveSettings(settings: Settings): void {
	settingsState.current = settings;
	try {
		localStorage.setItem(KEY, JSON.stringify(settings));
	} catch {
		// Приватный режим: настройки живут до перезагрузки
	}
}
