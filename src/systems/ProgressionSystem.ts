import type { ISystem } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import { eventBus } from '../events/EventBus';
import type { Unsubscribe } from '../events/EventBus';
import type { PlayerProgression } from './PlayerProgression';
import type { ScreenManager } from '../ui/ScreenManager';
import type Engine from '../components/Engine';
import { LevelUpWindow } from '../ui/windows/LevelUpWindow';
import FloatingText from '../components/FloatingText';
import type { FloatingTextSystem } from './FloatingTextSystem';
import type Entity from '../entities/Entity';
import { LEVEL_UP_UPGRADES } from '../content/upgrades';

/**
 * Система прогресса: получение опыта, повышение уровня, открытие LevelUpWindow.
 * Подписан на событие enemyKilled и добавляет опыт игроку.
 */
export class ProgressionSystem implements ISystem {
	public readonly phase = UpdatePhase.UI;
	public enabled = true;

	/** Функция отписки от шины событий (вызывается в dispose). */
	private unsubscribe: Unsubscribe | null = null;

	/**
	 * @param getControlled - Функция для получения текущей управляемой сущности
	 * @param playerProgression - Система прогресса игрока
	 * @param screenManager - Менеджер экранов для открытия окон
	 * @param engine - Движок для получения размеров канваса
	 * @param floatingTextSystem - Система всплывающих текстов для сообщений о повышении уровня
	 */
	constructor(
		private readonly getControlled: () => Entity,
		private readonly playerProgression: PlayerProgression,
		private readonly screenManager: ScreenManager,
		private readonly engine: Engine,
		private readonly floatingTextSystem: FloatingTextSystem
	) {
		this.setupEventListeners();
	}

	/**
	 * Подписывается на событие entityKilled и добавляет опыт игроку.
	 */
	private setupEventListeners(): void {
		this.unsubscribe = eventBus.on('entityKilled', ({ killer, victim }) => {
			const controlled = this.getControlled();
			if (killer !== controlled) return;

			let experience = 0;
			if ('experience' in victim) {
				experience = (victim as { experience: number }).experience;
			}

			this.addExperience(experience, controlled);
			this.floatingTextSystem.add(
			new FloatingText(victim.x, victim.y, `+${experience}`, 60)
			);
		});
	}

	/**
	 * Добавляет опыт игроку; при повышении уровня открывает окно выбора улучшения.
	 * @param amount - Количество опыта
	 * @param controlled - Управляемая сущность (обычно игрок)
	 */
	private addExperience(amount: number, controlled: Entity): void {
		if (this.playerProgression.add(amount)) {
			const lvlUpWin = new LevelUpWindow(
				LEVEL_UP_UPGRADES.map((upgrade) => upgrade.label),
				this.engine.canvas.width,
				this.engine.canvas.height
			);

			lvlUpWin.setOnChoose((choice) => {
				// Выбранное улучшение реально применяется к сущности
				LEVEL_UP_UPGRADES.find((upgrade) => upgrade.label === choice)?.apply(
					controlled
				);
				this.screenManager.closeWindow(lvlUpWin);
				this.floatingTextSystem.add(
					new FloatingText(controlled.x, controlled.y, choice, 60)
				);
			});

			this.screenManager.openWindow(lvlUpWin);

			this.floatingTextSystem.add(
				new FloatingText(
					controlled.x,
					controlled.y - 20,
					`LEVEL UP! ${this.playerProgression.level}`,
					120
				)
			);
		}
	}

	/**
	 * Обновление не требуется (логика в событиях).
	 */
	update(): void {
		// Nothing to update
	}

	/**
	 * Освобождение ресурсов: отписка от шины событий.
	 */
	dispose(): void {
		this.unsubscribe?.();
		this.unsubscribe = null;
	}
}
