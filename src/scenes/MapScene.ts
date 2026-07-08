// ============================================================
// MapScene.ts — 섬 선택 (Island). 섬 하나를 고르면 판(Run) 선택 화면으로.
// ============================================================
import Phaser from 'phaser';
import { CSS, FONT, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { drawGradient } from '../ui/Background';
import { makeButton } from '../ui/Button';
import { ISLAND_THEMES, RUNS_PER_ISLAND } from '../content';
import { load, isIslandUnlocked, currentVehicle, runsClearedIn } from '../save';
import { Sfx } from '../systems/Sfx';

export default class MapScene extends Phaser.Scene {
  constructor() {
    super('Map');
  }

  create(): void {
    drawGradient(this, COLORS.ocean, COLORS.oceanDark);
    const data = load();

    this.add.text(GAME_WIDTH / 2, 44, '섬 선택', { fontFamily: FONT, fontSize: '30px', color: CSS.text, fontStyle: 'bold' }).setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 76, `섬 ${ISLAND_THEMES.length}개  ·  탈것: ${currentVehicle()}  ·  ◈${data.gold}`, { fontFamily: FONT, fontSize: '13px', color: CSS.accent })
      .setOrigin(0.5);

    const cols = 2;
    const colX = [GAME_WIDTH * 0.3, GAME_WIDTH * 0.7];
    const startY = 168;
    const rowGap = 176;

    ISLAND_THEMES.forEach((theme, i) => {
      const x = colX[i % cols];
      const y = startY + Math.floor(i / cols) * rowGap;
      const unlocked = isIslandUnlocked(i);
      const cleared = runsClearedIn(i);
      const fullClear = cleared >= RUNS_PER_ISLAND;

      const node = this.add.container(x, y);
      const border = fullClear ? COLORS.accent : unlocked ? COLORS.panelBorder : 0x3a4652;
      const ring = this.add.circle(0, 0, 34, theme.bgBottom, unlocked ? 1 : 0.35).setStrokeStyle(4, border, 1);
      const num = this.add.text(0, 0, String(i + 1), { fontFamily: FONT, fontSize: '26px', color: unlocked ? '#fff' : '#5a6a78', fontStyle: 'bold' }).setOrigin(0.5);
      node.add([ring, num]);

      this.add.text(x, y + 46, theme.name, { fontFamily: FONT, fontSize: '13px', color: unlocked ? CSS.text : '#566573', fontStyle: 'bold' }).setOrigin(0.5);
      this.add
        .text(x, y + 64, unlocked ? `클리어 ${cleared}/${RUNS_PER_ISLAND}` : '🔒 잠김', { fontFamily: FONT, fontSize: '12px', color: fullClear ? CSS.accent : unlocked ? CSS.textDim : '#566573' })
        .setOrigin(0.5);

      if (unlocked) {
        ring.setInteractive({ useHandCursor: true });
        ring.on('pointerover', () => this.tweens.add({ targets: node, scale: 1.1, duration: 90 }));
        ring.on('pointerout', () => this.tweens.add({ targets: node, scale: 1, duration: 90 }));
        ring.on('pointerup', () => {
          Sfx.click();
          this.scene.start('Runs', { island: i });
        });
      }
    });

    makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 40, '← 타이틀', () => this.scene.start('Title'), {
      width: 160,
      height: 44,
      fill: COLORS.panelBorder,
      textColor: '#ffffff',
      fontSize: 16,
    });
  }
}
