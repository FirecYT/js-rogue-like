import type { ISystem } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import type { InputMapper } from '../input/InputMapper';
import { InputAction } from '../input/InputAction';
import type { ScreenManager } from '../ui/ScreenManager';
import type Engine from '../components/Engine';
import { InventoryWindow } from '../ui/windows/InventoryWindow';
import type { PickupItem } from '../entities/PickupItem';
import FloatingText from '../components/FloatingText';
import type { FloatingTextSystem } from './FloatingTextSystem';
import type Entity from '../entities/Entity';

/**
 * Система UI: обработка глобальных UI-действий (инвентарь, фуллскрин).
 * Отвечает только за UI-взаимодействия, не за игровую логику.
 */
export class UISystem implements ISystem {
	public readonly phase = UpdatePhase.UI;
	public enabled = true;

	/**
	 * @param getControlled - Функция для получения текущей управляемой сущности
	 * @param entities - Массив всех сущностей для добавления выброшенных предметов
	 * @param input - Маппер действий для проверки нажатий клавиш
	 * @param screenManager - Менеджер экранов для открытия/закрытия окон
	 * @param engine - Движок для изменения размеров канваса и фуллскрина
	 * @param floatingTextSystem - Система всплывающих текстов для сообщений о выброшенных предметах
	 */
	constructor(
		private readonly getControlled: () => Entity,
		private readonly entities: Entity[],
		private readonly input: InputMapper,
		private readonly screenManager: ScreenManager,
		private readonly engine: Engine,
		private readonly floatingTextSystem: FloatingTextSystem
	) {}

	/**
	 * Обрабатывает нажатия клавиш для UI-действий.
	 */
	update(): void {
		this.handleInventory();
		this.handleFullscreen();
	}

	/**
	 * Открывает/закрывает окно инвентаря по нажатию Tab.
	 */
	private handleInventory(): void {
		if (!this.input.isPressed(InputAction.Inventory)) return;

		if (this.screenManager.isWindowOpen(InventoryWindow)) {
			this.screenManager.closeWindowsOfType(InventoryWindow);
		} else {
			const controlled = this.getControlled();
			const invWin = new InventoryWindow(
				controlled,
				this.engine.canvas.width,
				this.engine.canvas.height
			);

			invWin.setOnClose(() => {
				this.screenManager.closeWindow(invWin);
			});

			invWin.setOnItemDropped((pickupItem: PickupItem) => {
				this.entities.push(pickupItem);
				const text = new FloatingText(
					controlled.x,
					controlled.y - 20,
					`Выброшено: ${pickupItem.item.name}`,
					60
				);
				this.floatingTextSystem.add(text);
			});

			this.screenManager.openWindow(invWin);
		}
	}

	/**
	 * Переключает фуллскрин по нажатию F12.
	 */
	private handleFullscreen(): void {
		if (!this.input.isPressed(InputAction.Fullscreen)) return;

		if (document.fullscreenElement) {
			document.exitFullscreen().then(() => {
				this.engine.canvas.width =
					this.engine.canvas.parentElement?.clientWidth || 640;
				this.engine.canvas.height =
					this.engine.canvas.parentElement?.clientHeight || 480;
				this.engine.context.imageSmoothingEnabled = false;
			});
		} else {
			this.engine.canvas.requestFullscreen().then(() => {
				this.engine.canvas.width = document.body.clientWidth;
				this.engine.canvas.height = document.body.clientHeight;
				this.engine.context.imageSmoothingEnabled = false;
			});
		}
	}

	/**
	 * Освобождение ресурсов (не требуется для этой системы).
	 */
	dispose(): void {
		// Nothing to dispose
	}
}
