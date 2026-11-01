import { describe, it, expect, beforeEach } from 'vitest';
import {
	DEFAULT_SETTINGS,
	loadSettings,
	saveSettings,
	settingsState,
} from '../src/services/SettingsService';

/**
 * SettingsService: дефолты, слияние при загрузке, персистентность.
 */
describe('SettingsService', () => {
	beforeEach(() => localStorage.clear());

	it('при пустом хранилище возвращает дефолты', () => {
		expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
	});

	it('сохранённые настройки читаются обратно', () => {
		const next = { ...loadSettings(), minZoom: 0.35, renderRadius: 12 };
		saveSettings(next);
		const loaded = loadSettings();
		expect(loaded.minZoom).toBe(0.35);
		expect(loaded.renderRadius).toBe(12);
		expect(settingsState.current.minZoom).toBe(0.35);
	});

	it('частичные/повреждённые данные сливаются с дефолтами', () => {
		localStorage.setItem('jsrl.settings.v1', '{"minZoom":0.5}');
		const loaded = loadSettings();
		expect(loaded.minZoom).toBe(0.5);
		expect(loaded.renderRadius).toBe(DEFAULT_SETTINGS.renderRadius);
		expect(loaded.hud).toEqual(DEFAULT_SETTINGS.hud);
	});
});
