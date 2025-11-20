import GameObject from '../../components/GameObject';
import { Pathfinder } from '../../world/Pathfinding';
import { WorldManager } from '../../world/WorldManager';

interface LegJoint {
	x: number;
	y: number;
}

interface SpiderLeg {
	phaseOffset: number; // 0 или π — для чередования
	base: LegJoint;      // точка крепления к корпусу
	knee: LegJoint;      // колено
	foot: LegJoint;      // стопа
	grounded: boolean;   // нога на земле?
}

export default class SpiderBoss extends GameObject {
	// Тело
	private bodyX = 0;
	private bodyY = 0;
	private bodyAngle = 0;

	// Ноги
	private legs: SpiderLeg[] = [];
	private walkCycle = 0; // 0..1 — фаза шага
	private isWalking = false;

	// Цель и ИИ
	private target: GameObject;
	private worldManager: WorldManager;
	private path: { x: number; y: number }[] = [];
	private pathCooldown = 0;

	// Параметры
	public experience = 300;
	private moveSpeed = 1.0;

	// Атаки
	private legAttackCooldown = 0;
	private laserCooldown = 0;
	private rocketCooldown = 0;
	private isChargingLaser = false;
	private laserCharge = 0;

	// Визуальные эффекты
	private sparks: { x: number; y: number; life: number }[] = [];

	constructor(x: number, y: number, target: GameObject, worldManager: WorldManager) {
		super(x, y, 200);
		this.target = target;
		this.worldManager = worldManager;

		for (let i = 0; i < 8; i++) {
			this.legs.push({
				phaseOffset: (i % 2) * Math.PI,
				base: { x: 0, y: 0 },
				knee: { x: 0, y: 0 },
				foot: { x: 0, y: 0 },
				grounded: true,
			});
		}

		this.bodyX = x;
		this.bodyY = y;
	}

	update() {
		// === ИИ ===
		this.updatePath();
		const distToTarget = Math.hypot(this.target.x - this.bodyX, this.target.y - this.bodyY);
		this.bodyAngle = Math.atan2(this.target.y - this.bodyY, this.target.x - this.bodyX);

		// === Движение ===
		this.isWalking = false;
		if (!this.isChargingLaser && this.path.length > 0 && distToTarget > 120) {
			this.followPath();
			this.isWalking = true;
		}

		// === Анимация шага ===
		if (this.isWalking) {
			this.walkCycle += 0.08;
			if (this.walkCycle > 1) this.walkCycle -= 1;
		}

		// === Обновление ног ===
		this.updateLegs();

		// === Атаки ===
		this.updateAttacks(distToTarget);

		// === Эффекты ===
		this.updateSparks();

		// === Синхронизация ===
		this.x = this.bodyX;
		this.y = this.bodyY;
	}

	private updatePath() {
		this.pathCooldown--;
		if (this.pathCooldown <= 0 || this.path.length === 0) {
			this.path = Pathfinder.findPath(this.bodyX, this.bodyY, this.target.x, this.target.y, this.worldManager).slice(1);
			this.pathCooldown = 80;
		}
	}

	private followPath() {
		if (this.path.length === 0) return;
		const next = this.path[0];
		const dx = next.x - this.bodyX;
		const dy = next.y - this.bodyY;
		const dist = Math.hypot(dx, dy);
		if (dist < 5) {
			this.path.shift();
			return;
		}
		const move = Math.min(this.moveSpeed, dist);
		const angle = Math.atan2(dy, dx);
		this.bodyX += Math.cos(angle) * move;
		this.bodyY += Math.sin(angle) * move;
	}

	private updateLegs() {
		const bodyWidth = 40;
		const bodyLength = 70;

		for (let i = 0; i < this.legs.length; i++) {
			const leg = this.legs[i];
			const side = i < 4 ? -1 : 1; // лево/право
			const posAlong = (i % 4) / 3; // 0..1 вдоль тела
			const offsetX = -bodyLength * 0.5 + posAlong * bodyLength;
			const offsetY = side * (bodyWidth * 0.5 + 5);

			// База ноги
			leg.base.x = this.bodyX + Math.cos(this.bodyAngle) * offsetX - Math.sin(this.bodyAngle) * offsetY;
			leg.base.y = this.bodyY + Math.sin(this.bodyAngle) * offsetX + Math.cos(this.bodyAngle) * offsetY;

			// Фаза шага
			const phase = (this.walkCycle + leg.phaseOffset) % (Math.PI * 2);
			const stepProgress = (phase / Math.PI) % 2; // 0..2
			const isLifting = stepProgress < 1;

			if (isLifting) {
				// Подъём и перенос ноги вперёд
				leg.grounded = false;
				const t = stepProgress; // 0..1
				const lift = Math.sin(t * Math.PI) * 25;
				const stepOffset = -30 + t * 60; // шаг на 60px вперёд

				const footX = leg.base.x + Math.cos(this.bodyAngle) * stepOffset;
				const footY = leg.base.y + Math.sin(this.bodyAngle) * stepOffset;

				leg.foot.x = footX;
				leg.foot.y = footY - lift; // подъём вверх

				// Колено — сгибание
				leg.knee.x = (leg.base.x + leg.foot.x) / 2 + Math.cos(this.bodyAngle + Math.PI / 2) * 10;
				leg.knee.y = (leg.base.y + leg.foot.y) / 2 + Math.sin(this.bodyAngle + Math.PI / 2) * 10;
			} else {
				// Опускание и упор
				leg.grounded = true;
				const t = stepProgress - 1; // 0..1
				const groundX = leg.base.x + Math.cos(this.bodyAngle) * 30;
				const groundY = leg.base.y + Math.sin(this.bodyAngle) * 30;

				leg.foot.x = leg.foot.x + (groundX - leg.foot.x) * t * 2;
				leg.foot.y = leg.foot.y + (groundY - leg.foot.y) * t * 2;

				leg.knee.x = (leg.base.x + leg.foot.x) / 2;
				leg.knee.y = (leg.base.y + leg.foot.y) / 2;

				// Искры при ударе об землю
				if (t > 0.9 && Math.random() < 0.3) {
					this.sparks.push({ x: leg.foot.x, y: leg.foot.y, life: 20 });
				}
			}
		}
	}

	private updateAttacks(distToTarget: number) {
		this.legAttackCooldown--;
		this.laserCooldown--;
		this.rocketCooldown--;

		// Eye Laser (дистанция > 150)
		if (!this.isChargingLaser && this.laserCooldown <= 0 && distToTarget > 150 && distToTarget < 400) {
			this.isChargingLaser = true;
			this.laserCharge = 0;
			return;
		}

		if (this.isChargingLaser) {
			this.laserCharge += 0.02;
			if (this.laserCharge >= 1) {
				this.isChargingLaser = false;
				this.laserCooldown = 180;
				// Выстрел лазера
				// (window as any).bullets?.push?.(new Bullet(
				//   this.bodyX + Math.cos(this.bodyAngle) * 20,
				//   this.bodyY + Math.sin(this.bodyAngle) * 20,
				//   this.bodyAngle,
				//   15,
				//   'laser'
				// ));
			}
			return;
		}

		// Leg Slam (ближняя)
		if (this.legAttackCooldown <= 0 && distToTarget < 120) {
			this.legAttackCooldown = 100;
			this.target.takeDamage(8);
			// Отбрасывание
			const dx = this.target.x - this.bodyX;
			const dy = this.target.y - this.bodyY;
			const dist = Math.max(1, Math.hypot(dx, dy));
			this.target.x += (dx / dist) * 20;
			this.target.y += (dy / dist) * 20;
		}
	}

	private updateSparks() {
		for (let i = this.sparks.length - 1; i >= 0; i--) {
			this.sparks[i].life--;
			if (this.sparks[i].life <= 0) this.sparks.splice(i, 1);
		}
	}

	isCollidingWithBullet(bulletX: number, bulletY: number): boolean {
		return Math.hypot(bulletX - this.bodyX, bulletY - this.bodyY) < 35;
	}

	render(ctx: CanvasRenderingContext2D): void {
		const hurt = this.getHP() < 60 && Math.floor(Date.now() / 120) % 2 === 0;

		// === Рендер ног (механических) ===
		ctx.strokeStyle = hurt ? '#f66' : '#aaa';
		ctx.lineWidth = 4;
		for (const leg of this.legs) {
			ctx.beginPath();
			ctx.moveTo(leg.base.x, leg.base.y);
			ctx.lineTo(leg.knee.x, leg.knee.y);
			ctx.lineTo(leg.foot.x, leg.foot.y);
			ctx.stroke();
		}

		// === Корпус (роботизированный) ===
		ctx.save();
		ctx.translate(this.bodyX, this.bodyY);
		ctx.rotate(this.bodyAngle);

		// Основной корпус
		ctx.fillStyle = hurt ? '#822' : '#333';
		ctx.fillRect(-35, -20, 70, 40);

		// Бронепластины
		ctx.strokeStyle = '#000';
		ctx.lineWidth = 1;
		for (let i = -30; i <= 30; i += 15) {
			ctx.beginPath();
			ctx.moveTo(i, -20);
			ctx.lineTo(i, 20);
			ctx.stroke();
		}

		// Глаза-лазеры
		ctx.fillStyle = this.isChargingLaser ? '#f00' : '#0f0';
		ctx.beginPath();
		ctx.arc(-12, -25, 6, 0, Math.PI * 2);
		ctx.arc(12, -25, 6, 0, Math.PI * 2);
		ctx.fill();

		// Зарядка лазера — визуальный луч
		if (this.isChargingLaser) {
			ctx.strokeStyle = `rgba(255, 0, 0, ${this.laserCharge})`;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(0, -25);
			ctx.lineTo(Math.cos(this.bodyAngle) * 50, Math.sin(this.bodyAngle) * 50 - 25);
			ctx.stroke();
		}

		ctx.restore();

		// === Искры ===
		ctx.fillStyle = '#ff0';
		for (const spark of this.sparks) {
			ctx.globalAlpha = spark.life / 20;
			ctx.beginPath();
			ctx.arc(spark.x, spark.y, 2 + spark.life / 10, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.globalAlpha = 1;

		// === Здоровье ===
		const barX = this.bodyX - 40;
		const barY = this.bodyY - 70;
		ctx.fillStyle = '#444';
		ctx.fillRect(barX, barY, 80, 8);
		const hp = this.getHP() / this.maxHP;
		ctx.fillStyle = hp > 0.5 ? '#4caf50' : hp > 0.25 ? '#ff9800' : '#f44336';
		ctx.fillRect(barX, barY, 80 * hp, 8);
		ctx.strokeStyle = '#000';
		ctx.strokeRect(barX, barY, 80, 8);
	}

	takeDamage(damage: number): void {
		super.takeDamage(damage);
		if (this.getHP() < 80) {
			this.moveSpeed = 1.4;
		}
	}
}
