// ============================================================
// BootScene.ts — 시작 시 필요한 텍스처를 코드로 즉석 생성
// (기획안 9단계 전까지는 임시 도형. 나중에 AI 스프라이트로 교체)
// ============================================================
import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const g = this.make.graphics({ x: 0, y: 0 });

    // 흰색 원 (플레이어/적/투사체/오라에 tint 입혀 재사용)
    g.fillStyle(0xffffff, 1);
    g.fillCircle(32, 32, 32);
    g.generateTexture('circle', 64, 64);
    g.clear();

    // 경험치 젬 (다이아몬드)
    g.fillStyle(0xffffff, 1);
    g.beginPath();
    g.moveTo(12, 0);
    g.lineTo(24, 12);
    g.lineTo(12, 24);
    g.lineTo(0, 12);
    g.closePath();
    g.fillPath();
    g.generateTexture('gem', 24, 24);
    g.clear();

    // 조이스틱 베이스 (링)
    g.lineStyle(6, 0xffffff, 1);
    g.strokeCircle(70, 70, 64);
    g.generateTexture('joyBase', 140, 140);
    g.clear();

    // 조이스틱 썸 (원)
    g.fillStyle(0xffffff, 1);
    g.fillCircle(32, 32, 30);
    g.generateTexture('joyThumb', 64, 64);

    g.destroy();

    this.scene.start('Title');
  }
}
