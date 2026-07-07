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
    g.clear();

    // 파티클용 작은 스파크 (부드러운 점)
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(8, 8, 8);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 4);
    g.generateTexture('spark', 16, 16);
    g.clear();

    // 불가사리 표창용 5각 별 (64px, setCircle(32) 호환)
    g.fillStyle(0xffffff, 1);
    const cx = 32;
    const cy = 32;
    const outer = 30;
    const inner = 14;
    const pts = 5;
    g.beginPath();
    for (let i = 0; i < pts * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (Math.PI / pts) * i - Math.PI / 2;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
    g.generateTexture('star', 64, 64);

    g.destroy();

    this.scene.start('Title');
  }
}
