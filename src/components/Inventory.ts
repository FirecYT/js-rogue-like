import { Weapon } from '../items/Weapon';
import { Chip } from '../items/Chip';
import Entity from '../entities/Entity';
import { EffectSystem } from '../systems/EffectSystem';
import { Modifier } from '../items/Modifier';

/**
 * Инвентарь сущности: оружие, слоты модификаторов и чипов, стрельба и использование чипов.
 */
export class Inventory {
	public weapon: Weapon | null = null;
	public modifiers: (Modifier | null)[] = [];
	public chips: (Chip | null)[] = [null, null, null, null, null];

	/**
	 * @param entity - Владелец инвентаря
	 */
	constructor(public entity: Entity) { }

	/**
	 * Устанавливает текущее оружие; при смене вызывает onUnequip/onEquip, подстраивает длину modifiers.
	 * @param weapon - Оружие или null
	 */
	setWeapon(weapon: Weapon | null): void {
		this.weapon?.onUnequip?.(this.entity);
		this.weapon = weapon;
		if (weapon) {
			while (this.modifiers.length < weapon.modifiersSlots) {
				this.modifiers.push(null);
			}
			this.modifiers.length = weapon.modifiersSlots;
			weapon.onEquip?.(this.entity);
		}
	}

	/**
	 * Добавляет чип в первый свободный слот.
	 * @param chip - Чип для добавления
	 * @returns true, если слот найден и чип добавлен
	 */
	addChip(chip: Chip): boolean {
		const emptySlot = this.chips.findIndex(c => c === null);
		if (emptySlot === -1) return false;
		this.chips[emptySlot] = chip;
		chip.onEquip?.(this.entity);
		return true;
	}

	/**
	 * Добавляет модификатор в первый свободный слот (только если есть оружие и есть слоты).
	 * @param mod - Модификатор
	 * @returns true, если добавлен
	 */
	addModifier(mod: Modifier): boolean {
		if (!this.weapon) return false;
		const emptySlot = this.modifiers.findIndex(m => m === null);
		if ((emptySlot === -1 && this.modifiers.length === this.weapon.modifiersSlots) || (emptySlot >= this.weapon.modifiersSlots)) return false;
		this.modifiers[emptySlot] = mod;
		return true;
	}

	/**
	 * Производит выстрел из оружия под заданным углом (если оружие готово).
	 * @param angle - Угол в радианах
	 * @param effectSystem - Система эффектов для добавления эффекта выстрела
	 */
	fire(angle: number, effectSystem: EffectSystem): void {
		if (!this.weapon || !this.isWeaponReady()) return;
		if (this.weapon.cooldown) {
			this.weapon.cooldown.start();
		}
		this.weapon.fire(this.entity, angle, effectSystem);
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
		this.chips.forEach(chip => {
			if (chip?.onUpdate) chip.onUpdate(this.entity);
		});
		this.weapon?.cooldown?.update();
	}
}
