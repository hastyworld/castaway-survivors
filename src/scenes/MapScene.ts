// ============================================================
// MapScene.ts — 여정 지도 (레벨 선택 노드맵). 섬 12개가 한 화면에.
// ============================================================
import Phaser from 'phaser';
import { CSS, FONT, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { drawGradient } from '../ui/Background';
import { makeButton } from '../ui/Button';
import { ISLANDS } from '../content';
import { load, isIslandUnlocked, currentVehicle } from '../save';
import { Sfx } from '../systems/Sfx';

export default class MapScene extends Phaser.Scene {
  constructor() {
    super('Map');
  }

  create(): void {
    drawGradient(this, COLORS.ocean, COLORS.oceanDark);
    const data = load();

    this.add
      .text(GAME_WIDTH / 2, 46, '여정 지도', { fontFamily: FONT, fontSize: '30px', color: CSS.text, fontStyle: 'bold' })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 78, `섬 ${ISLANDS.length}개  ·  탈것: ${currentVehicle()}  ·  ◈${data.gold}`, {
        fontFamily: FONT,
        fontSize: '13px',
        color: CSS.accent,
      })
      .setOrigin(0.5);

    // 노드 위치 계산 (3열 × 4행 지그재그)
    const cols = 3;
    const marginX = 80;
    const startY = 168;
    const rowGap = 150;
    const colGap = (GAME_WIDTH - marginX * 2) / (cols - 1);
    const pos: { x: number; y: number }[] = ISLANDS.map((_, i) => {
      const r = Math.floor(i / cols);
      const cRaw = i % cols;
      const c = r % 2 === 0 ? cRaw : cols - 1 - cRaw; // 뱀처럼 지그재그
      return { x: marginX + c * colGap, y: startY + r * rowGap };
    });

    // 연결선 (노드 뒤에)
    const line = this.add.graphics().setDepth(0);
    line.lineStyle(4, 0xffffff, 0.12);
    for (let i = 0; i < pos.length - 1; i++) {
      line.lineBetween(pos[i].x, pos[i].y, pos[i + 1].x, pos[i + 1].y);
    }

    // 다음에 도전할 섬(가장 낮은 미클리어 해금 섬) 강조용
    const nextId = ISLANDS.findIndex((isl) => isIslandUnlocked(isl.id) && !data.clearedIslands.includes(isl.id));

    ISLANDS.forEach((island, i) => {
      const { x, y } = pos[i];
      const unlocked = isIslandUnlocked(island.id);
      const cleared = data.clearedIslands.includes(island.id);

      const node = this.add.container(x, y).setDepth(1);
      const border = cleared ? COLORS.accent : unlocked ? COLORS.panelBorder : 0x3a4652;
      const ring = this.add.circle(0, 0, 27, island.bgBottom, unlocked ? 1 : 0.35).setStrokeStyle(4, border, 1);
      const label = cleared ? '✓' : String(i + 1);
      const num = this.add
        .text(0, 0, label, {
          fontFamily: FONT,
          fontSize: cleared ? '26px' : '22px',
          color: unlocked ? (cleared ? CSS.accent : '#ffffff') : '#5a6a78',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      node.add([ring, num]);

      this.add
        .text(x, y + 36, island.name, { fontFamily: FONT, fontSize: '11px', color: unlocked ? CSS.textDim : '#566573' })
        .setOrigin(0.5);

      if (unlocked) {
        ring.setInteractive({ useHandCursor: true });
        ring.on('pointerover', () => this.tweens.add({ targets: node, scale: 1.12, duration: 90 }));
        ring.on('pointerout', () => this.tweens.add({ targets: node, scale: 1, duration: 90 }));
        ring.on('pointerup', () => {
          Sfx.click();
          this.scene.start('Game', { islandId: island.id });
        });
        if (island.id === nextId) {
          // 도전할 섬은 은은하게 맥동
          this.tweens.add({ targets: node, scale: 1.1, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        }
      }
    });

    makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 44, '← 타이틀', () => this.scene.start('Title'), {
      width: 160,
      height: 46,
      fill: COLORS.panelBorder,
      textColor: '#ffffff',
      fontSize: 16,
    });
  }
}
