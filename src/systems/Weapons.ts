// ============================================================
// Weapons.ts — 무기 시스템 (자동 공격) + 무기 진화(탕탕특공대 '돌파 조합')
// 판 안 성장(①): 무기 레벨업 → 최대레벨 + 특정 특성 보유 시 상위 무기로 진화.
// ============================================================
import Phaser from 'phaser';
import { COLORS, WeaponId, PassiveId } from '../config';
import { WEAPONS } from '../content';
import type GameScene from '../scenes/GameScene';
import Enemy from '../entities/Enemy';

interface WeaponState {
  level: number;
  cooldownLeft: number;
  tickTimer: number;
  evolved: boolean;
}

export const MAX_WEAPONS = 4;
export const MAX_LEVEL = 8;

// 진화 조건: 무기 최대레벨 + 지정 특성 need레벨 이상
export interface EvolveReq {
  passive: PassiveId;
  need: number;
  name: string;
  desc: string;
}
export const EVOLVE: Record<WeaponId, EvolveReq> = {
  coconut: { passive: 'power', need: 3, name: '💥 폭탄 야자', desc: '착탄 시 폭발 — 범위 피해!' },
  starfish: { passive: 'haste', need: 3, name: '🌀 회오리 표창', desc: '사방으로 표창 난사!' },
  campfire: { passive: 'magnet', need: 3, name: '🌋 화산', desc: '거대한 화염 범위 강타!' },
};

export interface BuildEntry {
  id: WeaponId;
  name: string;
  level: number;
  max: number;
  evolved: boolean;
}

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
  isMaxed(id: WeaponId): boolean {
    return (this.weapons.get(id)?.level ?? 0) >= MAX_LEVEL;
  }
  isEvolved(id: WeaponId): boolean {
    return this.weapons.get(id)?.evolved ?? false;
  }
  get count(): number {
    return this.weapons.size;
  }
  canAddNew(): boolean {
    return this.weapons.size < MAX_WEAPONS;
  }

  // 무기 획득 또는 레벨업 (최대레벨 상한)
  addOrLevel(id: WeaponId): void {
    const w = this.weapons.get(id);
    if (w) {
      w.level = Math.min(MAX_LEVEL, w.level + 1);
    } else {
      this.weapons.set(id, { level: 1, cooldownLeft: 300, tickTimer: 0, evolved: false });
      if (id === 'campfire') this.ensureAura();
    }
  }

  evolve(id: WeaponId): void {
    const w = this.weapons.get(id);
    if (w) w.evolved = true;
  }

  // 현재 빌드(장착 무기) — 일시정지 화면 표시용
  getBuild(): BuildEntry[] {
    const out: BuildEntry[] = [];
    for (const w of WEAPONS) {
      const st = this.weapons.get(w.id);
      if (st) out.push({ id: w.id, name: st.evolved ? EVOLVE[w.id].name : w.name, level: st.level, max: MAX_LEVEL, evolved: st.evolved });
    }
    return out;
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

    const coco = this.weapons.get('coconut');
    if (coco) {
      coco.cooldownLeft -= delta;
      if (coco.cooldownLeft <= 0) {
        this.fireCoconut(coco, p.powerMult);
        coco.cooldownLeft = Math.max(240, (coco.evolved ? 520 : 620) - (coco.level - 1) * 45) * haste;
      }
    }

    const star = this.weapons.get('starfish');
    if (star) {
      star.cooldownLeft -= delta;
      if (star.cooldownLeft <= 0) {
        this.fireStarfish(star, p.powerMult);
        star.cooldownLeft = Math.max(500, (star.evolved ? 1100 : 1400) - (star.level - 1) * 90) * haste;
      }
    }

    const fire = this.weapons.get('campfire');
    if (fire && this.aura) {
      const radius = (fire.evolved ? 104 : 66) + fire.level * (fire.evolved ? 16 : 12);
      this.aura.setPosition(p.x, p.y).setDisplaySize(radius * 2, radius * 2).setTint(fire.evolved ? 0xff5a2a : COLORS.campfire);
      fire.tickTimer -= delta;
      if (fire.tickTimer <= 0) {
        fire.tickTimer = fire.evolved ? 340 : 450;
        const dmg = (6 + fire.level * 3) * (fire.evolved ? 1.9 : 1) * p.powerMult;
        this.damageInRadius(p.x, p.y, radius, dmg);
      }
    }
  }

  private fireCoconut(st: WeaponState, power: number): void {
    const p = this.scene.player;
    const level = st.level;
    const count = (st.evolved ? 3 : 1) + Math.floor(level / 2);
    const base = 12 + level * 5;
    const dmg = (st.evolved ? base * 1.6 : base) * power;
    const explodeR = st.evolved ? 62 : 0;
    const tint = st.evolved ? 0xff7a3c : 0xffffff;
    const targets = this.scene.getNearestEnemies(p.x, p.y, count);
    if (targets.length === 0) return;
    for (let i = 0; i < count; i++) {
      const t = targets[i] ?? targets[0];
      let angle = Math.atan2(t.y - p.y, t.x - p.x);
      if (i > 0 && !targets[i]) angle += Phaser.Math.FloatBetween(-0.4, 0.4);
      this.scene.spawnProjectile(p.x, p.y, angle, 480, dmg, 0, tint, st.evolved ? 13 : 11, 'coconut', 150, explodeR);
    }
  }

  private fireStarfish(st: WeaponState, power: number): void {
    const p = this.scene.player;
    const level = st.level;
    const dmg = (10 + level * 4) * (st.evolved ? 1.5 : 1) * power;
    const pierce = 2 + level + (st.evolved ? 4 : 0);
    const nearest = this.scene.getNearestEnemies(p.x, p.y, 1)[0];
    const baseAngle = nearest ? Math.atan2(nearest.y - p.y, nearest.x - p.x) : Phaser.Math.FloatBetween(0, Math.PI * 2);
    const shots = st.evolved ? 6 : level >= 4 ? 2 : 1;
    for (let i = 0; i < shots; i++) {
      const a = st.evolved ? baseAngle + (i * Math.PI * 2) / shots : baseAngle + (i === 1 ? Math.PI : 0);
      this.scene.spawnProjectile(p.x, p.y, a, 380, dmg, pierce, 0xffffff, 14, 'starfish_p', 420);
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
