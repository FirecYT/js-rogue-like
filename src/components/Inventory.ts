import { Weapon } from '../items/Weapon';
import { Chip } from '../items/Chip';
import Entity from '../entities/Entity';
import type { Item } from '../items/Item';
import type { Modifier } from '../items/modifiers/Modifier';

/** Ссылка на слот инвентаря (для UI-операций: drag-and-drop, тултипы). */
export interface SlotRef {
	type: 'weapon' | 'modifier' | 'chip';
	index: number;
}

/**
 * Инвентарь сущности: оружие со слотами модификаторов и слоты чипов.
 * Единственный источник истины для UI: окна читают и изменяют слоты только через него.
 * Слоты модификаторов принадлежат экземпляру оружия, поэтому смена оружия
 * меняет и набор слотов модификаторов.
 */
export class Inventory {
	public weapon: Weapon | null = null;
	public chips: (Chip | null)[] = [null, null, null, null, null];

	/**
	 * @param entity - Владелец инвентаря
	 */
	constructor(public entity: Entity) {}

	/**
	 * Устанавливает текущее оружие (вместе с его очередью заклинаний).
	 * @param weapon - Оружие или null
	 */
	setWeapon(weapon: Weapon | null): void {
		this.weapon = weapon;
	}

	/**
	 * Заменяет оружие на новое.
	 * @param weapon - Новое оружие
	 * @returns Массив предметов «навылет» (старое оружие), для выброса в мир
	 */
	replaceWeapon(weapon: Weapon): Item[] {
		const old = this.weapon;
		this.weapon = weapon;
		return old ? [old] : [];
	}

	/**
	 * Устанавливает модификатор в слот текущего оружия, возвращая прежний.
	 * @param modifier - Новый модификатор
	 * @param slotIndex - Индекс слота модификаторов оружия
	 * @returns Прежний модификатор слота или null (нет оружия/слота)
	 */
	installModifier(modifier: Modifier, slotIndex: number): Modifier | null {
		const slots = this.weapon?.modifierSlots;
		if (!slots || slotIndex < 0 || slotIndex >= slots.length) return null;
		const old = slots[slotIndex] ?? null;
		slots[slotIndex] = modifier;
		return old;
	}

	/**
	 * Кладёт чип в первый свободный слот.
	 * @param chip - Новый чип
	 * @returns Чип, не поместившийся в инвентарь, или null
	 */
	addChip(chip: Chip): Chip | null {
		const index = this.chips.findIndex((slot) => !slot);
		if (index === -1) return chip;
		return this.installChip(chip, index);
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
		old?.onUnequip?.(this.entity);
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
				return this.weapon?.modifierSlots[ref.index] ?? null;
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
		if (a.type !== b.type || a.type === 'weapon') return false;
		const tmp = this.getAt(a);
		this.setRaw(a, this.getAt(b));
		this.setRaw(b, tmp);
		return true;
	}

	/**
	 * Полностью убирает предмет из слота (выброс в мир).
	 * @param ref - Ссылка на слот
	 * @returns Убранный предмет или null
	 */
	removeAt(ref: SlotRef): Item | null {
		const item = this.getAt(ref);
		if (!item) return null;
		this.setRaw(ref, null);
		item.onUnequip?.(this.entity);
		return item;
	}

	/** Прямая запись в слот без хуков (внутреннее использование). */
	private setRaw(ref: SlotRef, item: Item | null): void {
		switch (ref.type) {
			case 'weapon':
				this.weapon = item as Weapon | null;
				break;
			case 'modifier': {
				const slots = this.weapon?.modifierSlots;
				if (slots) slots[ref.index] = item as Modifier | null;
				break;
			}
			case 'chip':
				this.chips[ref.index] = item as Chip | null;
				break;
		}
	}

	/**
	 * Производит выстрел из оружия под заданным углом (если оружие готово).
	 * Оружие само разрешает очередь заклинаний и эмитит weaponFired.
	 * @param angle - Угол в радианах
	 */
	fire(angle: number): void {
		if (!this.weapon || !this.isWeaponReady()) return;
		if (this.weapon.cooldown) {
			// fireRate задаётся подклассом после super() и может меняться апгрейдами,
			// поэтому длительность перезарядки синхронизируется при каждом выстреле
			this.weapon.cooldown.setDuration(this.weapon.fireRate);
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
