import type { ISystem } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import type Entity from '../entities/Entity';
import type { InputMapper } from '../input/InputMapper';
import { InputAction } from '../input/InputAction';
import { PickupItem } from '../entities/PickupItem';
import { PickupWindow } from '../ui/windows/PickupWindow';
import type { ScreenManager } from '../ui/ScreenManager';
import type Engine from '../components/Engine';
import { createPickupFromItem } from '../utils';
import { isWeapon } from '../items/Weapon';
import { isModifier, Modifier } from '../items/Modifier';
import { isChip } from '../items/Chip';

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
	 * @param entities - Массив всех сущностей в игре
	 * @param getControlled - Функция для получения текущей управляемой сущности
	 * @param input - Маппер действий для проверки нажатия клавиши взаимодействия
	 * @param screenManager - Менеджер экранов для открытия окон
	 * @param engine - Движок для получения размеров канваса
	 */
	constructor(
		private readonly entities: Entity[],
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

		for (let i = 0; i < this.entities.length; i++) {
			const entity = this.entities[i];
			if (!(entity instanceof PickupItem) || entity.isDead()) continue;

			const dx = controlled.x - entity.x;
			const dy = controlled.y - entity.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < PickupSystem.PICKUP_RANGE) {
				if (this.input.isPressed(InputAction.Interact)) {
					this.handlePickup(entity, controlled, i);
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
	 * @param index - Индекс пикапа в массиве entities
	 */
	private handlePickup(
		pickup: PickupItem,
		controlled: Entity,
		_index: number
	): void {
		const pickupWin = new PickupWindow(
			pickup,
			controlled,
			this.entities,
			this.engine.canvas.width,
			this.engine.canvas.height
		);

		pickupWin.setOnConfirm((slotIndex) => {
			const item = pickup.item;

			if (isWeapon(item)) {
				const newWeapon = item;
				const oldWeapon = controlled.inventory.weapon;
				const oldModifiers = controlled.inventory.modifiers.filter(
					(m) => m !== null
				);

				controlled.inventory.setWeapon(newWeapon);

				const newModifiers: (Modifier | null)[] = Array(
					newWeapon.modifiersSlots
				).fill(null);

				const droppedModifiers: Modifier[] = [];
				for (let i = 0; i < oldModifiers.length; i++) {
					if (i < newWeapon.modifiersSlots) {
						newModifiers[i] = oldModifiers[i];
					} else {
						droppedModifiers.push(oldModifiers[i]);
					}
				}

				controlled.inventory.modifiers = newModifiers;

				if (oldWeapon) {
					this.entities.push(
						createPickupFromItem(oldWeapon, controlled.x, controlled.y)
					);
				}
				for (const mod of droppedModifiers) {
					mod.onUnequip?.(controlled);
					this.entities.push(
						createPickupFromItem(
							mod,
							controlled.x + (Math.random() - 0.5) * 40,
							controlled.y + (Math.random() - 0.5) * 40
						)
					);
				}
			} else if (isModifier(item)) {
				const oldMod = controlled.inventory.modifiers[slotIndex];
				if (oldMod) {
					oldMod.onUnequip?.(controlled);
					this.entities.push(
						createPickupFromItem(oldMod, controlled.x, controlled.y)
					);
				}
				controlled.inventory.modifiers[slotIndex] = item;
				item.onEquip?.(controlled);
			} else if (isChip(item)) {
				const oldChip = controlled.inventory.chips[slotIndex];
				if (oldChip) {
					this.entities.push(
						createPickupFromItem(oldChip, controlled.x, controlled.y)
					);
				}
				controlled.inventory.chips[slotIndex] = item;
				item.onEquip?.(controlled);
			}

			// Удаляем пикап из мира ТОЛЬКО после подтверждения
			pickup.onPickup(controlled);
			const currentIndex = this.entities.indexOf(pickup);
			if (currentIndex !== -1) {
				this.entities.splice(currentIndex, 1);
			}

			this.screenManager.closeWindow(pickupWin);
		});

		pickupWin.setOnCancel(() => {
			// При отмене пикап остаётся в мире
			this.screenManager.closeWindow(pickupWin);
		});

		this.screenManager.openWindow(pickupWin);
	}

	/**
	 * Освобождение ресурсов (не требуется для этой системы).
	 */
	dispose(): void {
		// Nothing to dispose
	}
}
