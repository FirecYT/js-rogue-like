import { describe, it, expect } from 'vitest';
import { InputMapper } from '../src/input/InputMapper';
import { InputAction } from '../src/input/InputAction';

/**
 * InputMapper: дефолтные привязки и ремап (используется настройками).
 */
describe('InputMapper', () => {
	it('дефолты: WASD/стрелки, E — взаимодействие, Tab — инвентарь', () => {
		const mapper = new InputMapper();
		const bindings = mapper.getBindings();
		expect(bindings.get(InputAction.MoveUp)).toEqual(['KeyW', 'ArrowUp']);
		expect(bindings.get(InputAction.Interact)).toContain('KeyE');
		expect(bindings.get(InputAction.Inventory)).toContain('Tab');
	});

	it('rebind заменяет привязку действия', () => {
		const mapper = new InputMapper();
		mapper.rebind(InputAction.Dash, ['Space']);
		expect(mapper.getBindings().get(InputAction.Dash)).toEqual(['Space']);
		// Остальные действия не затронуты
		expect(mapper.getBindings().get(InputAction.MoveUp)).toEqual([
			'KeyW',
			'ArrowUp',
		]);
	});

	it('ремап одного экземпляра не влияет на другой', () => {
		const a = new InputMapper();
		const b = new InputMapper();
		a.rebind(InputAction.MoveUp, ['KeyI']);
		expect(b.getBindings().get(InputAction.MoveUp)).toEqual([
			'KeyW',
			'ArrowUp',
		]);
	});
});
