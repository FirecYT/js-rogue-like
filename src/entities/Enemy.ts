import Entity from './Entity';
import { Controllable, HasPosition, HasSpeed } from '../types/EntityTraits';
import { AiController } from '../controllers/AiController';
import { RebirthChip } from '../items/chips/RebirthChip';
import { IController } from '../controllers/Controller';
import { Pathfinder } from '../services/Pathfinder';
import { ShotgunWeapon } from '../items/weapons/ShotgunWeapon';
import { PistolWeapon } from '../items/weapons/PistolWeapon';

/**
 * Враждебная сущность: ИИ-контроллер, случайное оружие/чип перерождения, опыт при убийстве.
 */
export default class Enemy
	extends Entity
	implements HasPosition, HasSpeed, Controllable
{
	public controller: IController | null;

	public experience = 5;

	/**
	 * @param x - Мировая координата X
	 * @param y - Мировая координата Y
	 * @param player - Цель (игрок) для ИИ
	 * @param pathfinder - Система поиска пути для AiController
	 */
	constructor(
		x: number,
		y: number,
		private player: Entity,
		private pathfinder: Pathfinder
	) {
		super(x, y, 5);
		this.speed = 1;
		this.team = 'enemy';

		// Случайное оружие: 70% дробовик, 30% пистолет
		if (Math.random() > 0.3) {
			this.inventory.setWeapon(new ShotgunWeapon());
		} else {
			this.inventory.setWeapon(new PistolWeapon());
		}

		// Случайный чип перерождения
		if (Math.random() > 0.25) {
			this.inventory.addChip(new RebirthChip());
		}

		this.controller = new AiController(this.player, this.pathfinder);
	}

	/**
	 * Отрисовка: квадрат (красный/оранжевый при оружии), обводка, полоска HP.
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		const color = this.inventory.weapon ? '#f90' : '#f00';
		ctx.fillStyle = color;
		ctx.fillRect(this.x - 4, this.y - 4, 8, 8);
		if (this.inventory.weapon) {
			ctx.strokeStyle = '#ff0';
			ctx.lineWidth = 1;
			ctx.strokeRect(this.x - 5, this.y - 5, 10, 10);
		}
		const hpPercent = this.getHP() / this.maxHP;
		ctx.fillStyle = '#000';
		ctx.fillRect(this.x - 11, this.y - 13, 22, 4);
		ctx.fillStyle = '#0f0';
		ctx.fillRect(this.x - 10, this.y - 12, hpPercent * 20, 2);
	}
}
