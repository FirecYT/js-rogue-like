/**
 * Прогресс игрока: уровень, опыт и порог до следующего уровня.
 */
export class PlayerProgression {
	level = 1;
	experience = 0;

	/** Опыт, необходимый для перехода на следующий уровень (level * 100). */
	get experienceToNext(): number {
		return Math.floor(this.level * 100);
	}

	/**
	 * Добавляет опыт; при достижении порога повышает уровень и сбрасывает счётчик.
	 * @param amount - Количество опыта
	 * @returns true, если был переход на новый уровень
	 */
	add(amount: number): boolean {
		this.experience += amount;
		if (this.experience >= this.experienceToNext) {
			this.level++;
			this.experience -= this.experienceToNext;
			return true;
		}
		return false;
	}
}
