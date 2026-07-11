// ============================================================
// Player.ts — 주인공(표류 생존자)
// 이동만 조작, 공격은 무기 시스템(자동)이 담당.
// ============================================================
import Phaser from 'phaser';
import { permBonuses } from '../save';
import { charBonuses, heroTexture } from '../characters';

export default class Player extends Phaser.Physics.Arcade.Image {
  // 판 시작 시점의 스탯 (영구 성장 반영)
  maxHp = 100;
  hp = 100;
  baseSpeed = 210;
  pickupRadius = 115; // 경험치 젬 자동 획득 범위 (넓어야 판이 끊기지 않음)

  // 판 안 성장(레벨업)으로 붙는 배수/보정
  speedMult = 1;
  powerMult = 1; // 모든 무기 피해에 곱해짐
  hasteMult = 1; // 공격 쿨다운 배수(작을수록 빠름)
  regenPerSec = 0;
  critChance = 0; // 치명타 확률 (0~1, 피해 1.8배)
  areaMult = 1; // 공격 범위/투사체 크기 배수
  luckMult = 1; // 아이템 드랍 확률 배수

  invulnUntil = 0; // 피격 무적 종료 시각(ms)

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, heroTexture()); // 선택 캐릭터 + 진화 단계의 외형
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDisplaySize(42, 42);
    // 살짝 관대한 원형 히트박스 (텍스처 64px 중앙 반지름 24)
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(24, 8, 8);
    body.setCollideWorldBounds(true);

    // 영구 성장(②) + 캐릭터 정체성(성향/진화) 반영
    const b = permBonuses();
    const c = charBonuses();
    this.maxHp = Math.round((this.maxHp + b.maxHp) * c.hpMult);
    this.hp = this.maxHp;
    this.powerMult *= b.powerMult * c.powerMult;
    this.speedMult *= b.speedMult * c.speedMult;
    this.hasteMult *= c.hasteMult;
    this.pickupRadius += b.pickup + c.pickupBonus;
    this.regenPerSec += c.regen;
  }

  get speed(): number {
    return this.baseSpeed * this.speedMult;
  }

  isInvulnerable(now: number): boolean {
    return now < this.invulnUntil;
  }

  takeDamage(amount: number, now: number): boolean {
    if (this.isInvulnerable(now)) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnUntil = now + 500; // 0.5초 무적
    return true;
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  isDead(): boolean {
    return this.hp <= 0;
  }
}
