import Cooldown from "./Cooldown";

export class CooldownManager {
	private cooldowns = new Map<string, Cooldown>();

	get(name: string): Cooldown | undefined {
		return this.cooldowns.get(name);
	}

	set(name: string, cooldown: Cooldown): this {
		this.cooldowns.set(name, cooldown);
		return this;
	}

	isReady(name: string): boolean {
		return this.cooldowns.get(name)?.isReady() ?? true;
	}

	start(name: string): void {
		this.cooldowns.get(name)?.start();
	}

	update(): void {
		for (const cd of this.cooldowns.values()) {
			cd.update();
		}
	}
}
