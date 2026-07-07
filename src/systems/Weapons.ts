// ============================================================
// Weapons.ts — 무기 시스템 (자동 공격)
// 판 안 성장(①): 무기를 얻고 레벨을 올리면 이번 판 동안 강해집니다.
// 실제 무기 성능(데미지/쿨다운/개수)을 레벨로 계산하는 곳.
// ============================================================
import Phaser from 'phaser';
import { COLORS, WeaponId } from '../config';
import type GameScene from '../scenes/GameScene';
import Enemy from '../entities/Enemy';

interface WeaponState {
  level: number;
  cooldownLeft: number;
  tickTimer: number;
}

export const MAX_WEAPONS = 4;

export default class WeaponSystem {
  private scene: GameScene;
  private weapons = new Map<WeaponId, WeaponState>();
  private aura?: Phaser.GameObjects.Image;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  // ---- 조회용 ----
  has(id: WeaponId): boolean {
    return this.weapons.has(id);
  }
  level(id: WeaponId): number {
    return this.weapons.get(id)?.level ?? 0;
  }
  get count(): number {
    return this.weapons.size;
  }
  canAddNew(): boolean {
    return this.weapons.size < MAX_WEAPONS;
  }

  // 무기 획득 또는 레벨업
  addOrLevel(id: WeaponId): void {
    const w = this.weapons.get(id);
    if (w) {
      w.level += 1;
    } else {
      this.weapons.set(id, { level: 1, cooldownLeft: 300, tickTimer: 0 });
      if (id === 'campfire') this.ensureAura();
    }
  }

  private ensureAura(): void {
    if (this.aura) return;
    this.aura = this.scene.add
      .image(0, 0, 'circle')
      .setTint(COLORS.campfire)
      .setAlpha(0.2)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(4);
  }

  // ---- 매 프레임 ----
  update(delta: number): void {
    const p = this.scene.player;
    const haste = p.hasteMult;

    // 야자열매(투사체, 가장 가까운 적 자동 조준)
    const coco = this.weapons.get('coconut');
    if (coco) {
      coco.cooldownLeft -= delta;
      if (coco.cooldownLeft <= 0) {
        this.fireCoconut(coco.level, p.powerMult);
        coco.cooldownLeft = Math.max(280, 620 - (coco.level - 1) * 45) * haste;
      }
    }

    // 불가사리 표창(관통)
    const star = this.weapons.get('starfish');
    if (star) {
      star.cooldownLeft -= delta;
      if (star.cooldownLeft <= 0) {
        this.fireStarfish(star.level, p.powerMult);
        star.cooldownLeft = Math.max(600, 1400 - (star.level - 1) * 90) * haste;
      }
    }

    // 모닥불(오라, 지속 데미지)
    const fire = this.weapons.get('campfire');
    if (fire && this.aura) {
      const radius = 66 + fire.level * 12;
      this.aura.setPosition(p.x, p.y).setDisplaySize(radius * 2, radius * 2);
      fire.tickTimer -= delta;
      if (fire.tickTimer <= 0) {
        fire.tickTimer = 450; // 0.45초마다
        const dmg = (6 + fire.level * 3) * p.powerMult;
        this.damageInRadius(p.x, p.y, radius, dmg);
      }
    }
  }

  private fireCoconut(level: number, power: number): void {
    const p = this.scene.player;
    const count = 1 + Math.floor(level / 2); // Lv1:1 Lv2:2 Lv4:3 Lv6:4 발
    const dmg = (12 + level * 5) * power;
    const targets = this.scene.getNearestEnemies(p.x, p.y, count);
    if (targets.length === 0) return; // 적 없으면 아끼기
    for (let i = 0; i < count; i++) {
      let angle: number;
      const t = targets[i] ?? targets[0];
      angle = Math.atan2(t.y - p.y, t.x - p.x);
      if (i > 0 && !targets[i]) angle += Phaser.Math.FloatBetween(-0.4, 0.4); // 남는 발은 부채꼴
      this.scene.spawnProjectile(p.x, p.y, angle, 480, dmg, 0, COLORS.coconut, 9);
    }
  }

  private fireStarfish(level: number, power: number): void {
    const p = this.scene.player;
    const dmg = (10 + level * 4) * power;
    const pierce = 2 + level;
    const nearest = this.scene.getNearestEnemies(p.x, p.y, 1)[0];
    const baseAngle = nearest
      ? Math.atan2(nearest.y - p.y, nearest.x - p.x)
      : Phaser.Math.FloatBetween(0, Math.PI * 2);
    const shots = level >= 4 ? 2 : 1; // 4레벨부터 반대방향으로 하나 더
    for (let i = 0; i < shots; i++) {
      const a = baseAngle + (i === 1 ? Math.PI : 0);
      this.scene.spawnProjectile(p.x, p.y, a, 380, dmg, pierce, COLORS.starfish, 13, 'star', 420);
    }
  }

  private damageInRadius(x: number, y: number, r: number, dmg: number): void {
    const r2 = r * r;
    this.scene.getActiveEnemies().forEach((e: Enemy) => {
      const dx = e.x - x;
      const dy = e.y - y;
      if (dx * dx + dy * dy <= r2) this.scene.damageEnemy(e, dmg, false);
    });
  }

  destroy(): void {
    this.aura?.destroy();
    this.aura = undefined;
    this.weapons.clear();
  }
}
