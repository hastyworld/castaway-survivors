// ============================================================
// Background.ts — 배경 그리기
//  · drawGradient : 단순 세로 그라데이션 (게임 하늘용, 그대로 유지)
//  · drawMenuBg   : 메뉴 전용 풀 배경 (그라데이션 + 수평선 노을빛 +
//                   비네팅 + 떠다니는 빛방울) — "석양의 무인도" 룩
// ============================================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

export function drawGradient(scene: Phaser.Scene, top: number, bottom: number, depth = -100): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillGradientStyle(top, top, bottom, bottom, 1);
  g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  g.setDepth(depth);
  return g;
}

// 메뉴 화면용 분위기 배경. glow 색을 주면 수평선 노을빛 색을 바꿀 수 있음.
export function drawMenuBg(scene: Phaser.Scene, top: number, bottom: number, glowColor: number = COLORS.accent2): void {
  const W = GAME_WIDTH;
  const H = GAME_HEIGHT;

  // 1) 세로 그라데이션 (위: 어두운 하늘 / 아래: 수평선 톤)
  const g = scene.add.graphics().setDepth(-100);
  g.fillGradientStyle(top, top, bottom, bottom, 1);
  g.fillRect(0, 0, W, H);

  // 2) 수평선 노을빛 — 큰 부드러운 광채 (가법 합성)
  scene.add
    .image(W / 2, H * 0.66, 'glow')
    .setTint(glowColor)
    .setAlpha(0.28)
    .setDisplaySize(W * 1.9, H * 0.9)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(-99);
  // 상단 살짝 밝은 별빛 광채
  scene.add
    .image(W * 0.5, H * 0.12, 'glow')
    .setTint(0x9fd0ff)
    .setAlpha(0.1)
    .setDisplaySize(W * 1.4, H * 0.5)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(-99);

  // 3) 떠다니는 빛방울 (bokeh) — 위로 부유
  for (let i = 0; i < 14; i++) {
    const r = Phaser.Math.Between(3, 10);
    const dot = scene.add
      .image(Phaser.Math.Between(20, W - 20), Phaser.Math.Between(80, H - 40), 'glow')
      .setTint(i % 3 === 0 ? glowColor : 0xffffff)
      .setAlpha(Phaser.Math.FloatBetween(0.05, 0.16))
      .setDisplaySize(r * 4, r * 4)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(-98);
    scene.tweens.add({
      targets: dot,
      y: dot.y - Phaser.Math.Between(40, 90),
      alpha: 0,
      duration: Phaser.Math.Between(4000, 8000),
      delay: Phaser.Math.Between(0, 3000),
      repeat: -1,
      ease: 'Sine.inOut',
      onRepeat: () => {
        dot.y = H + 20;
        dot.x = Phaser.Math.Between(20, W - 20);
        dot.setAlpha(Phaser.Math.FloatBetween(0.05, 0.16));
      },
    });
  }

  // 4) 비네팅 — 가장자리를 어둡게 눌러 화면에 집중감
  scene.add.image(W / 2, H / 2, 'vignette').setDisplaySize(W * 1.05, H * 1.05).setDepth(-97);
}
