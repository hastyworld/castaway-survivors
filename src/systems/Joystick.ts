// ============================================================
// Joystick.ts — 모바일용 가상 조이스틱 (터치한 곳에 생성)
// 데스크톱에서는 마우스 드래그로도 동작. 키보드는 GameScene에서 별도 처리.
// ============================================================
import Phaser from 'phaser';

const MAX_RADIUS = 70;

export default class Joystick {
  private scene: Phaser.Scene;
  private base: Phaser.GameObjects.Image;
  private thumb: Phaser.GameObjects.Image;
  private active = false;
  private pointerId = -1;
  private originX = 0;
  private originY = 0;
  vec = new Phaser.Math.Vector2(0, 0); // 정규화된 이동 방향(-1~1)

  enabled = true;
  // 이 좌표가 UI 버튼 위라면 조이스틱을 만들지 않음 (GameScene 이 TapZones.hitAt 연결)
  blockedAt?: (x: number, y: number) => boolean;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.base = scene.add
      .image(0, 0, 'joyBase')
      .setDepth(200)
      .setScrollFactor(0)
      .setAlpha(0.35)
      .setVisible(false);
    this.thumb = scene.add
      .image(0, 0, 'joyThumb')
      .setDepth(201)
      .setScrollFactor(0)
      .setAlpha(0.55)
      .setVisible(false);

    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.input.on('pointerupoutside', this.onUp, this);
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (!this.enabled || this.active) return;
    if (this.blockedAt && this.blockedAt(p.x, p.y)) return;
    this.active = true;
    this.pointerId = p.id;
    this.originX = p.x;
    this.originY = p.y;
    this.base.setPosition(p.x, p.y).setVisible(true);
    this.thumb.setPosition(p.x, p.y).setVisible(true);
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (!this.active || p.id !== this.pointerId) return;
    const dx = p.x - this.originX;
    const dy = p.y - this.originY;
    const dist = Math.min(Math.hypot(dx, dy), MAX_RADIUS);
    const angle = Math.atan2(dy, dx);
    const tx = this.originX + Math.cos(angle) * dist;
    const ty = this.originY + Math.sin(angle) * dist;
    this.thumb.setPosition(tx, ty);
    // 데드존 살짝
    if (dist < 8) this.vec.set(0, 0);
    else this.vec.set(Math.cos(angle) * (dist / MAX_RADIUS), Math.sin(angle) * (dist / MAX_RADIUS));
  }

  private onUp(p: Phaser.Input.Pointer): void {
    if (p.id !== this.pointerId) return;
    this.reset();
  }

  reset(): void {
    this.active = false;
    this.pointerId = -1;
    this.vec.set(0, 0);
    this.base.setVisible(false);
    this.thumb.setVisible(false);
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.onDown, this);
    this.scene.input.off('pointermove', this.onMove, this);
    this.scene.input.off('pointerup', this.onUp, this);
    this.scene.input.off('pointerupoutside', this.onUp, this);
    this.base.destroy();
    this.thumb.destroy();
  }
}
