// ============================================================
// Fx.ts — 시각 효과(손맛): 데미지 숫자 / 처치 파티클 / 연출 플래시
// 데미지 숫자는 풀링(재사용)으로 성능 확보.
// ============================================================
import Phaser from 'phaser';
import { CSS, FONT, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

export default class Fx {
  private scene: Phaser.Scene;
  private pool: Phaser.GameObjects.Text[] = [];
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private hurtOverlay: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // 데미지 숫자 풀
    for (let i = 0; i < 48; i++) {
      const t = scene.add
        .text(0, 0, '', { fontFamily: FONT, fontSize: '15px', color: '#fff', fontStyle: 'bold' })
        .setOrigin(0.5)
        .setDepth(90)
        .setActive(false)
        .setVisible(false);
      this.pool.push(t);
    }

    // 처치 파티클 (하나의 이미터 재사용)
    this.emitter = scene.add.particles(0, 0, 'spark', {
      lifespan: 420,
      speed: { min: 50, max: 160 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
      emitting: false,
    });
    this.emitter.setDepth(7);

    // 피격 붉은 화면 오버레이
    this.hurtOverlay = scene.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.danger, 0)
      .setOrigin(0, 0)
      .setDepth(300)
      .setScrollFactor(0);
  }

  // 데미지 숫자 (크리티컬/보스는 big)
  number(x: number, y: number, amount: number, color = '#ffffff', big = false): void {
    const t = this.pool.find((p) => !p.active);
    if (!t) return;
    t.setActive(true)
      .setVisible(true)
      .setPosition(x + Phaser.Math.Between(-6, 6), y - 8)
      .setText(String(Math.round(amount)))
      .setColor(color)
      .setFontSize(big ? 22 : 15)
      .setAlpha(1)
      .setScale(1);
    this.scene.tweens.add({
      targets: t,
      y: t.y - 34,
      alpha: 0,
      scale: big ? 1.2 : 1,
      duration: 620,
      ease: 'Quad.out',
      onComplete: () => t.setActive(false).setVisible(false),
    });
  }

  // 처치 파티클 버스트
  burst(x: number, y: number, tint = 0xffe0a0, count = 8): void {
    this.emitter.setParticleTint(tint);
    this.emitter.emitParticleAt(x, y, count);
  }

  // 레벨업: 플레이어에서 퍼지는 금색 링 + 화면 살짝 밝게
  levelRing(x: number, y: number): void {
    const ring = this.scene.add.image(x, y, 'circle').setTint(COLORS.accent).setAlpha(0.5).setDepth(6).setScale(0.2);
    this.scene.tweens.add({
      targets: ring,
      scale: 3,
      alpha: 0,
      duration: 500,
      ease: 'Cubic.out',
      onComplete: () => ring.destroy(),
    });
    const flash = this.scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0.25).setOrigin(0, 0).setDepth(299).setScrollFactor(0);
    this.scene.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
  }

  // 피격: 붉은 화면 번쩍
  hurtFlash(): void {
    this.hurtOverlay.setAlpha(0.4);
    this.scene.tweens.add({ targets: this.hurtOverlay, alpha: 0, duration: 300 });
  }

  // 젬 획득: 플레이어 위 작은 반짝임
  spark(x: number, y: number): void {
    this.emitter.setParticleTint(COLORS.xp);
    this.emitter.emitParticleAt(x, y, 2);
  }
}
