import { Weapon } from '../items/Weapon';
import { Chip } from '../items/Chip';
import Entity from '../entities/Entity';
import { Modifier } from '../items/Modifier';
import type { Item } from '../items/Item';

/** Ссылка на слот инвентаря (для UI-операций: drag-and-drop, тултипы). */
export interface SlotRef {
	type: 'weapon' | 'modifier' | 'chip';
	index: number;
}

/**
 * Инвентарь сущности: оружие, слоты модификаторов и чипов, стрельба и использование чипов.
 * Единственный источник истины для UI: окна читают и изменяют слоты только через него.
 */
export class Inventory {
	public weapon: Weapon | null = null;
	public modifiers: (Modifier | null)[] = [];
	public chips: (Chip | null)[] = [null, null, null, null, null];

	/**
	 * @param entity - Владелец инвентаря
	 */
	constructor(public entity: Entity) {}

	/**
	 * Устанавливает текущее оружие и подстраивает количество слотов модификаторов.
	 * @param weapon - Оружие или null
	 */
	setWeapon(weapon: Weapon | null): void {
		this.weapon = weapon;
		if (weapon) {
			while (this.modifiers.length < weapon.modifiersSlots) {
				this.modifiers.push(null);
			}
			this.modifiers.length = weapon.modifiersSlots;
		}
	}

	/**
	 * Добавляет чип в первый свободный слот.
	 * @param chip - Чип для добавления
	 * @returns true, если слот найден и чип добавлен
	 */
	addChip(chip: Chip): boolean {
		const emptySlot = this.chips.findIndex((c) => c === null);
		if (emptySlot === -1) return false;
		this.chips[emptySlot] = chip;
		chip.onEquip?.(this.entity);
		return true;
	}

	/**
	 * Заменяет оружие на новое, сохраняя модификаторы, которые помещаются
	 * в слоты нового оружия. Возвращает предметы «навылет»: старое оружие
	 * и модификаторы, не поместившиеся в новые слоты (они уже сняты: onUnequip вызван).
	 * @param weapon - Новое оружие
	 * @returns Массив предметов для выброса в мир
	 */
	replaceWeapon(weapon: Weapon): Item[] {
		const dropped: Item[] = [];
		const oldWeapon = this.weapon;
		const oldModifiers = this.modifiers.filter(
			(m): m is Modifier => m !== null
		);

		this.setWeapon(weapon);

		// Восстанавливаем модификаторы по мере свободных слотов нового оружия
		const slots = weapon.modifiersSlots;
		const nextModifiers: (Modifier | null)[] = oldModifiers.slice(0, slots);
		while (nextModifiers.length < slots) {
			nextModifiers.push(null);
		}
		this.modifiers = nextModifiers;

		// Лишние модификаторы снимаются и возвращаются наружу
		for (const mod of oldModifiers.slice(slots)) {
			mod.onUnequip?.(this.entity);
			dropped.push(mod);
		}
		if (oldWeapon) {
			dropped.push(oldWeapon);
		}
		return dropped;
	}

	/**
	 * Устанавливает модификатор в слот, возвращая прежний (снятый) модификатор.
	 * @param mod - Новый модификатор
	 * @param slotIndex - Индекс слота модификаторов
	 * @returns Прежний модификатор слота или null
	 */
	installModifier(mod: Modifier, slotIndex: number): Modifier | null {
		const old = this.modifiers[slotIndex] ?? null;
		old?.onUnequip?.(this.entity);
		this.modifiers[slotIndex] = mod;
		mod.onEquip?.(this.entity);
		return old;
	}

	/**
	 * Возвращает предмет в слоте по ссылке.
	 * @param ref - Ссылка на слот
	 */
	getAt(ref: SlotRef): Item | null {
		switch (ref.type) {
			case 'weapon':
				return this.weapon;
			case 'modifier':
				return this.modifiers[ref.index] ?? null;
			case 'chip':
				return this.chips[ref.index] ?? null;
		}
	}

	/**
	 * Меняет местами содержимое двух слотов одного типа
	 * (набор экипированных предметов не меняется — хуки не вызываются).
	 * @param a - Первый слот
	 * @param b - Второй слот
	 * @returns true, если обмен выполнен
	 */
	swapSlots(a: SlotRef, b: SlotRef): boolean {
		if (a.type !== b.type) return false;
		if (a.type === 'weapon') return false;
		const tmp = this.getAt(a);
		this.setRaw(a, this.getAt(b));
		this.setRaw(b, tmp);
		return true;
	}

	/**
	 * Полностью убирает предмет из слота (выброс в мир):
	 * для модификатора вызывается onUnequip.
	 * @param ref - Ссылка на слот
	 * @returns Убранный предмет или null
	 */
	removeAt(ref: SlotRef): Item | null {
		const item = this.getAt(ref);
		if (!item) return null;
		if (ref.type === 'weapon') {
			this.setWeapon(null);
		} else {
			if (ref.type === 'modifier') {
				(item as Modifier).onUnequip?.(this.entity);
			}
			this.setRaw(ref, null);
		}
		return item;
	}

	/** Прямая запись в слот без хуков (внутреннее использование). */
	private setRaw(ref: SlotRef, item: Item | null): void {
		switch (ref.type) {
			case 'weapon':
				this.weapon = item as Weapon | null;
				break;
			case 'modifier':
				this.modifiers[ref.index] = item as Modifier | null;
				break;
			case 'chip':
				this.chips[ref.index] = item as Chip | null;
				break;
		}
	}

	/**
	 * Устанавливает чип в слот, возвращая прежний чип.
	 * @param chip - Новый чип
	 * @param slotIndex - Индекс слота чипов
	 * @returns Прежний чип слота или null
	 */
	installChip(chip: Chip, slotIndex: number): Chip | null {
		const old = this.chips[slotIndex] ?? null;
		this.chips[slotIndex] = chip;
		chip.onEquip?.(this.entity);
		return old;
	}

	/**
	 * Добавляет модификатор в первый свободный слот (только если есть оружие и есть слоты).
	 * @param mod - Модификатор
	 * @returns true, если добавлен
	 */
	addModifier(mod: Modifier): boolean {
		if (!this.weapon) return false;
		const emptySlot = this.modifiers.findIndex((m) => m === null);
		if (
			(emptySlot === -1 &&
				this.modifiers.length === this.weapon.modifiersSlots) ||
			emptySlot >= this.weapon.modifiersSlots
		)
			return false;
		this.modifiers[emptySlot] = mod;
		return true;
	}

	/**
	 * Производит выстрел из оружия под заданным углом (если оружие готово).
	 * Оружие само эмитит событие weaponFired через EventBus.
	 * @param angle - Угол в радианах
	 */
	fire(angle: number): void {
		if (!this.weapon || !this.isWeaponReady()) return;
		if (this.weapon.cooldown) {
			this.weapon.cooldown.start();
		}
		this.weapon.fire(this.entity, angle);
	}

	/**
	 * Проверяет, готово ли оружие к выстрелу (нет перезарядки или перезарядка готова).
	 * @returns true, если можно стрелять
	 */
	isWeaponReady(): boolean {
		if (!this.weapon) return false;
		return !this.weapon.cooldown || this.weapon.cooldown.isReady();
	}

	/**
	 * Проверяет, готов ли чип в слоте к использованию.
	 * @param index - Индекс слота чипа (0..4)
	 * @returns true, если чип есть и перезарядка готова
	 */
	isChipReady(index: number): boolean {
		const chip = this.chips[index];
		if (!chip) return false;
		return !chip.cooldown || chip.cooldown.isReady();
	}

	/**
	 * Использует чип в слоте (если активен и готов).
	 * @param index - Индекс слота чипа
	 */
	useChip(index: number): void {
		const chip = this.chips[index];
		if (!chip || !chip.isActive || !this.isChipReady(index)) return;
		if (chip.cooldown) {
			chip.cooldown.start();
		}
		chip.use?.(this.entity);
	}

	/**
	 * Обновляет перезарядки оружия и чипов, вызывает onUpdate у чипов.
	 */
	update(): void {
		for (const chip of this.chips) {
			if (chip?.cooldown) {
				chip.cooldown.update();
			}
		}
		this.chips.forEach((chip) => {
			if (chip?.onUpdate) chip.onUpdate(this.entity);
		});
		this.weapon?.cooldown?.update();
	}
}
