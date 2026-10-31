import Entity from './Entity';
import { Interactable, HasPosition } from '../types/EntityTraits';
import { eventBus } from '../events/EventBus';

/**
 * NPC — неигровая интерактивная сущность: стоит на месте, при взаимодействии запускает диалог.
 * Используется для тестирования механик взаимодействия и катсцен.
 */
export default class NpcEntity extends Entity implements HasPosition, Interactable {
	public interactName: string;
	public interactRadius = 30;

	/** Массив строк диалога для катсцены. */
	private readonly dialogLines: string[];
	/** Цвет отображения NPC. */
	private readonly color: string;

	/**
	 * @param x - Мировая координата X
	 * @param y - Мировая координата Y
	 * @param name - Отображаемое имя (для подсказки)
	 * @param dialogLines - Строки диалога для катсцены
	 * @param color - Цвет отрисовки
	 */
	constructor(
		x: number,
		y: number,
		name: string,
		dialogLines: string[],
		color: string = '#0af'
	) {
		super(x, y, 999);
		this.interactName = name;
		this.dialogLines = dialogLines;
		this.color = color;
		this.width = 10;
		this.height = 10;
	}

	/**
	 * При взаимодействии эмитит событие cutsceneStart с диалоговыми строками.
	 * @param actor - Сущность, взаимодействующая с NPC
	 */
	interact(actor: Entity): void {
		void actor;
		eventBus.emit('cutsceneStart', { lines: [...this.dialogLines] });
	}

	/**
	 * NPC не получает урон (для тестовых целей).
	 */
	takeDamage(_damage: number, _attacker?: Entity): void {
		// игнорируем
	}

	/**
	 * Отрисовка: прямоугольник с обводкой и именем сверху.
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x - 5, this.y - 5, 10, 10);
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 1;
		ctx.strokeRect(this.x - 6, this.y - 6, 12, 12);

		ctx.fillStyle = '#fff';
		ctx.font = '8px Arial';
		ctx.textAlign = 'center';
		ctx.fillText(this.interactName, this.x, this.y - 12);
	}
}
