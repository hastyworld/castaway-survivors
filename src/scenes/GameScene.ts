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
  EnemyDef,
  IslandDef,
  PassiveId,
  WeaponId,
} from '../config';
import { drawGradient } from '../ui/Background';
import Player from '../entities/Player';
import Enemy from '../entities/Enemy';
import WeaponSystem from '../systems/Weapons';
import WaveManager from '../systems/WaveManager';
import Joystick from '../systems/Joystick';
import Hud from '../ui/Hud';
import LevelUp, { UpgradeOption } from '../ui/LevelUp';
import Fx from '../systems/Fx';
import { Sfx } from '../systems/Sfx';
import { ISLANDS, WEAPONS, PASSIVES } from '../content';
import { addGold, markCleared } from '../save';

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
  gems!: Phaser.Physics.Arcade.Group;

  private weaponSystem!: WeaponSystem;
  private waves!: WaveManager;
  private hud!: Hud;
  private levelUp!: LevelUp;
  private joystick!: Joystick;
  private fx!: Fx;
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
  private paused = false; // 레벨업 팝업 동안 true

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

  init(data: { islandId: number }): void {
    this.island = ISLANDS[data.islandId] ?? ISLANDS[0];
    // 상태 초기화 (scene 재사용 대비)
    this.state = 'playing';
    this.paused = false;
    this.level = 1;
    this.xp = 0;
    this.xpNeed = this.xpForLevel(1);
    this.runGold = 0;
    this.kills = 0;
    this.elapsed = 0;
    this.passiveLevels = { maxhp: 0, power: 0, speed: 0, haste: 0, magnet: 0, regen: 0 };
  }

  create(): void {
    // 배경(아레나): 위=바다, 아래=섬 바닥
    drawGradient(this, this.island.bgTop, this.island.bgBottom);
    this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, GAME_WIDTH * 1.3, GAME_HEIGHT * 0.9, 0xffffff, 0.04).setDepth(-90);

    // 배경 분위기: 천천히 떠오르는 물방울
    this.add
      .particles(0, 0, 'spark', {
        x: { min: 0, max: GAME_WIDTH },
        y: GAME_HEIGHT + 10,
        lifespan: 6000,
        speedY: { min: -40, max: -18 },
        speedX: { min: -8, max: 8 },
        scale: { start: 0.25, end: 0.5 },
        alpha: { start: 0.18, end: 0 },
        frequency: 420,
        tint: 0x8fd3ff,
        blendMode: 'ADD',
      })
      .setDepth(-80);

    // 플레이 영역(HUD 아래) 밖으로 못 나가게
    this.physics.world.setBounds(6, HUD_HEIGHT, GAME_WIDTH - 12, GAME_HEIGHT - HUD_HEIGHT - 6);

    // 그룹
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();
    this.gems = this.physics.add.group();

    // 플레이어
    this.player = new Player(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120);
    this.player.setDepth(10);

    // 시스템
    this.weaponSystem = new WeaponSystem(this);
    this.weaponSystem.addOrLevel('coconut'); // 시작 무기
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
  }

  // ---------------- 매 프레임 ----------------
  update(_time: number, delta: number): void {
    if (this.state === 'over') return;
    if (this.paused) return;

    this.elapsed += delta;
    this.enemyCache = this.enemies.getChildren().filter((e) => e.active) as Enemy[];

    this.handleMovement();
    this.enemyCache.forEach((e) => e.track(this.player.x, this.player.y));
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
    const pos = isBoss ? { x: GAME_WIDTH / 2, y: HUD_HEIGHT + 40 } : this.randomEdge();
    const e = new Enemy(this, pos.x, pos.y);
    e.spawn(def, diff, pos.x, pos.y, isBoss);
    e.setDepth(isBoss ? 9 : 6);
    this.enemies.add(e);
    if (isBoss) {
      this.cameras.main.shake(400, 0.008);
      Sfx.boss();
      e.setScale(0).setAlpha(0);
      this.tweens.add({ targets: e, scale: def.radius / 32, alpha: 1, duration: 500, ease: 'Back.out' });
    }
    return e;
  }

  private randomEdge(): { x: number; y: number } {
    const m = 40;
    const side = Phaser.Math.Between(0, 3);
    switch (side) {
      case 0:
        return { x: Phaser.Math.Between(0, GAME_WIDTH), y: HUD_HEIGHT - m };
      case 1:
        return { x: GAME_WIDTH + m, y: Phaser.Math.Between(HUD_HEIGHT, GAME_HEIGHT) };
      case 2:
        return { x: Phaser.Math.Between(0, GAME_WIDTH), y: GAME_HEIGHT + m };
      default:
        return { x: -m, y: Phaser.Math.Between(HUD_HEIGHT, GAME_HEIGHT) };
    }
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

    if (enemy.isBoss) this.cameras.main.shake(300, 0.01);

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
    spin = 0
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
    p.setData('hits', new Set<Enemy>());
    p.setData('dieAt', this.time.now + 2600);
    Sfx.shoot();
  }

  private onProjectileHit: ArcadePhysicsCallback = (projObj, enemyObj) => {
    const proj = projObj as Phaser.Physics.Arcade.Image;
    const enemy = enemyObj as Enemy;
    if (!proj.active || !enemy.active) return;
    const hits = proj.getData('hits') as Set<Enemy>;
    if (hits.has(enemy)) return;

    this.damageEnemy(enemy, proj.getData('damage'));

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
    (this.projectiles.getChildren() as Phaser.Physics.Arcade.Image[]).forEach((p) => {
      if (!p.active) return;
      if (now > (p.getData('dieAt') as number) || p.x < -50 || p.x > GAME_WIDTH + 50 || p.y < -50 || p.y > GAME_HEIGHT + 50) {
        p.destroy();
      }
    });
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
    const now = this.time.now;
    if (this.player.takeDamage(enemy.contactDamage, now)) {
      this.cameras.main.shake(140, 0.008);
      this.fx.hurtFlash();
      Sfx.hurt();
      this.player.setTint(COLORS.danger);
      this.time.delayedCall(120, () => this.player.setTint(COLORS.player));
      if (this.player.isDead()) this.defeat();
    }
  };

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
    const pool: UpgradeOption[] = [];

    // 무기
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
    const picked = pool.slice(0, 3);
    // 3개 미만이면 회복 옵션으로 채움
    while (picked.length < 3) {
      picked.push({ kind: 'passive', id: 'heal', title: '휴식', tag: '+40 HP', desc: '체력을 40 회복합니다.', color: COLORS.hp });
    }
    return picked;
  }

  private applyUpgrade(opt: UpgradeOption): void {
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

  // ---------------- 승리 / 패배 ----------------
  onVictory(): void {
    if (this.state === 'over') return;
    this.state = 'over';
    Sfx.victory();
    const earned = this.island.reward + this.runGold;
    markCleared(this.island.id);
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
        islandId: this.island.id,
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
