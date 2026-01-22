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
		if (!this.weapon || !this.entity.cooldowns.isReady('fire')) return;
		this.entity.cooldowns.start('fire');
		this.weapon.fire(this.entity, angle, effectSystem);
	}

	update(): void {
		this.chips.forEach(chip => {
			if (chip?.onUpdate) chip.onUpdate(this.entity);
		});
	}
}
