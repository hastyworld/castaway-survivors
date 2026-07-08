// ============================================================
// BossAI.ts — 보스 스킬 (돌진 / 투사체 / 소환 / 장판)
// 벤치마킹(탕탕특공대): 보스는 단순 추적이 아니라 예고 후 패턴 공격으로 위협.
// GameScene.update 의 적 이동 루프 '뒤'에 update() 를 호출해 이동을 덮어씀.
// ============================================================
import Phaser from 'phaser';
import type GameScene from '../scenes/GameScene';
import Enemy from '../entities/Enemy';
import { Sfx } from './Sfx';

type Ability = 'charge' | 'shoot' | 'summon' | 'aoe';

// 보스별 스킬 세트
const CONFIGS: Record<string, Ability[]> = {
  boss_kingcrab: ['summon', 'shoot'],
  boss_boarking: ['charge', 'summon'],
  boss_octopus: ['shoot', 'aoe'],
  boss_captain: ['shoot', 'summon'],
  boss_serpent: ['charge', 'shoot'],
  boss_lich: ['summon', 'aoe', 'shoot'],
};

const BASE_CD: Record<Ability, number> = { charge: 4200, shoot: 2600, summon: 6800, aoe: 5200 };

export default class BossAI {
  private scene: GameScene;
  private boss: Enemy;
  private abilities: Ability[];
  private cd: Record<Ability, number>;

  private action: 'none' | 'charge' | 'aoe' = 'none';
  private phase: 'tele' | 'active' = 'tele';
  private timer = 0;
  private dir = new Phaser.Math.Vector2();

  private aoeRing?: Phaser.GameObjects.Image;
  private aoeX = 0;
  private aoeY = 0;
  private aoeR = 96;

  constructor(scene: GameScene, boss: Enemy) {
    this.scene = scene;
    this.boss = boss;
    this.abilities = CONFIGS[boss.texture.key] ?? ['shoot'];
    // 초기 쿨다운은 살짝 늦게(등장 직후 2초쯤 첫 스킬)
    this.cd = { charge: 2600, shoot: 1800, summon: 3400, aoe: 3000 };
  }

  update(delta: number): void {
    if (!this.boss.active) return;
    if (this.action === 'charge') return this.updateCharge(delta);
    if (this.action === 'aoe') return this.updateAoe(delta);

    // 대기: 쿨다운 감소 → 준비된 스킬 하나 시전
    let ready: Ability | null = null;
    for (const ab of this.abilities) {
      this.cd[ab] -= delta;
      if (this.cd[ab] <= 0 && !ready) ready = ab;
    }
    if (ready) {
      this.cd[ready] = BASE_CD[ready];
      this.trigger(ready);
    }
  }

  private trigger(ab: Ability): void {
    if (ab === 'charge') this.startCharge();
    else if (ab === 'shoot') this.shoot();
    else if (ab === 'summon') this.summon();
    else if (ab === 'aoe') this.startAoe();
  }

  // ---- 돌진 ----
  private startCharge(): void {
    this.action = 'charge';
    this.phase = 'tele';
    this.timer = 700;
    const p = this.scene.player;
    this.dir.set(p.x - this.boss.x, p.y - this.boss.y).normalize();
    Sfx.boss();
  }
  private updateCharge(delta: number): void {
    this.timer -= delta;
    const body = this.boss.body as Phaser.Physics.Arcade.Body;
    if (this.phase === 'tele') {
      body.setVelocity(0, 0);
      this.boss.setTintFill(0xffe066); // 예고: 노란 번쩍
      if (this.timer <= 0) {
        this.phase = 'active';
        this.timer = 480;
        this.boss.clearTint();
      }
    } else {
      body.setVelocity(this.dir.x * 460, this.dir.y * 460); // 빠른 돌진
      if (this.timer <= 0) {
        body.setVelocity(0, 0);
        this.action = 'none';
      }
    }
  }

  // ---- 투사체 (3방향 조준) ----
  private shoot(): void {
    const b = this.boss;
    const p = this.scene.player;
    const base = Math.atan2(p.y - b.y, p.x - b.x);
    const dmg = Math.max(6, Math.round(b.contactDamage * 0.55));
    for (const off of [-0.28, 0, 0.28]) {
      this.scene.spawnEnemyProjectile(b.x, b.y, base + off, 230, dmg);
    }
  }

  // ---- 소환 ----
  private summon(): void {
    const n = 2 + (Math.random() < 0.5 ? 1 : 0);
    for (let i = 0; i < n; i++) this.scene.spawnMinionNearBoss(this.boss.x, this.boss.y);
  }

  // ---- 장판(예고 후 폭발) ----
  private startAoe(): void {
    this.action = 'aoe';
    this.timer = 950;
    const p = this.scene.player;
    this.aoeX = p.x;
    this.aoeY = p.y;
    this.aoeRing = this.scene.add
      .image(this.aoeX, this.aoeY, 'circle')
      .setTint(0xff4d4d)
      .setAlpha(0.28)
      .setDepth(5)
      .setDisplaySize(this.aoeR * 2, this.aoeR * 2);
  }
  private updateAoe(delta: number): void {
    this.timer -= delta;
    if (this.aoeRing) this.aoeRing.setAlpha(0.22 + 0.18 * Math.sin(this.scene.time.now * 0.02));
    if (this.timer <= 0) {
      const p = this.scene.player;
      const dx = p.x - this.aoeX;
      const dy = p.y - this.aoeY;
      if (dx * dx + dy * dy <= this.aoeR * this.aoeR) {
        this.scene.damagePlayer(Math.round(this.boss.contactDamage * 0.9));
      }
      this.scene.fx.burst(this.aoeX, this.aoeY, 0xff4d4d, 22);
      this.scene.cameras.main.shake(120, 0.006);
      this.aoeRing?.destroy();
      this.aoeRing = undefined;
      this.action = 'none';
    }
  }

  destroy(): void {
    this.aoeRing?.destroy();
    this.aoeRing = undefined;
  }
}
