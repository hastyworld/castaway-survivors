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
  private flashUntil = 0;
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
    this.hp = this.maxHp = Math.round(def.hp * (isBoss ? 1 : diff));
    this.speed = def.speed * (isBoss ? 1 : Math.min(diff, 1.4));
    this.contactDamage = Math.round(def.damage * (isBoss ? 1 : diff));
    this.xpValue = def.xp;
    this.goldValue = def.gold ?? 0;

    this.setPosition(x, y);
    this.baseColor = def.color;
    this.setTint(def.color);
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
    // 피격 플래시 복원
    if (this.flashUntil && this.scene.time.now > this.flashUntil) {
      this.setTint(this.baseColor);
      this.flashUntil = 0;
    }
    const angle = Math.atan2(py - this.y, px - this.x);
    body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    if (this.isBoss && this.hpBar && this.hpBarBg) {
      this.hpBarBg.setPosition(this.x, this.y - this.displayHeight / 2 - 10);
      this.hpBar.setPosition(this.x - (90 - this.hpBar.width) / 2, this.y - this.displayHeight / 2 - 10);
    }
  }

  cleanup(): void {
    this.hpBar?.destroy();
    this.hpBarBg?.destroy();
    this.hpBar = undefined;
    this.hpBarBg = undefined;
  }
}
