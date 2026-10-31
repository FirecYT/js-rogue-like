import GameObject from '../components/GameObject';
import { Inventory } from '../components/Inventory';
import { eventBus } from '../events/EventBus';
import type { Team } from '../types/Team';

/**
 * Базовый класс сущности: инвентарь, получение урона, события смерти и убийства.
 */
export default abstract class Entity extends GameObject {
	public inventory: Inventory;

	/** Базовая скорость сущности (задаётся подклассами/определениями). */
	private baseSpeedValue = 2;
	/**
	 * Временный множитель скорости (рывки и подобные эффекты).
	 * Эффекты умножают и делят его попарно, поэтому не накапливается навсегда.
	 */
	public speedMultiplier = 1;

	/** Эффективная скорость = базовая × множитель. */
	get speed(): number {
		return this.baseSpeedValue * this.speedMultiplier;
	}

	set speed(value: number) {
		this.baseSpeedValue = value;
	}
	/** Ширина хитбокса в пикселях (для коллизий с тайлами). */
	public width = 8;
	/** Высота хитбокса в пикселях (для коллизий с тайлами). */
	public height = 8;
	/**
	 * Переживает ли сущность очистку мёртвых (CleanupSystem).
	 * true для сущностей, которые респавнятся сами (например, тренировочный манекен).
	 */
	public readonly persistent: boolean = false;
	/** Фракция сущности (кто её союзники и противники). */
	public team: Team = 'neutral';
	/** Может ли сущность быть поражена снарядами/зонами урона. */
	public targetable = true;
	/** Участвует ли сущность в расталкивании с другими сущностями. */
	public solid = true;

	/**
	 * @param x - Мировая координата X
	 * @param y - Мировая координата Y
	 * @param hp - Здоровье
	 */
	constructor(x: number, y: number, hp: number) {
		super(x, y, hp);
		this.inventory = new Inventory(this);
	}

	/**
	 * Наносит урон сущности; при смерти испускает entityKilled (если есть атакующий) и entityDied.
	 * @param damage - Количество урона
	 * @param attacker - Сущность, нанёсшая урон (опционально)
	 */
	takeDamage(damage: number, attacker?: Entity): void {
		if (this.isDead()) return;
		this.hp -= damage;
		if (this.hp <= 0) {
			if (attacker) {
				eventBus.emit('entityKilled', {
					killer: attacker,
					victim: this,
				});
			}
			eventBus.emit('entityDied', { entity: this });
		}
	}

	/**
	 * Восстанавливает здоровье, не превышая максимум.
	 * @param amount - Количество восстановления
	 */
	heal(amount: number): void {
		this.hp = Math.min(this.maxHP, this.hp + amount);
	}

	/**
	 * Собирает данные о текущих перезарядках (чипы и оружие) для отображения.
	 * @returns Массив { name, val } (val — прогресс перезарядки 0..1)
	 */
	getCooldowns(): { name: string; val: number }[] {
		const cooldowns: { name: string; val: number }[] = [];
		for (const chip of this.inventory.chips) {
			if (chip && chip.cooldown && !chip.cooldown.isReady()) {
				cooldowns.push({
					name: chip.name,
					val: chip.cooldown.progress(),
				});
			}
		}
		if (
			this.inventory.weapon?.cooldown &&
			!this.inventory.weapon.cooldown.isReady()
		) {
			cooldowns.push({
				name: 'fire',
				val: this.inventory.weapon.cooldown.progress(),
			});
		}
		return cooldowns;
	}

	/**
	 * Опциональный метод обновления логики сущности (переопределяется в подклассах).
	 * По умолчанию ничего не делает.
	 */
	update(): void {
		// Override in subclasses
	}
}
