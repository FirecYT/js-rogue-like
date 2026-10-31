import type { ISystem, IRenderable, IUpdatable, IDisposable } from '../core/interfaces';

/**
 * Менеджер систем: регистрирует, обновляет и рисует системы по фазам.
 * Системы сортируются по phase при регистрации для гарантии правильного порядка выполнения.
 * Игровой цикл вызывает только update()/render() — никаких прямых зависимостей между системами.
 */
export class SystemManager implements IUpdatable, IDisposable {
	private systems: ISystem[] = [];

	/**
	 * Регистрирует систему в менеджере.
	 * Автоматически сортирует системы по phase после добавления.
	 * @param system - Система для регистрации
	 */
	register(system: ISystem): void {
		this.systems.push(system);
		this.systems.sort((a, b) => a.phase - b.phase);
	}

	/**
	 * Обновляет все включённые системы в порядке их фаз.
	 * Системы с enabled = false пропускаются.
	 */
	update(): void {
		for (const system of this.systems) {
			if (system.enabled) {
				system.update();
			}
		}
	}

	/**
	 * Обновляет только системы, помеченные runsWhilePaused
	 * (обработка ввода окон во время паузы).
	 */
	updateWhilePaused(): void {
		for (const system of this.systems) {
			if (system.enabled && system.runsWhilePaused) {
				system.update();
			}
		}
	}

	/**
	 * Отрисовывает все включённые системы, реализующие IRenderable (в порядке фаз).
	 * @param ctx - Контекст канваса (уже в мировых координатах)
	 */
	render(ctx: CanvasRenderingContext2D): void {
		for (const system of this.systems) {
			if (system.enabled && isRenderable(system)) {
				system.render(ctx);
			}
		}
	}

	/**
	 * Освобождает ресурсы всех систем и очищает реестр.
	 */
	dispose(): void {
		for (const system of this.systems) {
			system.dispose();
		}
		this.systems.length = 0;
	}
}

/**
 * Type guard: реализует ли система отрисовку.
 */
function isRenderable(system: ISystem): system is ISystem & IRenderable {
	return 'render' in system && typeof system.render === 'function';
}
