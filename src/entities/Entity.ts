import GameObject from '../components/GameObject';
import { Inventory } from '../components/Inventory';
import { eventBus } from '../events/EventBus';

/**
 * Базовый класс сущности: инвентарь, получение урона, события смерти и убийства.
 */
export default abstract class Entity extends GameObject {
	public inventory: Inventory;
	public speed = 2;

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
	 * Наносит урон сущности; при смерти испускает enemyKilled (если есть атакующий) и entityDied.
	 * @param damage - Количество урона
	 * @param attacker - Сущность, нанёсшая урон (опционально)
	 */
	takeDamage(damage: number, attacker?: Entity): void {
		this.hp -= damage;
		if (this.hp <= 0) {
			if (attacker) {
				eventBus.emit('enemyKilled', { killer: attacker, victim: this });
			}
			eventBus.emit('entityDied', { entity: this });
		}
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
					val: chip.cooldown.progress()
				});
			}
		}
		if (this.inventory.weapon?.cooldown && !this.inventory.weapon.cooldown.isReady()) {
			cooldowns.push({
				name: 'fire',
				val: this.inventory.weapon.cooldown.progress()
			});
		}
		return cooldowns;
	}
}
