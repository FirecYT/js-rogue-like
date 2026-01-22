export class PlayerProgression {
	level = 1;
	experience = 0;

	get experienceToNext() {
		return Math.floor(this.level * 100);
	}

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
