// src/ui/windows/HudScreen.ts
import { Component } from '../Component';
import MouseInput from '../../components/MouseInput';
import Engine from '../../components/Engine';
import { PlayerProgression } from '../../systems/PlayerProgression';
import Entity from '../../entities/Entity';
import { HorizontalLayout } from '../containers/HorizontalLayout';
import { ItemSlot } from '../components/ItemSlot';
import { VerticalLayout } from '../containers/VerticalLayout';

/**
 * Улучшенный современный HUD
 */
export class HudScreen extends Component {
	private engine: Engine;
	private getControlledEntity: () => Entity;
	private playerProgression: PlayerProgression | null = null;

	// Контейнеры
	private weaponBar: HorizontalLayout;  // Оружие + модификаторы (слева внизу)
	private chipsBar: VerticalLayout;     // Чипы (справа над ХП)
	private hpBarContainer: VerticalLayout; // Контейнер ХП + чипов

	// Слоты для отслеживания состояния
	private weaponSlot: ItemSlot | null = null;
	private modifierSlots: ItemSlot[] = [];

	// Настройки размеров
	private readonly CHIP_SIZE = 50;
	private readonly WEAPON_SLOT_WIDTH = 80;
	private readonly WEAPON_SLOT_HEIGHT = 60;
	private readonly MODIFIER_SLOT_SIZE = 50;
	private readonly HP_BAR_WIDTH = 12;
	private readonly EXP_BAR_HEIGHT = 6;

	// Отслеживание состояния для обновления
	private lastWeaponId: string | null = null;
	private lastModifierCount = 0;

	constructor(engine: Engine, getControlledEntity: () => Entity) {
		super();
		this.engine = engine;
		this.getControlledEntity = getControlledEntity;

		// === ПАНЕЛЬ ОРУЖИЯ И МОДИФИКАТОРОВ (слева внизу) ===
		this.weaponBar = new HorizontalLayout();
		this.weaponBar.x = 10;
		this.weaponBar.y = engine.canvas.height - 80;
		this.weaponBar.spacing = 8;

		// === ПАНЕЛЬ ЗДОРОВЬЯ И ЧИПОВ (справа внизу) ===
		this.hpBarContainer = new VerticalLayout();
		this.hpBarContainer.spacing = 10;
		this.hpBarContainer.padding = { top: 10, right: 10, bottom: 10, left: 10 };

		// Панель чипов
		this.chipsBar = new VerticalLayout();
		this.chipsBar.spacing = 5;
		this.hpBarContainer.addChild(this.chipsBar);

		// Инициализация чип-слотов
		for (let i = 0; i < 5; i++) {
			const slot = new ItemSlot(this.CHIP_SIZE, this.CHIP_SIZE);
			this.chipsBar.addChild(slot);
		}
	}

	/**
	 * Установить прогресс игрока
	 */
	setPlayerProgression(progression: PlayerProgression): void {
		this.playerProgression = progression;
	}

	/**
	 * Обновление состояния
	 */
	update(mouse: MouseInput): void {
		const entity = this.getControlledEntity();
		if (!entity) return;

		// Обновляем оружие и модификаторы
		this.updateWeaponBar(entity);

		// Обновляем чипы
		const chipSlots = this.chipsBar.children as ItemSlot[];
		for (let i = 0; i < Math.min(chipSlots.length, entity.inventory.chips.length); i++) {
			chipSlots[i].setItem(entity.inventory.chips[i]);
		}

		// Обновляем компоненты
		this.weaponBar.update(mouse, this.weaponBar.x, this.weaponBar.y);
		this.hpBarContainer.x = this.engine.canvas.width - this.hpBarContainer.width - 10;
		this.hpBarContainer.y = this.engine.canvas.height - this.hpBarContainer.height - 10;
		this.hpBarContainer.update(mouse, this.hpBarContainer.x, this.hpBarContainer.y);
	}

	/**
	 * Обновление панели оружия и модификаторов
	 */
	private updateWeaponBar(entity: Entity): void {
		const currentWeapon = entity.inventory.weapon;
		const currentModifiers = entity.inventory.modifiers;

		// Определяем, нужно ли пересоздать слоты
		const weaponChanged = currentWeapon?.id !== this.lastWeaponId;
		const modifiersCountChanged = currentModifiers.length !== this.lastModifierCount;

		if (weaponChanged || modifiersCountChanged) {
			// Очищаем старые слоты
			this.weaponBar.children = [];
			this.modifierSlots = [];

			// Создаём новый слот оружия
			if (currentWeapon) {
				this.weaponSlot = new ItemSlot(
					this.WEAPON_SLOT_WIDTH,
					this.WEAPON_SLOT_HEIGHT,
					currentWeapon
				);
				this.weaponBar.addChild(this.weaponSlot);
				this.lastWeaponId = currentWeapon.id;
			} else {
				this.weaponSlot = null;
				this.lastWeaponId = null;
			}

			// Создаём слоты модификаторов
			for (const modifier of currentModifiers) {
				const modSlot = new ItemSlot(
					this.MODIFIER_SLOT_SIZE,
					this.MODIFIER_SLOT_SIZE,
					modifier
				);
				this.weaponBar.addChild(modSlot);
				this.modifierSlots.push(modSlot);
			}

			this.lastModifierCount = currentModifiers.length;
		} else {
			// Просто обновляем предметы в существующих слотах
			if (this.weaponSlot && currentWeapon) {
				this.weaponSlot.setItem(currentWeapon);
			}

			for (let i = 0; i < this.modifierSlots.length; i++) {
				this.modifierSlots[i].setItem(currentModifiers[i]);
			}
		}
	}

	/**
	 * Отрисовка
	 */
	render(ctx: CanvasRenderingContext2D): void {
		const entity = this.getControlledEntity();
		if (!entity) return;

		// === ПОЛОСА ОПЫТА (вверху экрана) ===
		this.renderExperienceBar(ctx);

		// === ПОЛОСА ЗДОРОВЬЯ И ЧИПЫ (справа внизу) ===
		this.renderHealthBar(ctx, entity);

		// === ПАНЕЛЬ ОРУЖИЯ И МОДИФИКАТОРОВ (слева внизу) ===
		this.weaponBar.render(ctx, 0, 0);
	}

	/**
	 * Отрисовка полосы опыта
	 */
	private renderExperienceBar(ctx: CanvasRenderingContext2D): void {
		if (!this.playerProgression) return;

		const width = this.engine.canvas.width;
		const height = this.EXP_BAR_HEIGHT;
		const y = 0;

		// Фон полосы
		const gradientBg = ctx.createLinearGradient(0, y, width, y);
		gradientBg.addColorStop(0, '#1a3a1a');
		gradientBg.addColorStop(1, '#0a2a0a');
		ctx.fillStyle = gradientBg;
		ctx.fillRect(0, y, width, height);

		// Прогресс
		const progress = this.playerProgression.experience / this.playerProgression.experienceToNext;
		const progressWidth = width * progress;

		const gradientProgress = ctx.createLinearGradient(0, y, progressWidth, y);
		gradientProgress.addColorStop(0, '#4caf50');
		gradientProgress.addColorStop(1, '#8bc34a');
		ctx.fillStyle = gradientProgress;
		ctx.fillRect(0, y, progressWidth, height);
	}

	/**
	 * Отрисовка полосы здоровья и чипов
	 */
	private renderHealthBar(ctx: CanvasRenderingContext2D, entity: Entity): void {
		const hp = entity.getHP();
		const maxHp = entity.maxHP;
		const hpPercent = hp / maxHp;

		const barWidth = this.HP_BAR_WIDTH;
		const barHeight = this.chipsBar.height + this.hpBarContainer.padding.top + this.hpBarContainer.padding.bottom;
		const x = this.hpBarContainer.x;
		const y = this.hpBarContainer.y;

		// Фон полосы здоровья
		ctx.fillStyle = '#1a0a0a';
		ctx.fillRect(x - barWidth - 15, y, barWidth, barHeight);

		// Прогресс здоровья
		const progressHeight = barHeight * hpPercent;

		const gradientHp = ctx.createLinearGradient(
			x - barWidth - 15,
			y + barHeight - progressHeight,
			x - 15,
			y + barHeight
		);

		if (hpPercent > 0.6) {
			gradientHp.addColorStop(0, '#4caf50');
			gradientHp.addColorStop(1, '#8bc34a');
		} else if (hpPercent > 0.3) {
			gradientHp.addColorStop(0, '#ff9800');
			gradientHp.addColorStop(1, '#ffc107');
		} else {
			gradientHp.addColorStop(0, '#f44336');
			gradientHp.addColorStop(1, '#e91e63');
		}

		ctx.fillStyle = gradientHp;
		ctx.fillRect(
			x - barWidth - 15,
			y + barHeight - progressHeight,
			barWidth,
			progressHeight
		);

		// Отрисовка чипов
		this.chipsBar.render(ctx, x, y);
	}
}
