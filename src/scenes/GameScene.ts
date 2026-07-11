// ============================================================
// GameScene.ts — 한 판(스테이지) 실제 플레이
// 이동 + 자동공격 + 적 + 경험치/레벨업 + 웨이브 + 보스 (기획안 0~5단계)
// ============================================================
import Phaser from 'phaser';
import {
  COLORS,
  CSS,
  FONT,
  GAME_WIDTH,
  GAME_HEIGHT,
  HUD_HEIGHT,
  WORLD_W,
  WORLD_H,
  EnemyDef,
  IslandDef,
  PassiveId,
  WeaponId,
} from '../config';
import { drawGradient } from '../ui/Background';
import Player from '../entities/Player';
import Enemy from '../entities/Enemy';
import WeaponSystem, { EVOLVE } from '../systems/Weapons';
import WaveManager from '../systems/WaveManager';
import Joystick from '../systems/Joystick';
import BossAI from '../systems/BossAI';
import Hud from '../ui/Hud';
import LevelUp, { UpgradeOption } from '../ui/LevelUp';
import { makeButton } from '../ui/Button';
import Fx from '../systems/Fx';
import { Sfx } from '../systems/Sfx';
import { getRun, WEAPONS, PASSIVES, ENEMIES } from '../content';
import { addGold, markRunCleared } from '../save';
import { charBonuses } from '../characters';

type State = 'playing' | 'over';

const WEAPON_COLORS: Record<WeaponId, number> = {
  coconut: COLORS.coconut,
  starfish: COLORS.starfish,
  campfire: COLORS.campfire,
};

export default class GameScene extends Phaser.Scene {
  island!: IslandDef;
  player!: Player;
  enemies!: Phaser.Physics.Arcade.Group;
  projectiles!: Phaser.Physics.Arcade.Group;
  enemyProjectiles!: Phaser.Physics.Arcade.Group;
  gems!: Phaser.Physics.Arcade.Group;
  private bossAI?: BossAI;

  private weaponSystem!: WeaponSystem;
  private waves!: WaveManager;
  private hud!: Hud;
  private levelUp!: LevelUp;
  private joystick!: Joystick;
  fx!: Fx; // BossAI 등에서 접근
  private keys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
  };

  private state: State = 'playing';
  private paused = false; // 레벨업 팝업 or 일시정지 동안 true (update/물리 정지)
  private isPaused = false; // 수동 일시정지 상태
  private pauseOverlay?: Phaser.GameObjects.Container;

  private level = 1;
  private xp = 0;
  private xpNeed = 6;
  private runGold = 0;
  private kills = 0;
  private elapsed = 0;

  private passiveLevels: Record<PassiveId, number> = {
    maxhp: 0,
    power: 0,
    speed: 0,
    haste: 0,
    magnet: 0,
    regen: 0,
  };

  private enemyCache: Enemy[] = [];

  constructor() {
    super('Game');
  }

  init(data: { island: number; run: number }): void {
    this.island = getRun(data.island ?? 0, data.run ?? 0);
    // 상태 초기화 (scene 재사용 대비)
    this.state = 'playing';
    this.paused = false;
    this.isPaused = false;
    this.pauseOverlay = undefined;
    this.bossAI = undefined;
    this.level = 1;
    this.xp = 0;
    this.xpNeed = this.xpForLevel(1);
    this.runGold = 0;
    this.kills = 0;
    this.elapsed = 0;
    this.passiveLevels = { maxhp: 0, power: 0, speed: 0, haste: 0, magnet: 0, regen: 0 };
  }

  create(): void {
    // ---- 스크롤 월드: 화면보다 훨씬 넓은 무인도, 카메라가 플레이어를 따라감 (요청 2) ----
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    // 화면 고정 하늘/바다 그라데이션
    drawGradient(this, this.island.bgTop, this.island.bgBottom).setScrollFactor(0);

    // 월드 지면(섬 바닥) — 스크롤됨
    this.add.rectangle(0, 0, WORLD_W, WORLD_H, this.island.bgBottom, 0.5).setOrigin(0, 0).setDepth(-95);
    // 지면 질감 패치 (밝은 모래 / 어두운 수풀)
    for (let i = 0; i < 70; i++) {
      const light = i % 2 === 0;
      this.add
        .ellipse(
          Phaser.Math.Between(0, WORLD_W),
          Phaser.Math.Between(0, WORLD_H),
          Phaser.Math.Between(90, 280),
          Phaser.Math.Between(70, 200),
          light ? COLORS.sand : 0x152015,
          0.06
        )
        .setDepth(-92);
    }

    // 월드 곳곳에 소품(야자수/바위/수풀) — 이동하며 지나감
    const propKeys = ['palm', 'rock', 'bush', 'palm', 'bush', 'rock'];
    for (let i = 0; i < 48; i++) {
      const key = propKeys[Phaser.Math.Between(0, propKeys.length - 1)];
      this.add
        .image(Phaser.Math.Between(50, WORLD_W - 50), Phaser.Math.Between(50, WORLD_H - 50), key)
        .setDepth(-70)
        .setAlpha(0.95)
        .setScale(Phaser.Math.FloatBetween(0.7, 1.4));
    }

    // 그룹
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group(); // 보스 등 적 투사체
    this.gems = this.physics.add.group();

    // 플레이어: 월드 중앙에서 시작, 카메라가 부드럽게 추적
    this.player = new Player(this, WORLD_W / 2, WORLD_H / 2);
    this.player.setDepth(10);
    this.cameras.main.startFollow(this.player, true, 0.14, 0.14);

    // 시스템
    this.weaponSystem = new WeaponSystem(this);
    this.weaponSystem.addOrLevel(charBonuses().startWeapon); // 캐릭터별 시작 무기
    this.waves = new WaveManager(this, this.island);
    this.hud = new Hud(this);
    this.levelUp = new LevelUp(this);
    this.joystick = new Joystick(this);
    this.fx = new Fx(this);
    Sfx.resume(); // 배경음/효과음 준비

    // 키보드
    const kb = this.input.keyboard!;
    this.keys = {
      up: kb.addKey('UP'),
      down: kb.addKey('DOWN'),
      left: kb.addKey('LEFT'),
      right: kb.addKey('RIGHT'),
      w: kb.addKey('W'),
      a: kb.addKey('A'),
      s: kb.addKey('S'),
      d: kb.addKey('D'),
    };

    // 충돌/획득
    this.physics.add.overlap(this.projectiles, this.enemies, this.onProjectileHit, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerContact, undefined, this);
    this.physics.add.overlap(this.player, this.gems, this.onCollectGem, undefined, this);
    this.physics.add.overlap(this.player, this.enemyProjectiles, this.onEnemyProjectileHit, undefined, this);

    this.announce(this.waves.label());

    // 음소거 버튼 (우하단)
    const mb = this.add.circle(GAME_WIDTH - 26, GAME_HEIGHT - 26, 18, 0x000000, 0.35).setScrollFactor(0).setDepth(210).setInteractive({ useHandCursor: true });
    const mi = this.add
      .text(GAME_WIDTH - 26, GAME_HEIGHT - 27, '♪', { fontFamily: FONT, fontSize: '18px', color: Sfx.muted ? '#6f8496' : CSS.accent, fontStyle: 'bold' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(211);
    mb.on('pointerup', () => {
      const m = Sfx.toggleMute();
      mi.setColor(m ? '#6f8496' : CSS.accent);
    });

    // 일시정지 버튼 (플레이영역 우상단)
    const pauseBtn = this.add.circle(GAME_WIDTH - 28, HUD_HEIGHT + 28, 18, 0x000000, 0.4).setScrollFactor(0).setDepth(210).setInteractive({ useHandCursor: true });
    this.add.rectangle(GAME_WIDTH - 32, HUD_HEIGHT + 28, 4, 14, 0xffffff).setScrollFactor(0).setDepth(211);
    this.add.rectangle(GAME_WIDTH - 24, HUD_HEIGHT + 28, 4, 14, 0xffffff).setScrollFactor(0).setDepth(211);
    pauseBtn.on('pointerup', () => this.openPause());
  }

  // ---------------- 매 프레임 ----------------
  update(_time: number, delta: number): void {
    if (this.state === 'over') return;
    if (this.paused) return;

    this.elapsed += delta;
    this.enemyCache = this.enemies.getChildren().filter((e) => e.active) as Enemy[];

    this.handleMovement();
    this.enemyCache.forEach((e) => e.track(this.player.x, this.player.y));
    if (this.bossAI) this.bossAI.update(delta); // 적 이동 뒤에 보스 스킬(이동 덮어씀)
    this.weaponSystem.update(delta);
    this.updateGems();
    this.cullProjectiles();
    this.waves.update(delta);

    // 재생
    if (this.player.regenPerSec > 0) this.player.heal((this.player.regenPerSec * delta) / 1000);

    // 레벨업 체크
    if (this.xp >= this.xpNeed) this.doLevelUp();

    this.hud.update({
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      xp: this.xp,
      xpNeed: this.xpNeed,
      level: this.level,
      wave: this.waves.label(),
      timeMs: this.elapsed,
      kills: this.kills,
      gold: this.runGold,
    });
  }

  private handleMovement(): void {
    let dx = 0;
    let dy = 0;
    if (this.keys.left.isDown || this.keys.a.isDown) dx -= 1;
    if (this.keys.right.isDown || this.keys.d.isDown) dx += 1;
    if (this.keys.up.isDown || this.keys.w.isDown) dy -= 1;
    if (this.keys.down.isDown || this.keys.s.isDown) dy += 1;

    if (this.joystick.vec.lengthSq() > 0.02) {
      dx = this.joystick.vec.x;
      dy = this.joystick.vec.y;
    }

    const len = Math.hypot(dx, dy);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (len > 0) {
      body.setVelocity((dx / len) * this.player.speed, (dy / len) * this.player.speed);
    } else {
      body.setVelocity(0, 0);
    }
    // 이동 방향에 따라 캐릭터 좌우 반전
    if (dx < -0.1) this.player.setFlipX(true);
    else if (dx > 0.1) this.player.setFlipX(false);
  }

  // ---------------- 적 관련 (WaveManager/Weapons가 호출) ----------------
  getActiveEnemies(): Enemy[] {
    return this.enemyCache;
  }

  getNearestEnemies(x: number, y: number, n: number): Enemy[] {
    const arr = this.enemyCache;
    if (arr.length === 0) return [];
    if (n === 1) {
      let best: Enemy | null = null;
      let bd = Infinity;
      for (const e of arr) {
        const d = (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y);
        if (d < bd) {
          bd = d;
          best = e;
        }
      }
      return best ? [best] : [];
    }
    return arr
      .map((e) => ({ e, d: (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, n)
      .map((o) => o.e);
  }

  spawnEnemy(def: EnemyDef, diff: number, isBoss: boolean): Enemy {
    // 보스는 플레이어 위쪽(화면 안쪽)에서 등장, 잡몹은 화면 밖에서
    const pos = isBoss
      ? { x: this.player.x, y: Phaser.Math.Clamp(this.player.y - 240, 60, WORLD_H - 60) }
      : this.randomEdge();
    const e = new Enemy(this, pos.x, pos.y);
    e.spawn(def, diff, pos.x, pos.y, isBoss);
    e.setDepth(isBoss ? 9 : 6);
    this.enemies.add(e);
    if (isBoss) {
      this.cameras.main.shake(400, 0.008);
      Sfx.boss();
      e.setScale(0).setAlpha(0);
      this.tweens.add({ targets: e, scale: def.radius / 32, alpha: 1, duration: 500, ease: 'Back.out' });
      this.bossAI = new BossAI(this, e);
    }
    return e;
  }

  // 카메라에 보이는 영역 바로 바깥에서 스폰 → 플레이어를 향해 몰려옴
  private randomEdge(): { x: number; y: number } {
    const view = this.cameras.main.worldView;
    const m = 70;
    const side = Phaser.Math.Between(0, 3);
    let x: number;
    let y: number;
    switch (side) {
      case 0:
        x = Phaser.Math.Between(view.left, view.right);
        y = view.top - m;
        break;
      case 1:
        x = view.right + m;
        y = Phaser.Math.Between(view.top, view.bottom);
        break;
      case 2:
        x = Phaser.Math.Between(view.left, view.right);
        y = view.bottom + m;
        break;
      default:
        x = view.left - m;
        y = Phaser.Math.Between(view.top, view.bottom);
        break;
    }
    return { x: Phaser.Math.Clamp(x, -m, WORLD_W + m), y: Phaser.Math.Clamp(y, -m, WORLD_H + m) };
  }

  damageEnemy(enemy: Enemy, amount: number, showNumber = true): void {
    if (!enemy.active) return;
    enemy.takeDamage(amount);
    Sfx.hit();
    if (showNumber) {
      this.fx.number(enemy.x, enemy.y - enemy.displayHeight / 2, amount, enemy.isBoss ? CSS.accent : '#ffffff', enemy.isBoss);
    }
    if (enemy.hp <= 0) this.killEnemy(enemy);
  }

  private killEnemy(enemy: Enemy): void {
    if (!enemy.active) return;
    this.kills += 1;
    this.runGold += enemy.goldValue;

    // 경험치 젬 드롭
    this.dropGem(enemy.x, enemy.y, enemy.xpValue);

    // 사망 연출: 파티클 버스트 + 효과음
    this.fx.burst(enemy.x, enemy.y, enemy.baseColor, enemy.isBoss ? 24 : 8);
    Sfx.kill();

    if (enemy.isBoss) {
      this.cameras.main.shake(300, 0.01);
      this.bossAI?.destroy();
      this.bossAI = undefined;
    }

    enemy.cleanup();
    enemy.destroy();
  }

  private dropGem(x: number, y: number, xp: number): void {
    const g = this.physics.add.image(x, y, 'gem').setTint(COLORS.xp).setDepth(3);
    g.setData('xp', xp);
    (g.body as Phaser.Physics.Arcade.Body).setCircle(12, 0, 0);
    this.gems.add(g);
  }

  // ---------------- 투사체 ----------------
  spawnProjectile(
    x: number,
    y: number,
    angle: number,
    speed: number,
    damage: number,
    pierce: number,
    tint: number,
    radius: number,
    texture = 'circle',
    spin = 0,
    explodeRadius = 0
  ): void {
    const p = this.physics.add.image(x, y, texture).setTint(tint).setDepth(8);
    p.setDisplaySize(radius * 2, radius * 2);
    // ⚠ 그룹에 먼저 add → 그 다음 속도 설정.
    // (Arcade physics Group.add 가 body 기본값을 적용하며 속도를 0으로 초기화하기 때문)
    this.projectiles.add(p);
    const body = p.body as Phaser.Physics.Arcade.Body;
    body.setCircle(32, 0, 0);
    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    if (spin) body.setAngularVelocity(spin);
    p.setData('damage', damage);
    p.setData('pierce', pierce);
    p.setData('explode', explodeRadius);
    p.setData('hits', new Set<Enemy>());
    p.setData('dieAt', this.time.now + 2600);
    Sfx.shoot();
  }

  // 진화 무기 폭발 (범위 피해)
  explodeAt(x: number, y: number, r: number, dmg: number): void {
    this.fx.burst(x, y, 0xff9a3c, 16);
    this.cameras.main.shake(80, 0.004);
    const r2 = r * r;
    this.getActiveEnemies().forEach((e) => {
      const dx = e.x - x;
      const dy = e.y - y;
      if (dx * dx + dy * dy <= r2) this.damageEnemy(e, dmg, false);
    });
  }

  private onProjectileHit: ArcadePhysicsCallback = (projObj, enemyObj) => {
    const proj = projObj as Phaser.Physics.Arcade.Image;
    const enemy = enemyObj as Enemy;
    if (!proj.active || !enemy.active) return;
    const hits = proj.getData('hits') as Set<Enemy>;
    if (hits.has(enemy)) return;

    const dmg = proj.getData('damage') as number;
    this.damageEnemy(enemy, dmg);

    const explode = proj.getData('explode') as number;
    if (explode > 0) {
      this.explodeAt(proj.x, proj.y, explode, dmg * 0.6);
      proj.destroy();
      return;
    }

    const pierce = proj.getData('pierce') as number;
    if (pierce > 0) {
      hits.add(enemy);
      proj.setData('pierce', pierce - 1);
    } else {
      proj.destroy();
    }
  };

  private cullProjectiles(): void {
    const now = this.time.now;
    const px = this.player.x;
    const py = this.player.y;
    const maxD2 = 1300 * 1300; // 플레이어에서 너무 멀면 제거
    const cull = (grp: Phaser.Physics.Arcade.Group) => {
      (grp.getChildren() as Phaser.Physics.Arcade.Image[]).forEach((p) => {
        if (!p.active) return;
        const dx = p.x - px;
        const dy = p.y - py;
        if (now > (p.getData('dieAt') as number) || dx * dx + dy * dy > maxD2) {
          p.destroy();
        }
      });
    };
    cull(this.projectiles);
    cull(this.enemyProjectiles);
  }

  // ---------------- 경험치 젬 (자석) ----------------
  private updateGems(): void {
    const pr = this.player.pickupRadius;
    const pr2 = pr * pr;
    (this.gems.getChildren() as Phaser.Physics.Arcade.Image[]).forEach((g) => {
      if (!g.active) return;
      const dx = this.player.x - g.x;
      const dy = this.player.y - g.y;
      const d2 = dx * dx + dy * dy;
      const body = g.body as Phaser.Physics.Arcade.Body;
      if (d2 < pr2) {
        const a = Math.atan2(dy, dx);
        body.setVelocity(Math.cos(a) * 340, Math.sin(a) * 340);
      } else {
        body.setVelocity(0, 0);
      }
    });
  }

  private onCollectGem: ArcadePhysicsCallback = (_playerObj, gemObj) => {
    const gem = gemObj as Phaser.Physics.Arcade.Image;
    if (!gem.active) return;
    this.gainXp(gem.getData('xp') as number);
    this.fx.spark(gem.x, gem.y);
    Sfx.gem();
    gem.destroy();
  };

  private gainXp(v: number): void {
    this.xp += v;
  }

  // ---------------- 플레이어 피격 ----------------
  private onPlayerContact: ArcadePhysicsCallback = (_playerObj, enemyObj) => {
    const enemy = enemyObj as Enemy;
    if (!enemy.active) return;
    this.damagePlayer(enemy.contactDamage);
  };

  // 접촉/투사체/장판 공통 피격 처리 (무적시간 내면 무시)
  damagePlayer(amount: number): void {
    if (this.state !== 'playing') return;
    const now = this.time.now;
    if (this.player.takeDamage(amount, now)) {
      this.cameras.main.shake(140, 0.008);
      this.fx.hurtFlash();
      Sfx.hurt();
      this.player.setTintFill(COLORS.danger);
      this.time.delayedCall(120, () => this.player.clearTint());
      if (this.player.isDead()) this.defeat();
    }
  }

  // 적(보스) 투사체
  spawnEnemyProjectile(x: number, y: number, angle: number, speed: number, damage: number): void {
    const p = this.physics.add.image(x, y, 'circle').setTint(COLORS.danger).setDepth(8).setDisplaySize(18, 18);
    this.enemyProjectiles.add(p);
    const body = p.body as Phaser.Physics.Arcade.Body;
    body.setCircle(32, 0, 0);
    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    p.setData('damage', damage);
    p.setData('dieAt', this.time.now + 4000);
  }

  private onEnemyProjectileHit: ArcadePhysicsCallback = (_playerObj, projObj) => {
    const proj = projObj as Phaser.Physics.Arcade.Image;
    if (!proj.active) return;
    this.damagePlayer(proj.getData('damage') as number);
    proj.destroy();
  };

  // 보스 소환: 섬 적 풀에서 하나를 보스 근처에 소환
  spawnMinionNearBoss(bx: number, by: number): void {
    const pool = this.island.waves[this.island.waves.length - 1].enemies;
    const id = pool[Math.floor(Math.random() * pool.length)];
    const e = this.spawnEnemy(ENEMIES[id], this.island.difficulty, false);
    const x = Phaser.Math.Clamp(bx + Phaser.Math.Between(-60, 60), 20, WORLD_W - 20);
    const y = Phaser.Math.Clamp(by + Phaser.Math.Between(-60, 60), 20, WORLD_H - 20);
    e.setPosition(x, y);
    (e.body as Phaser.Physics.Arcade.Body).reset(x, y);
  }

  // ---------------- 레벨업 ----------------
  private xpForLevel(level: number): number {
    // 초반은 빠르게, 뒤로 갈수록 완만하게 증가
    return Math.floor(4 + (level - 1) * 3.5);
  }

  private doLevelUp(): void {
    this.xp -= this.xpNeed;
    this.level += 1;
    this.xpNeed = this.xpForLevel(this.level);

    this.fx.levelRing(this.player.x, this.player.y);
    Sfx.levelup();

    this.paused = true;
    this.physics.pause();
    this.joystick.enabled = false;
    this.joystick.reset();
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);

    const options = this.buildOptions();
    this.levelUp.show(options, (opt) => {
      this.applyUpgrade(opt);
      this.paused = false;
      this.physics.resume();
      this.joystick.enabled = true;
    });
  }

  private buildOptions(): UpgradeOption[] {
    // 진화 가능 무기 (최대레벨 + 특성조건) → 항상 우선 노출
    const evolveOpts: UpgradeOption[] = [];
    for (const w of WEAPONS) {
      const id = w.id as WeaponId;
      if (this.weaponSystem.isMaxed(id) && !this.weaponSystem.isEvolved(id)) {
        const req = EVOLVE[id];
        if (this.passiveLevels[req.passive] >= req.need) {
          evolveOpts.push({ kind: 'evolve', id, title: req.name, tag: '진화!', desc: req.desc, color: COLORS.accent });
        }
      }
    }

    const pool: UpgradeOption[] = [];
    // 무기 (최대레벨 미만만)
    for (const w of WEAPONS) {
      const lvl = this.weaponSystem.level(w.id);
      if (lvl > 0 && lvl < w.maxLevel) {
        pool.push({ kind: 'weapon', id: w.id, title: w.name, tag: `Lv.${lvl} → ${lvl + 1}`, desc: w.desc, color: WEAPON_COLORS[w.id] });
      } else if (lvl === 0 && this.weaponSystem.canAddNew()) {
        pool.push({ kind: 'weapon', id: w.id, title: w.name, tag: 'NEW', desc: w.desc, color: WEAPON_COLORS[w.id] });
      }
    }
    // 특성
    for (const p of PASSIVES) {
      const lvl = this.passiveLevels[p.id as PassiveId];
      if (lvl < p.maxLevel) {
        pool.push({ kind: 'passive', id: p.id, title: p.name, tag: `Lv.${lvl} → ${lvl + 1}`, desc: p.desc, color: COLORS.player });
      }
    }

    Phaser.Utils.Array.Shuffle(pool);
    const picked = [...evolveOpts, ...pool].slice(0, 3);
    // 3개 미만이면 회복 옵션으로 채움
    while (picked.length < 3) {
      picked.push({ kind: 'passive', id: 'heal', title: '휴식', tag: '+40 HP', desc: '체력을 40 회복합니다.', color: COLORS.hp });
    }
    return picked;
  }

  private applyUpgrade(opt: UpgradeOption): void {
    if (opt.kind === 'evolve') {
      this.weaponSystem.evolve(opt.id as WeaponId);
      this.announce('⚡ 무기 진화! ⚡');
      Sfx.levelup();
      return;
    }
    if (opt.kind === 'weapon') {
      this.weaponSystem.addOrLevel(opt.id as WeaponId);
      return;
    }
    const p = this.player;
    switch (opt.id as PassiveId | 'heal') {
      case 'maxhp':
        p.maxHp += 25;
        p.heal(25);
        this.passiveLevels.maxhp++;
        break;
      case 'power':
        p.powerMult *= 1.15;
        this.passiveLevels.power++;
        break;
      case 'speed':
        p.speedMult *= 1.08;
        this.passiveLevels.speed++;
        break;
      case 'haste':
        p.hasteMult *= 0.92;
        this.passiveLevels.haste++;
        break;
      case 'magnet':
        p.pickupRadius += 35;
        this.passiveLevels.magnet++;
        break;
      case 'regen':
        p.regenPerSec += 0.6;
        this.passiveLevels.regen++;
        break;
      case 'heal':
        p.heal(40);
        break;
    }
  }

  // ---------------- 안내 문구 ----------------
  announce(text: string): void {
    const t = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, text, {
        fontFamily: FONT,
        fontSize: '30px',
        color: CSS.accent,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(120)
      .setScrollFactor(0)
      .setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, y: t.y - 10, duration: 300, yoyo: true, hold: 700, onComplete: () => t.destroy() });
  }

  // ---------------- 일시정지 + 빌드 보기 (요청 1, 3) ----------------
  openPause(): void {
    if (this.state !== 'playing' || this.paused) return; // 레벨업/종료 중엔 불가
    this.paused = true;
    this.isPaused = true;
    this.physics.pause();
    this.joystick.enabled = false;
    this.joystick.reset();
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);

    const c = this.add.container(0, 0).setDepth(520).setScrollFactor(0);
    const dim = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.82).setOrigin(0, 0).setInteractive();
    const title = this.add.text(GAME_WIDTH / 2, 96, '일시정지', { fontFamily: FONT, fontSize: '34px', color: CSS.accent, fontStyle: 'bold' }).setOrigin(0.5);
    const sec = this.add.text(GAME_WIDTH / 2, 150, '현재 장착 (업그레이드 현황)', { fontFamily: FONT, fontSize: '16px', color: CSS.text, fontStyle: 'bold' }).setOrigin(0.5);
    c.add([dim, title, sec]);

    let y = 188;
    for (const b of this.weaponSystem.getBuild()) {
      const line = b.evolved ? `${b.name}  · 진화 완료` : `${b.name}  Lv.${b.level}/${b.max}`;
      c.add(this.add.text(56, y, '⚔ ' + line, { fontFamily: FONT, fontSize: '16px', color: b.evolved ? CSS.accent : CSS.text }).setOrigin(0, 0.5));
      y += 30;
    }
    const passives = PASSIVES.filter((p) => this.passiveLevels[p.id as PassiveId] > 0);
    if (passives.length) {
      y += 8;
      c.add(this.add.text(56, y, '특성', { fontFamily: FONT, fontSize: '14px', color: CSS.textDim }).setOrigin(0, 0.5));
      y += 26;
      for (const p of passives) {
        const lvl = this.passiveLevels[p.id as PassiveId];
        c.add(this.add.text(56, y, `• ${p.name}  Lv.${lvl}/${p.maxLevel}`, { fontFamily: FONT, fontSize: '15px', color: CSS.textDim }).setOrigin(0, 0.5));
        y += 26;
      }
    }

    const muteLabel = () => (Sfx.muted ? '소리 켜기' : '소리 끄기');
    const resume = makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 210, '▶  계속하기', () => this.closePause(), { width: 260, height: 62, fontSize: 22 });
    const muteBtn = makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 138, muteLabel(), () => {}, { width: 200, height: 48, fill: COLORS.panelBorder, textColor: '#ffffff', fontSize: 16 });
    (muteBtn.getData('hit') as Phaser.GameObjects.Zone).on('pointerup', () => {
      Sfx.toggleMute();
      (muteBtn.getData('txt') as Phaser.GameObjects.Text).setText(muteLabel());
    });
    const quit = makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 76, '지도로 나가기', () => this.scene.start('Map'), { width: 200, height: 46, fill: COLORS.panelBorder, textColor: '#ffffff', fontSize: 16 });
    c.add([resume, muteBtn, quit]);
    this.pauseOverlay = c;
  }

  private closePause(): void {
    if (!this.isPaused) return;
    this.pauseOverlay?.destroy(true);
    this.pauseOverlay = undefined;
    this.isPaused = false;

    // 3-2-1 카운트다운 후 재개 (일시정지 해제 직후 피격 방지)
    let n = 3;
    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '3', { fontFamily: FONT, fontSize: '72px', color: CSS.accent, fontStyle: 'bold' }).setOrigin(0.5).setDepth(520).setScrollFactor(0);
    const tick = () => {
      n -= 1;
      if (n <= 0) {
        txt.destroy();
        this.paused = false;
        this.physics.resume();
        this.joystick.enabled = true;
      } else {
        txt.setText(String(n));
        this.tweens.add({ targets: txt, scale: { from: 1.4, to: 1 }, duration: 220 });
        this.time.delayedCall(700, tick);
      }
    };
    this.tweens.add({ targets: txt, scale: { from: 1.4, to: 1 }, duration: 220 });
    this.time.delayedCall(700, tick);
  }

  // ---------------- 승리 / 패배 ----------------
  onVictory(): void {
    if (this.state === 'over') return;
    this.state = 'over';
    Sfx.victory();
    const earned = this.island.reward + this.runGold;
    markRunCleared(this.island.islandIndex, this.island.runIndex);
    addGold(earned);
    this.finish(true, earned);
  }

  private defeat(): void {
    if (this.state === 'over') return;
    this.state = 'over';
    Sfx.defeat();
    addGold(this.runGold);
    this.finish(false, this.runGold);
  }

  private finish(victory: boolean, goldEarned: number): void {
    this.physics.pause();
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Result', {
        victory,
        island: this.island.islandIndex,
        run: this.island.runIndex,
        runName: this.island.name,
        kills: this.kills,
        timeMs: this.elapsed,
        goldEarned,
        level: this.level,
      });
    });
  }
}

// Phaser 오버랩 콜백 타입 (arcade)
type ArcadePhysicsCallback = Phaser.Types.Physics.Arcade.ArcadePhysicsCallback;
