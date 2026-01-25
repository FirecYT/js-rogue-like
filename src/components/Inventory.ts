import { Weapon } from '../items/Weapon';
import { Chip } from '../items/Chip';
import Entity from '../entities/Entity';
import { EffectSystem } from '../systems/EffectSystem';
import { EffectModifier } from '../items/EffectModifier';

export class Inventory {
	public weapon: Weapon | null = null;
	public modifiers: EffectModifier[] = [];
	public chips: (Chip | null)[] = [null, null, null, null, null];

	constructor(public entity: Entity) { }

	setWeapon(weapon: Weapon | null): void {
		this.weapon = weapon;
		this.weapon?.onEquip?.(this.entity);
	}

	addChip(chip: Chip): boolean {
		const emptySlot = this.chips.findIndex(c => c === null);
		if (emptySlot === -1) return false;
		this.chips[emptySlot] = chip;
		chip.onEquip?.(this.entity);
		return true;
	}

	addModifier(mod: EffectModifier): boolean {
		if (this.weapon && this.modifiers.length >= this.weapon.modifiersSlots) return false;
		this.modifiers.push(mod);
		return true;
	}

	fire(angle: number, effectSystem: EffectSystem): void {
		if (!this.weapon || !this.isWeaponReady()) return;
		if (this.weapon.cooldown) {
			this.weapon.cooldown.start();
		}
		this.weapon.fire(this.entity, angle, effectSystem);
	}

	isWeaponReady(): boolean {
		if (!this.weapon) return false;
		return !this.weapon.cooldown || this.weapon.cooldown.isReady();
	}

	isChipReady(index: number): boolean {
		const chip = this.chips[index];
		if (!chip) return false;
		return !chip.cooldown || chip.cooldown.isReady();
	}

	useChip(index: number): void {
		const chip = this.chips[index];
		if (!chip || !chip.isActive || !this.isChipReady(index)) return;

		if (chip.cooldown) {
			chip.cooldown.start();
		}

		chip.use?.(this.entity);
	}

	update(): void {
		for (const chip of this.chips) {
			if (chip?.cooldown) {
				chip.cooldown.update();
			}
		}

		this.chips.forEach(chip => {
			if (chip?.onUpdate) chip.onUpdate(this.entity);
		});

		this.weapon?.cooldown.update();
	}
}
