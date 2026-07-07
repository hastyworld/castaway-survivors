// ============================================================
// BootScene.ts — 시작 시 필요한 텍스처를 코드로 즉석 생성
// 실제 그림은 src/art.ts 에서 (캐릭터/적/보스/소품 벡터 아트).
// ============================================================
import Phaser from 'phaser';
import { generateArt } from '../art';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateArt(this);
    this.scene.start('Title');
  }
}
