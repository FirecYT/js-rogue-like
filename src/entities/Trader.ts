import Entity from './Entity';
import type { HasPosition } from '../types/EntityTraits';
import type { Interactable } from '../types/Interactable';
import type { Item } from '../items/Item';

/**
 * Торговец руин: нейтральная точка бартера. Держит прилавок из трёх
 * предложений; обмен 1:1 — предмет игрока того же типа уходит на прилавок,
 * предложение торговца переходит игроку. Без валюты (лор: торговцы
 * пустошей не верят обещаниям, только вещам).
 */
export class Trader extends Entity implements HasPosition, Interactable {
	public readonly interactLabel = 'Торговать (бартер)';
	public readonly persistent: boolean = true;

	/**
	 * @param x - Мировая координата X
	 * @param y - Мировая координата Y
	 * @param offers - Начальные предложения прилавка (3 предмета)
	 */
	/** Колбэк открытия окна торговли (ставит ZoneFeatureSystem). */
	public onTrade: ((trader: Trader, actor: Entity) => void) | null = null;

	constructor(
		x: number,
		y: number,
		public readonly offers: (Item | null)[]
	) {
		super(x, y, 1);
		this.team = 'neutral';
		this.targetable = false;
		this.solid = true;
		this.width = 16;
		this.height = 16;
	}

	/**
	 * Открывает окно бартера через колбэк системы зон.
	 * @param actor - Сущность, начавшая торговлю
	 */
	interact(actor: Entity): void {
		this.onTrade?.(this, actor);
	}

	/**
	 * Бартер: меняет предложение прилавка на предмет слота игрока (того же типа).
	 * @param offerIndex - Индекс предложения прилавка
	 * @param playerItem - Предмет игрока для обмена
	 * @param receive - Колбэк передачи предмета игроку
	 * @returns Отданный игроком предмет (для установки в слот игрока) или null
	 */
	barter(
		offerIndex: number,
		playerItem: Item,
		receive: (offer: Item) => void
	): Item | null {
		const offer = this.offers[offerIndex];
		if (!offer || offer.type !== playerItem.type) return null;
		this.offers[offerIndex] = playerItem;
		receive(offer);
		return playerItem;
	}

	/**
	 * Отрисовка: капюшон торговца (синий ромб) с маркером прилавка.
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = '#1d4ed8';
		ctx.beginPath();
		ctx.moveTo(this.x, this.y - 10);
		ctx.lineTo(this.x + 8, this.y);
		ctx.lineTo(this.x, this.y + 10);
		ctx.lineTo(this.x - 8, this.y);
		ctx.closePath();
		ctx.fill();
		ctx.strokeStyle = '#93c5fd';
		ctx.lineWidth = 1;
		ctx.stroke();

		ctx.fillStyle = '#fbbf24';
		ctx.fillRect(this.x - 12, this.y + 12, 24, 4);
	}
}
