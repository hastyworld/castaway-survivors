// ============================================================
// Enemy.ts — 적 (벌레/게/짐승/유령/해적/보스)
// 매 프레임 플레이어를 향해 이동. 접촉 시 데미지.
// ============================================================
import Phaser from 'phaser';
import { EnemyDef } from '../config';

export default class Enemy extends Phaser.Physics.Arcade.Image {
  hp = 1;
  maxHp = 1;
  speed = 50;
  contactDamage = 5;
  xpValue = 1;
  goldValue = 0;
  isBoss = false;
  nextContactAt = 0; // 접촉 데미지 쿨다운
  baseColor = 0xffffff; // 원래 색 (피격 플래시 후 복원)
  knockUntil = 0; // 넉백(파도 술법 등) 동안 추적 정지
  private flashUntil = 0;
  private wobblePhase = Math.random() * Math.PI * 2; // 걷기 흔들림 위상(개체별로 다르게)
  private hpBar?: Phaser.GameObjects.Rectangle;
  private hpBarBg?: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'circle');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body).setCircle(32, 0, 0);
  }

  // 풀에서 꺼내 쓰거나 새로 만들 때 값 세팅
  spawn(def: EnemyDef, diff: number, x: number, y: number, isBoss = false): void {
    this.isBoss = isBoss;
    // 보스는 더 단단하고(체력×1.9) 아프게(피해×1.3) — 스킬은 BossAI 담당
    this.hp = this.maxHp = Math.round(def.hp * (isBoss ? 1.9 : diff));
    this.speed = def.speed * (isBoss ? 1 : Math.min(diff, 1.4));
    this.contactDamage = Math.round(def.damage * (isBoss ? 1.3 : diff));
    this.xpValue = def.xp;
    this.goldValue = def.gold ?? 0;

    this.setPosition(x, y);
    this.baseColor = def.color;
    this.setTexture(def.texture);
    this.clearTint();
    this.setDisplaySize(def.radius * 2, def.radius * 2);
    this.setActive(true).setVisible(true);
    this.nextContactAt = 0;
    (this.body as Phaser.Physics.Arcade.Body).enable = true;

    if (isBoss) this.createHpBar();
  }

  private createHpBar(): void {
    const w = 90;
    this.hpBarBg = this.scene.add.rectangle(this.x, this.y - 44, w, 8, 0x000000, 0.6).setDepth(50);
    this.hpBar = this.scene.add.rectangle(this.x, this.y - 44, w, 8, 0xff4d6d).setDepth(51);
  }

  takeDamage(amount: number): void {
    this.hp -= amount;
    // 흰색 피격 플래시 (track()에서 복원)
    this.setTintFill(0xffffff);
    this.flashUntil = this.scene.time.now + 55;
    if (this.isBoss && this.hpBar) {
      const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
      this.hpBar.width = 90 * ratio;
    }
  }

  // 매 프레임 호출: 플레이어 추적
  track(px: number, py: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;
    const now = this.scene.time.now;
    // 피격 플래시 복원 (텍스처 색으로)
    if (this.flashUntil && now > this.flashUntil) {
      this.clearTint();
      this.flashUntil = 0;
    }
    // 넉백 중엔 추적 안 함 (밀려나는 속도 유지)
    if (now < this.knockUntil) return;
    const angle = Math.atan2(py - this.y, px - this.x);
    body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    // 걷기 흔들림 (좌우 기울임) + 진행 방향 바라보기
    this.setRotation(Math.sin(now * 0.012 + this.wobblePhase) * 0.12);
    this.setFlipX(px < this.x);
    if (this.isBoss && this.hpBar && this.hpBarBg) {
      this.hpBarBg.setPosition(this.x, this.y - this.displayHeight / 2 - 10);
      this.hpBar.setPosition(this.x - (90 - this.hpBar.width) / 2, this.y - this.displayHeight / 2 - 10);
    }
  }

  // 밖으로 밀쳐내기 (파도 술법/폭탄)
  knockback(fromX: number, fromY: number, force: number, durMs = 260): void {
    if (this.isBoss) return; // 보스는 밀리지 않음
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;
    const a = Math.atan2(this.y - fromY, this.x - fromX);
    body.setVelocity(Math.cos(a) * force, Math.sin(a) * force);
    this.knockUntil = this.scene.time.now + durMs;
  }

  cleanup(): void {
    this.hpBar?.destroy();
    this.hpBarBg?.destroy();
    this.hpBar = undefined;
    this.hpBarBg = undefined;
  }
}
