import { describe, it, expect } from 'vitest';
import { DashChip } from '../src/items/chips/DashChip';
import { HealChip } from '../src/items/chips/HealChip';
import { NovaChip } from '../src/items/chips/NovaChip';
import { ShieldChip } from '../src/items/chips/ShieldChip';
import { TeleportChip } from '../src/items/chips/TeleportChip';
import {
	DamagePlusModifier,
	DamageMultModifier,
	MulticastModifier,
	SinusoidalModifier,
	SplitModifier,
} from '../src/items/modifiers/catalog';
import { freshCastState } from '../src/items/CastState';
import { InputMapper } from '../src/input/InputMapper';
import { InputAction } from '../src/input/InputAction';
import Entity from '../src/entities/Entity';

/** Минимальная конкретная сущность для проверки чипов. */
class DummyEntity extends Entity {
	render(): void {
		// не используется в тестах
	}
}

/**
 * Настраиваемость параметров предметов (админ-панель полигона):
 * поля экземпляров существуют, имеют игровые значения по умолчанию
 * и реально влияют на поведение.
 */
describe('Настраиваемые параметры предметов', () => {
	it('DashChip: множитель по умолчанию 3 и применяется к скорости', () => {
		const chip = new DashChip();
		const dummy = new DummyEntity(0, 0, 10);
		expect(chip.multiplier).toBe(3);
		chip.use(dummy);
		expect(dummy.speedMultiplier).toBeCloseTo(3);
		chip.multiplier = 10;
		// снятие текущего рывка использует применённый множитель
		dummy.speedMultiplier = 1;
		chip.use(dummy);
		expect(dummy.speedMultiplier).toBeCloseTo(10);
		chip.onUnequip(dummy);
		expect(dummy.speedMultiplier).toBeCloseTo(1);
	});

	it('HealChip: объём лечения настраивается', () => {
		const chip = new HealChip();
		const dummy = new DummyEntity(0, 0, 1000);
		expect(chip.amount).toBe(300);
		dummy.setHP(100);
		chip.amount = 50;
		chip.use(dummy);
		expect(dummy.getHP()).toBe(150);
	});

	it('NovaChip: урон и радиус — поля экземпляра с игровыми дефолтами', () => {
		const chip = new NovaChip();
		expect(chip.damage).toBe(40);
		expect(chip.radius).toBe(140);
		chip.damage = 100;
		chip.radius = 300;
		expect(chip.damage).toBe(100);
		expect(chip.radius).toBe(300);
	});

	it('ShieldChip/TeleportChip: длительность и дальность настраиваются', () => {
		const shield = new ShieldChip();
		expect(shield.activeCooldown.getMaximum()).toBe(240);
		shield.activeCooldown.setDuration(600);
		expect(shield.activeCooldown.getMaximum()).toBe(600);

		const teleport = new TeleportChip();
		expect(teleport.distance).toBe(100);
		teleport.distance = 500;
		const dummy = new DummyEntity(0, 0, 10);
		teleport.use(dummy);
		const dist = Math.hypot(dummy.x, dummy.y);
		expect(dist).toBeCloseTo(500, 3);
	});

	it('модификаторы: настраиваемые значения влияют на состояние каста', () => {
		const plus = new DamagePlusModifier();
		expect(plus.bonus).toBe(3);
		plus.bonus = 30;
		let state = freshCastState();
		plus.applyToCast(state);
		expect(state.damageAdd).toBe(30);

		const mult = new DamageMultModifier();
		expect(mult.factor).toBe(2);
		mult.factor = 8;
		state = freshCastState();
		mult.applyToCast(state);
		expect(state.damageMult).toBe(8);

		const multi = new MulticastModifier();
		multi.count = 5;
		multi.spread = 1;
		state = freshCastState();
		multi.applyToCast(state);
		expect(state.copies).toBe(5);
		expect(state.spread).toBe(1);

		const wave = new SinusoidalModifier();
		wave.amplitude = 60;
		wave.frequency = 0.5;
		state = freshCastState();
		wave.applyToCast(state);
		expect(state.wave).toEqual({ amplitude: 60, frequency: 0.5 });

		const split = new SplitModifier();
		expect(split.count).toBe(3);
		split.count = 7;
		state = freshCastState();
		split.applyToCast(state);
		expect(state.copies).toBe(7);
	});

	it('F9 привязан к действию Admin', () => {
		const mapper = new InputMapper();
		expect(mapper.getBindings().get(InputAction.Admin)).toEqual(['F9']);
	});
});
