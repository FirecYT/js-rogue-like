import Keyboard from "../components/Keyboard";
import { InputAction } from "./InputAction";

/**
 * Тип для хранения привязок: действие -> массив кодов клавиш.
 * Массив нужен для поддержки альтернативных клавиш (например, W + ArrowUp).
 */
export type BindingMap = Map<InputAction, string[]>;

/**
 * Маппер абстрактных действий на физические клавиши.
 * Все контроллеры и системы запрашивают состояние через InputMapper,
 * а не через Keyboard напрямую.
 */
export class InputMapper {
	private bindings: Map<InputAction, string[]>;

	/**
	 * @param bindings - Начальные привязки. По умолчанию используются дефолтные биндинги.
	 */
	constructor(bindings?: BindingMap) {
		this.bindings = bindings ?? InputMapper.createDefaultBindings();
	}

	/**
   * Дефолтные биндинги: WASD + стрелки для движения, Shift для даша и т.д.
   */
	private static createDefaultBindings(): BindingMap {
		return new Map<InputAction, string[]>([
			[InputAction.MoveUp, ['KeyW', 'ArrowUp']],
			[InputAction.MoveDown, ['KeyS', 'ArrowDown']],
			[InputAction.MoveLeft, ['KeyA', 'ArrowLeft']],
			[InputAction.MoveRight, ['KeyD', 'ArrowRight']],
			[InputAction.Dash, ['ShiftLeft', 'ShiftRight']],
			[InputAction.Chip1, ['Digit1', 'KeyQ']],
			[InputAction.Chip2, ['Digit2']],
			[InputAction.Chip3, ['Digit3']],
			[InputAction.Chip4, ['Digit4']],
			[InputAction.Chip5, ['Digit5']],
			[InputAction.Interact, ['KeyE']],
			[InputAction.Inventory, ['Tab']],
			[InputAction.Fullscreen, ['F12']],
			[InputAction.Admin, ['F9']],
		]);
	}

	/**
	 * Переопределяет привязку для действия (для будущего UI rebinding).
	 * @param action - Действие для переназначения.
	 * @param keys - Новый массив кодов клавиш.
	 */
	rebind(action: InputAction, keys: string[]): void {
		this.bindings.set(action, [...keys]);
	}

	/**
	 * Возвращает текущие привязки (для сохранения в localStorage или отображения в UI).
	 */
	getBindings(): ReadonlyMap<InputAction, string[]> {
		return this.bindings;
	}

	/**
	 * Проверяет, удерживается ли действие (любая из привязанных клавиш).
	 */
	isDown(action: InputAction): boolean {
		const keyboard = Keyboard.getInstance();
		const keys = this.bindings.get(action);
		if (!keys) return false;
		return keys.some((k) => keyboard.isKeyDown(k));
	}

	/**
	 * Проверяет, было ли действие нажато в этом кадре (одноразовое нажатие).
	 */
	isPressed(action: InputAction): boolean {
		const keyboard = Keyboard.getInstance();
		const keys = this.bindings.get(action);
		if (!keys) return false;
		return keys.some((k) => keyboard.isKeyPressedOnce(k));
	}
}