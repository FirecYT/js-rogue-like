import type { ISystem, IRenderable } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import type FloatingText from '../components/FloatingText';

/**
 * Система всплывающих текстов: управление жизненным циклом и отрисовка.
 * Обновляет тексты и удаляет завершившиеся (hp <= 0).
 */
export class FloatingTextSystem implements ISystem, IRenderable {
	public readonly phase = UpdatePhase.Effects;
	public enabled = true;

	private texts: FloatingText[] = [];

	/**
	 * Добавляет новый всплывающий текст.
	 * @param text - Всплывающий текст для добавления
	 */
	add(text: FloatingText): void {
		this.texts.push(text);
	}

	/**
	 * Добавляет несколько всплывающих текстов.
	 * @param texts - Массив всплывающих текстов
	 */
	addMultiple(texts: FloatingText[]): void {
		this.texts.push(...texts);
	}

	/**
	 * Обновляет все тексты и удаляет завершившиеся.
	 */
	update(): void {
		for (let i = this.texts.length - 1; i >= 0; i--) {
			this.texts[i].update();
			if (this.texts[i].isDead()) {
				this.texts.splice(i, 1);
			}
		}
	}

	/**
	 * Отрисовывает все активные всплывающие тексты.
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		for (const text of this.texts) {
			text.render(ctx);
		}
	}

	/**
	 * Возвращает количество активных текстов (для отладки).
	 */
	get count(): number {
		return this.texts.length;
	}

	/**
	 * Удаляет все тексты (при уничтожении мира или сбросе уровня).
	 */
	clear(): void {
		this.texts.length = 0;
	}

	/**
	 * Освобождение ресурсов.
	 */
	dispose(): void {
		this.clear();
	}
}
