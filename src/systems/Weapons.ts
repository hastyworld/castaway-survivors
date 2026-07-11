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
  harpoon: { passive: 'speed', need: 3, name: '⚡ 번개 작살', desc: '꿰뚫는 번개 작살 3연발!' },
  urchin: { passive: 'maxhp', need: 3, name: '🌵 가시 폭풍', desc: '가시가 더 많이, 더 크게!' },
  wave: { passive: 'regen', need: 3, name: '🌊 해일', desc: '거대한 해일이 적을 쓸어버립니다!' },
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
  // 성게 가시 (플레이어 주위 회전)
  private spikes: Phaser.GameObjects.Image[] = [];
  private spikeAngle = 0;
  private spikeHitAt = new Map<Enemy, number>(); // 같은 적 연속 타격 방지

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
      const radius = ((fire.evolved ? 104 : 66) + fire.level * (fire.evolved ? 16 : 12)) * p.areaMult;
      this.aura.setPosition(p.x, p.y).setDisplaySize(radius * 2, radius * 2).setTint(fire.evolved ? 0xff5a2a : COLORS.campfire);
      fire.tickTimer -= delta;
      if (fire.tickTimer <= 0) {
        fire.tickTimer = fire.evolved ? 340 : 450;
        const dmg = (6 + fire.level * 3) * (fire.evolved ? 1.9 : 1) * p.powerMult;
        this.damageInRadius(p.x, p.y, radius, dmg);
      }
    }

    const harp = this.weapons.get('harpoon');
    if (harp) {
      harp.cooldownLeft -= delta;
      if (harp.cooldownLeft <= 0) {
        this.fireHarpoon(harp, p.powerMult);
        harp.cooldownLeft = Math.max(420, (harp.evolved ? 900 : 1150) - (harp.level - 1) * 70) * haste;
      }
    }

    const wv = this.weapons.get('wave');
    if (wv) {
      wv.cooldownLeft -= delta;
      if (wv.cooldownLeft <= 0) {
        const radius = ((wv.evolved ? 250 : 150) + wv.level * 16) * p.areaMult;
        const dmg = (9 + wv.level * 4) * (wv.evolved ? 1.7 : 1) * p.powerMult;
        this.scene.waveBlast(p.x, p.y, radius, dmg, wv.evolved ? 420 : 300, wv.evolved);
        wv.cooldownLeft = Math.max(1400, (wv.evolved ? 2300 : 2900) - (wv.level - 1) * 120) * haste;
      }
    }

    this.updateUrchin(delta);
  }

  // ---- 성게 가시: 플레이어 주위 회전 + 접촉 피해 ----
  private updateUrchin(delta: number): void {
    const st = this.weapons.get('urchin');
    if (!st) return;
    const p = this.scene.player;
    const want = (st.evolved ? 5 : 2) + Math.floor(st.level / 2);
    // 가시 개수 맞추기
    while (this.spikes.length < want) {
      const s = this.scene.add.image(p.x, p.y, 'urchin_p').setDepth(9);
      this.spikes.push(s);
    }
    while (this.spikes.length > want) this.spikes.pop()?.destroy();

    const orbitR = (64 + st.level * 6) * p.areaMult;
    const size = (st.evolved ? 34 : 24) * p.areaMult;
    this.spikeAngle += delta * 0.001 * (st.evolved ? 4.2 : 3.0); // 회전 속도(rad/s)
    const dmg = (8 + st.level * 3) * (st.evolved ? 1.6 : 1) * p.powerMult;
    const now = this.scene.time.now;
    const hitR2 = (size / 2 + 14) * (size / 2 + 14);

    this.spikes.forEach((s, i) => {
      const a = this.spikeAngle + (Math.PI * 2 * i) / this.spikes.length;
      s.setPosition(p.x + Math.cos(a) * orbitR, p.y + Math.sin(a) * orbitR);
      s.setDisplaySize(size, size);
      s.setRotation(a + Math.PI / 2);
    });

    // 접촉 판정 (같은 적은 0.4초에 한 번만)
    for (const e of this.scene.getActiveEnemies()) {
      const last = this.spikeHitAt.get(e) ?? 0;
      if (now - last < 400) continue;
      for (const s of this.spikes) {
        const dx = e.x - s.x;
        const dy = e.y - s.y;
        if (dx * dx + dy * dy <= hitR2 + e.displayWidth * e.displayWidth * 0.2) {
          this.scene.damageEnemy(e, dmg);
          this.spikeHitAt.set(e, now);
          break;
        }
      }
    }
    // 죽은 적 정리 (맵 무한 성장 방지)
    if (this.spikeHitAt.size > 120) {
      for (const k of this.spikeHitAt.keys()) if (!k.active) this.spikeHitAt.delete(k);
    }
  }

  private fireHarpoon(st: WeaponState, power: number): void {
    const p = this.scene.player;
    const level = st.level;
    const dmg = (16 + level * 6) * (st.evolved ? 1.5 : 1) * power;
    const pierce = 4 + level + (st.evolved ? 6 : 0);
    const nearest = this.scene.getNearestEnemies(p.x, p.y, 1)[0];
    if (!nearest) return;
    const base = Math.atan2(nearest.y - p.y, nearest.x - p.x);
    const shots = st.evolved ? 3 : 1;
    const tint = st.evolved ? 0xbfe8ff : 0xffffff;
    for (let i = 0; i < shots; i++) {
      const a = base + (i - (shots - 1) / 2) * 0.22;
      const proj = this.scene.spawnProjectile(p.x, p.y, a, 640, dmg, pierce, tint, 15 * p.areaMult, 'harpoon_p', 0);
      proj.setRotation(a); // 작살은 날아가는 방향을 향하게
      proj.setDisplaySize(46 * p.areaMult, 22 * p.areaMult);
    }
  }

  private fireCoconut(st: WeaponState, power: number): void {
    const p = this.scene.player;
    const level = st.level;
    const count = (st.evolved ? 3 : 1) + Math.floor(level / 2);
    const base = 12 + level * 5;
    const dmg = (st.evolved ? base * 1.6 : base) * power;
    const explodeR = (st.evolved ? 62 : 0) * p.areaMult;
    const tint = st.evolved ? 0xff7a3c : 0xffffff;
    const targets = this.scene.getNearestEnemies(p.x, p.y, count);
    if (targets.length === 0) return;
    for (let i = 0; i < count; i++) {
      const t = targets[i] ?? targets[0];
      let angle = Math.atan2(t.y - p.y, t.x - p.x);
      if (i > 0 && !targets[i]) angle += Phaser.Math.FloatBetween(-0.4, 0.4);
      this.scene.spawnProjectile(p.x, p.y, angle, 480, dmg, 0, tint, (st.evolved ? 13 : 11) * p.areaMult, 'coconut', 150, explodeR);
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
      this.scene.spawnProjectile(p.x, p.y, a, 380, dmg, pierce, 0xffffff, 14 * p.areaMult, 'starfish_p', 420);
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
    this.spikes.forEach((s) => s.destroy());
    this.spikes = [];
    this.spikeHitAt.clear();
    this.weapons.clear();
  }
}
