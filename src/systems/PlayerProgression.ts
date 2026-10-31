/**
 * Прогресс игрока: уровень, опыт и порог до следующего уровня.
 */
export class PlayerProgression {
	level = 1;
	experience = 0;

	/** Опыт, необходимый для перехода на следующий уровень (level * 100). */
	get experienceToNext(): number {
		return this.level * 100;
	}

	/** Текущий прогресс до следующего уровня в диапазоне 0..1 (для HUD). */
	get progress(): number {
		return this.experience / this.experienceToNext;
	}

	/**
	 * Добавляет опыт; при достижении порога повышает уровень и сбрасывает счётчик.
	 * Излишки опыта переносятся на следующий уровень.
	 * @param amount - Количество опыта
	 * @returns true, если был переход на новый уровень
	 */
	add(amount: number): boolean {
		this.experience += amount;
		if (this.experience >= this.experienceToNext) {
			this.experience -= this.experienceToNext;
			this.level++;
			return true;
		}
		return false;
	}
}
