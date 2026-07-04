// ============================================================
// MapScene.ts — 여정 지도 (섬 선택). 기획안 6단계: 섬→탈출→다음 섬.
// ============================================================
import Phaser from 'phaser';
import { CSS, FONT, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { drawGradient } from '../ui/Background';
import { makeButton } from '../ui/Button';
import { ISLANDS } from '../content';
import { load, isIslandUnlocked } from '../save';

export default class MapScene extends Phaser.Scene {
  constructor() {
    super('Map');
  }

  create(): void {
    drawGradient(this, COLORS.ocean, COLORS.oceanDark);
    const data = load();

    this.add
      .text(GAME_WIDTH / 2, 60, '여정 지도', { fontFamily: FONT, fontSize: '32px', color: CSS.text, fontStyle: 'bold' })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 98, '섬을 정복하고 배를 만들어 다음 섬으로 탈출하세요', {
        fontFamily: FONT,
        fontSize: '13px',
        color: CSS.textDim,
      })
      .setOrigin(0.5);

    const startY = 150;
    const rowH = 190;

    ISLANDS.forEach((island, i) => {
      const y = startY + i * rowH;
      const unlocked = isIslandUnlocked(island.id);
      const cleared = data.clearedIslands.includes(island.id);

      const panel = this.add
        .rectangle(GAME_WIDTH / 2, y + rowH / 2 - 12, GAME_WIDTH - 44, rowH - 24, COLORS.panel, unlocked ? 0.95 : 0.5)
        .setStrokeStyle(3, cleared ? COLORS.accent : COLORS.panelBorder);

      // 섬 아이콘
      this.add.image(panel.x - panel.width / 2 + 56, y + rowH / 2 - 12, 'circle')
        .setTint(island.bgBottom)
        .setDisplaySize(64, 64)
        .setAlpha(unlocked ? 1 : 0.4);

      const tx = panel.x - panel.width / 2 + 104;
      this.add
        .text(tx, y + 22, `섬 ${island.id + 1}. ${island.name}`, {
          fontFamily: FONT,
          fontSize: '20px',
          color: unlocked ? CSS.text : '#6f8496',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0);
      this.add
        .text(tx, y + 52, `탈출 탈것: ${island.vehicle}  ·  웨이브 ${island.waves.length} + 보스`, {
          fontFamily: FONT,
          fontSize: '13px',
          color: CSS.textDim,
        })
        .setOrigin(0, 0);
      this.add
        .text(tx, y + 74, cleared ? '✔ 클리어 완료' : unlocked ? '도전 가능' : '🔒 이전 섬을 먼저 클리어', {
          fontFamily: FONT,
          fontSize: '13px',
          color: cleared ? CSS.green : unlocked ? CSS.accent : '#6f8496',
        })
        .setOrigin(0, 0);

      makeButton(
        this,
        panel.x,
        y + rowH / 2 + 44,
        unlocked ? (cleared ? '다시 도전' : '출발!') : '잠김',
        () => this.scene.start('Game', { islandId: island.id }),
        {
          width: panel.width - 40,
          height: 42,
          fontSize: 17,
          disabled: !unlocked,
          fill: cleared ? COLORS.panelBorder : COLORS.accent,
          textColor: cleared ? '#ffffff' : '#3a2a00',
        }
      );
    });

    makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 46, '← 타이틀', () => this.scene.start('Title'), {
      width: 150,
      height: 46,
      fill: COLORS.panelBorder,
      textColor: '#ffffff',
      fontSize: 16,
    });
  }
}
