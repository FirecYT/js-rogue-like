import type { ISystem } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import type { EntityWorld } from '../core/EntityWorld';
import type Entity from '../entities/Entity';
import type { InputMapper } from '../input/InputMapper';
import { InputAction } from '../input/InputAction';
import { PickupItem } from '../entities/PickupItem';
import { PickupWindow } from '../ui/windows/PickupWindow';
import type { ScreenManager } from '../ui/ScreenManager';
import type Engine from '../components/Engine';
import { createPickupFromItem } from '../utils';
import { isWeapon } from '../items/Weapon';
import { isModifier } from '../items/modifiers/Modifier';
import { isChip } from '../items/Chip';
import type { Item } from '../items/Item';
import { eventBus } from '../events/EventBus';

/**
 * Система подбора предметов: обнаруживает пикапы рядом с управляемой сущностью
 * и открывает окно выбора слота при нажатии клавиши взаимодействия.
 */
export class PickupSystem implements ISystem {
	public readonly phase = UpdatePhase.Pickup;
	public enabled = true;

	/** Радиус обнаружения пикапа в пикселях. */
	private static readonly PICKUP_RANGE = 20;

	/** Пикап, рядом с которым находится управляемая сущность (для UI подсказки). */
	private pickupInRange: PickupItem | null = null;

	/**
	 * @param entityWorld - Контейнер всех сущностей игры
	 * @param getControlled - Функция для получения текущей управляемой сущности
	 * @param input - Маппер действий для проверки нажатия клавиши взаимодействия
	 * @param screenManager - Менеджер экранов для открытия окон
	 * @param engine - Движок для получения размеров канваса
	 */
	constructor(
		private readonly entityWorld: EntityWorld,
		private readonly getControlled: () => Entity,
		private readonly input: InputMapper,
		private readonly screenManager: ScreenManager,
		private readonly engine: Engine
	) {}

	/**
	 * Возвращает пикап, находящийся в радиусе взаимодействия (для UI подсказки).
	 */
	getPickupInRange(): PickupItem | null {
		return this.pickupInRange;
	}

	/**
	 * Ищет ближайший пикап в радиусе и обрабатывает подбор при нажатии клавиши.
	 */
	update(): void {
		this.pickupInRange = null;
		const controlled = this.getControlled();

		for (const entity of this.entityWorld.all) {
			if (!(entity instanceof PickupItem) || entity.isDead()) continue;

			const dx = controlled.x - entity.x;
			const dy = controlled.y - entity.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < PickupSystem.PICKUP_RANGE) {
				if (this.input.isPressed(InputAction.Interact)) {
					this.handlePickup(entity, controlled);
				} else {
					this.pickupInRange = entity;
				}
				break;
			}
		}
	}

	/**
	 * Обрабатывает подбор предмета: открывает окно выбора слота.
	 * Пикап удаляется только после подтверждения выбора.
	 * @param pickup - Подбираемый предмет
	 * @param controlled - Управляемая сущность (обычно игрок)
	 */
	private handlePickup(pickup: PickupItem, controlled: Entity): void {
		const pickupWin = new PickupWindow(
			pickup,
			controlled,
			this.engine.canvas.width,
			this.engine.canvas.height
		);

		pickupWin.setOnConfirm((slotIndex) => {
			const item = pickup.item;
			const inventory = controlled.inventory;

			if (isWeapon(item)) {
				for (const dropped of inventory.replaceWeapon(item)) {
					this.dropItem(dropped, controlled);
				}
			} else if (isModifier(item)) {
				const old = inventory.installModifier(item, slotIndex);
				if (old) this.dropItem(old, controlled);
			} else if (isChip(item)) {
				const old = inventory.installChip(item, slotIndex);
				if (old) this.dropItem(old, controlled);
			}

			eventBus.emit('itemPicked', { item, by: controlled });

			// Удаляем пикап из мира ТОЛЬКО после подтверждения
			this.entityWorld.remove(pickup);

			this.screenManager.closeWindow(pickupWin);
		});

		pickupWin.setOnCancel(() => {
			// При отмене пикап остаётся в мире
			this.screenManager.closeWindow(pickupWin);
		});

		this.screenManager.openWindow(pickupWin);
	}

	/**
	 * Выбрасывает предмет рядом с сущностью (с лёгким разбросом).
	 * @param item - Предмет для выброса
	 * @param from - Сущность, рядом с которой создаётся пикап
	 */
	private dropItem(item: Item, from: Entity): void {
		const x = from.x + (Math.random() - 0.5) * 40;
		const y = from.y + (Math.random() - 0.5) * 40;
		this.entityWorld.spawn(createPickupFromItem(item, x, y));
	}

	/**
	 * Освобождение ресурсов (не требуется для этой системы).
	 */
	dispose(): void {
		// Nothing to dispose
	}
}
