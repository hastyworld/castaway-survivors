// ============================================================
// RunSelectScene.ts — 판(Run) 선택. 섬 하나 안의 12판을 노드로.
// 판 = 스테이지 3~6개 + 보스. 순서대로 해금.
// ============================================================
import Phaser from 'phaser';
import { CSS, FONT, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { drawGradient } from '../ui/Background';
import { makeButton } from '../ui/Button';
import { ISLAND_THEMES, RUNS_PER_ISLAND } from '../content';
import { isRunUnlocked, runsClearedIn } from '../save';
import { Sfx } from '../systems/Sfx';

export default class RunSelectScene extends Phaser.Scene {
  private island = 0;

  constructor() {
    super('Runs');
  }

  create(data: { island: number }): void {
    this.island = data.island ?? 0;
    const theme = ISLAND_THEMES[this.island];
    drawGradient(this, theme.bgTop, theme.bgBottom);

    this.add.text(GAME_WIDTH / 2, 44, theme.name, { fontFamily: FONT, fontSize: '28px', color: CSS.text, fontStyle: 'bold' }).setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 74, `판 선택  ·  클리어 ${runsClearedIn(this.island)}/${RUNS_PER_ISLAND}`, { fontFamily: FONT, fontSize: '13px', color: CSS.accent })
      .setOrigin(0.5);

    const cols = 3;
    const marginX = 80;
    const startY = 150;
    const rowGap = 132;
    const colGap = (GAME_WIDTH - marginX * 2) / (cols - 1);

    const pos = Array.from({ length: RUNS_PER_ISLAND }, (_, i) => {
      const r = Math.floor(i / cols);
      const cRaw = i % cols;
      const c = r % 2 === 0 ? cRaw : cols - 1 - cRaw;
      return { x: marginX + c * colGap, y: startY + r * rowGap };
    });

    const line = this.add.graphics().setDepth(0);
    line.lineStyle(4, 0xffffff, 0.12);
    for (let i = 0; i < pos.length - 1; i++) line.lineBetween(pos[i].x, pos[i].y, pos[i + 1].x, pos[i + 1].y);

    const nextRun = runsClearedIn(this.island); // 다음 도전할 판

    for (let run = 0; run < RUNS_PER_ISLAND; run++) {
      const { x, y } = pos[run];
      const unlocked = isRunUnlocked(this.island, run);
      const cleared = run < runsClearedIn(this.island);

      const node = this.add.container(x, y).setDepth(1);
      const border = cleared ? COLORS.accent : unlocked ? COLORS.panelBorder : 0x3a4652;
      const ring = this.add.circle(0, 0, 25, theme.bgBottom, unlocked ? 1 : 0.35).setStrokeStyle(4, border, 1);
      const label = cleared ? '✓' : String(run + 1);
      const num = this.add.text(0, 0, label, { fontFamily: FONT, fontSize: cleared ? '24px' : '20px', color: unlocked ? (cleared ? CSS.accent : '#fff') : '#5a6a78', fontStyle: 'bold' }).setOrigin(0.5);
      node.add([ring, num]);

      if (unlocked) {
        ring.setInteractive({ useHandCursor: true });
        ring.on('pointerover', () => this.tweens.add({ targets: node, scale: 1.14, duration: 90 }));
        ring.on('pointerout', () => this.tweens.add({ targets: node, scale: 1, duration: 90 }));
        ring.on('pointerup', () => {
          Sfx.click();
          this.scene.start('Game', { island: this.island, run });
        });
        if (run === nextRun) this.tweens.add({ targets: node, scale: 1.12, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
    }

    makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 40, '← 섬 선택', () => this.scene.start('Map'), {
      width: 160,
      height: 44,
      fill: COLORS.panelBorder,
      textColor: '#ffffff',
      fontSize: 16,
    });
  }
}
