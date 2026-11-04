import Entity from './Entity';
import type { HasPosition } from '../types/EntityTraits';
import type { Interactable } from '../types/Interactable';
import Cooldown from '../components/Cooldown';

/**
 * Полевой медик: дружелюбный NPC в домах и городе. Взаимодействие
 * клавишей действия полностью лечит обратившегося; после приёма медик
 * «отдыхает» (долгая перезарядка), чтобы лечение не было бесконечным.
 */
export class Medic extends Entity implements HasPosition, Interactable {
	public readonly persistent: boolean = true;
	/** Перезарядка между приёмами пациентов. */
	private readonly healCooldown = new Cooldown(900);
	/** Колбэк первого успешного приёма (журнал открывает запись медика). */
	public onHeal: ((medic: Medic, actor: Entity) => void) | null = null;

	constructor(x: number, y: number) {
		super(x, y, 1);
		this.team = 'neutral';
		this.targetable = false;
		this.solid = true;
		this.width = 14;
		this.height = 14;
	}

	/** Подсказка взаимодействия зависит от готовности медика. */
	get interactLabel(): string {
		return this.healCooldown.isReady()
			? 'Получить помощь'
			: 'Медик отдыхает…';
	}

	/**
	 * Лечит обратившегося до полного здоровья (если тот ранен и медик готов).
	 * @param actor - Сущность, совершившая взаимодействие
	 */
	interact(actor: Entity): void {
		if (!this.healCooldown.isReady()) return;
		if (actor.isDead() || actor.getHP() >= actor.maxHP) return;
		actor.heal(actor.maxHP);
		this.healCooldown.start();
		this.onHeal?.(this, actor);
	}

	/** Тикает перезарядку приёма. */
	update(): void {
		this.healCooldown.update();
	}

	/**
	 * Отрисовка: фигура в белой накидке с красным крестом;
	 * во время «отдыха» крест гаснет.
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = '#e5e7eb';
		ctx.fillRect(this.x - 6, this.y - 9, 12, 18);
		ctx.strokeStyle = '#9ca3af';
		ctx.lineWidth = 1;
		ctx.strokeRect(this.x - 6, this.y - 9, 12, 18);
		ctx.fillStyle = this.healCooldown.isReady() ? '#dc2626' : '#6b7280';
		ctx.fillRect(this.x - 1.5, this.y - 5, 3, 10);
		ctx.fillRect(this.x - 5, this.y - 1.5, 10, 3);
	}
}
