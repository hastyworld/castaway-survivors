// ============================================================
// Background.ts — 세로 그라데이션 배경 (바다→모래/정글 톤)
// ============================================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export function drawGradient(scene: Phaser.Scene, top: number, bottom: number, depth = -100): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillGradientStyle(top, top, bottom, bottom, 1);
  g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  g.setDepth(depth);
  return g;
}
