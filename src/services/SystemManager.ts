import type { ISystem, IUpdatable, IDisposable } from '../core/interfaces';

/**
 * Менеджер систем: регистрирует, включает/выключает, обновляет системы по фазам.
 * Системы сортируются по phase при регистрации для гарантии правильного порядка выполнения.
 * Игровой цикл вызывает только update() — больше никаких прямых зависимостей между системами.
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
	 * Удаляет систему из менеджера.
	 * @param system - Система для удаления
	 */
	unregister(system: ISystem): void {
		const idx = this.systems.indexOf(system);
		if (idx !== -1) {
			this.systems.splice(idx, 1);
		}
	}

	/**
	 * Включает систему в игровом цикле.
	 * @param system - Система для включения
	 */
	enable(system: ISystem): void {
		system.enabled = true;
	}

	/**
	 * Выключает систему в игровом цикле (можно использовать для сцен, паузы и т.д.).
	 * @param system - Система для выключения
	 */
	disable(system: ISystem): void {
		system.enabled = false;
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
	 * Освобождает ресурсы всех систем и очищает реестр.
	 */
	dispose(): void {
		for (const system of this.systems) {
			system.dispose();
		}
		this.systems.length = 0;
	}

	/**
	 * Возвращает список зарегистрированных систем (для отладки).
	 */
	getSystems(): readonly ISystem[] {
		return this.systems;
	}
}
