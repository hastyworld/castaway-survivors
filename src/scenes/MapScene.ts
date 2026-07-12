// ============================================================
// MapScene.ts — 섬 선택 (Island). 섬 하나를 고르면 판(Run) 선택 화면으로.
// ============================================================
import Phaser from 'phaser';
import { CSS, FONT, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { drawMenuBg } from '../ui/Background';
import { makeButton } from '../ui/Button';
import { goldChip } from '../ui/Panel';
import { ISLAND_THEMES, RUNS_PER_ISLAND } from '../content';
import { load, isIslandUnlocked, currentVehicle, runsClearedIn } from '../save';
import { Sfx } from '../systems/Sfx';

export default class MapScene extends Phaser.Scene {
  constructor() {
    super('Map');
  }

  create(): void {
    drawMenuBg(this, COLORS.oceanDark, 0x1f4a5e, COLORS.accent2);
    const data = load();

    this.add.text(GAME_WIDTH / 2, 46, '섬 선택', { fontFamily: FONT, fontSize: '30px', color: CSS.text, fontStyle: 'bold' }).setOrigin(0.5).setShadow(0, 3, '#00000077', 6);
    this.add.text(GAME_WIDTH / 2, 76, `섬 ${ISLAND_THEMES.length}개  ·  🚢 ${currentVehicle()}`, { fontFamily: FONT, fontSize: '13px', color: CSS.textDim }).setOrigin(0.5);
    goldChip(this, GAME_WIDTH / 2, 104, data.gold);

    const cols = 2;
    const colX = [GAME_WIDTH * 0.3, GAME_WIDTH * 0.7];
    const startY = 190;
    const rowGap = 176;

    ISLAND_THEMES.forEach((theme, i) => {
      const x = colX[i % cols];
      const y = startY + Math.floor(i / cols) * rowGap;
      const unlocked = isIslandUnlocked(i);
      const cleared = runsClearedIn(i);
      const fullClear = cleared >= RUNS_PER_ISLAND;

      this.makeIslandBadge(x, y, i, theme, unlocked, fullClear);

      this.add.text(x, y + 54, theme.name, { fontFamily: FONT, fontSize: '14px', color: unlocked ? CSS.text : '#5b6b79', fontStyle: 'bold' }).setOrigin(0.5);
      this.add
        .text(x, y + 74, unlocked ? `클리어 ${cleared}/${RUNS_PER_ISLAND}` : '🔒 잠김', {
          fontFamily: FONT, fontSize: '12px', color: fullClear ? CSS.accent : unlocked ? CSS.textDim : '#5b6b79',
        })
        .setOrigin(0.5);
    });

    makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 40, '← 타이틀', () => this.scene.start('Title'), {
      width: 168, height: 46, fill: COLORS.panelBorder, textColor: '#ffffff', fontSize: 16,
    });
  }

  // 입체 섬 배지 (그림자 + 테마색 + 광택 + 상태)
  private makeIslandBadge(x: number, y: number, i: number, theme: { bgBottom: number }, unlocked: boolean, fullClear: boolean): void {
    const node = this.add.container(x, y);
    const R = 38;
    const ringColor = fullClear ? COLORS.accent : unlocked ? COLORS.panelHi : 0x3a4652;

    const g = this.add.graphics();
    g.fillStyle(COLORS.shadow, 0.35);
    g.fillCircle(0, 6, R);
    g.fillStyle(unlocked ? theme.bgBottom : 0x24333f, 1);
    g.fillCircle(0, 0, R);
    // 광택
    g.fillStyle(0xffffff, unlocked ? 0.18 : 0.06);
    g.fillEllipse(0, -R * 0.4, R * 1.2, R * 0.7);
    // 테두리 링
    g.lineStyle(4, ringColor, 1);
    g.strokeCircle(0, 0, R);

    const num = this.add.text(0, 0, fullClear ? '★' : String(i + 1), {
      fontFamily: FONT, fontSize: fullClear ? '30px' : '28px', color: unlocked ? (fullClear ? CSS.accent : '#fff') : '#5a6a78', fontStyle: 'bold',
    }).setOrigin(0.5);
    node.add([g, num]);

    if (unlocked) {
      const zone = this.add.zone(x, y, R * 2 + 8, R * 2 + 8).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => this.tweens.add({ targets: node, scale: 1.1, duration: 90 }));
      zone.on('pointerout', () => this.tweens.add({ targets: node, scale: 1, duration: 90 }));
      zone.on('pointerup', () => { Sfx.click(); this.scene.start('Runs', { island: i }); });
    }
  }
}
