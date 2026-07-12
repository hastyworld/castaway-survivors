// ============================================================
// RunSelectScene.ts — 판(Run) 선택. 섬 하나 안의 12판을 노드로.
// ============================================================
import Phaser from 'phaser';
import { CSS, FONT, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { drawMenuBg } from '../ui/Background';
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
    drawMenuBg(this, theme.bgTop, theme.bgBottom, COLORS.accent);

    this.add.text(GAME_WIDTH / 2, 46, theme.name, { fontFamily: FONT, fontSize: '28px', color: CSS.text, fontStyle: 'bold' }).setOrigin(0.5).setShadow(0, 3, '#00000088', 6);
    this.add.text(GAME_WIDTH / 2, 76, `판 선택  ·  클리어 ${runsClearedIn(this.island)}/${RUNS_PER_ISLAND}`, { fontFamily: FONT, fontSize: '13px', color: CSS.accent }).setOrigin(0.5);

    const cols = 3;
    const marginX = 84;
    const startY = 158;
    const rowGap = 128;
    const colGap = (GAME_WIDTH - marginX * 2) / (cols - 1);

    const pos = Array.from({ length: RUNS_PER_ISLAND }, (_, i) => {
      const r = Math.floor(i / cols);
      const cRaw = i % cols;
      const c = r % 2 === 0 ? cRaw : cols - 1 - cRaw;
      return { x: marginX + c * colGap, y: startY + r * rowGap };
    });

    // 노드 잇는 점선 경로
    const line = this.add.graphics().setDepth(0);
    line.lineStyle(5, 0xffffff, 0.14);
    for (let i = 0; i < pos.length - 1; i++) line.lineBetween(pos[i].x, pos[i].y, pos[i + 1].x, pos[i + 1].y);

    const nextRun = runsClearedIn(this.island);

    for (let run = 0; run < RUNS_PER_ISLAND; run++) {
      const { x, y } = pos[run];
      const unlocked = isRunUnlocked(this.island, run);
      const cleared = run < runsClearedIn(this.island);
      const isNext = run === nextRun && unlocked;

      const node = this.add.container(x, y).setDepth(1);
      const R = 27;
      const ringColor = cleared ? COLORS.accent : unlocked ? COLORS.panelHi : 0x3a4652;

      const g = this.add.graphics();
      g.fillStyle(COLORS.shadow, 0.35);
      g.fillCircle(0, 5, R);
      g.fillStyle(unlocked ? (cleared ? 0x1e4a63 : theme.bgBottom) : 0x24333f, 1);
      g.fillCircle(0, 0, R);
      g.fillStyle(0xffffff, unlocked ? 0.16 : 0.05);
      g.fillEllipse(0, -R * 0.4, R * 1.2, R * 0.65);
      g.lineStyle(4, ringColor, 1);
      g.strokeCircle(0, 0, R);

      const label = cleared ? '✓' : unlocked ? String(run + 1) : '🔒';
      const num = this.add.text(0, 0, label, {
        fontFamily: FONT, fontSize: cleared ? '24px' : '18px', color: unlocked ? (cleared ? CSS.accent : '#fff') : '#5a6a78', fontStyle: 'bold',
      }).setOrigin(0.5);
      node.add([g, num]);

      // "다음 도전" 표시
      if (isNext) {
        const halo = this.add.image(x, y, 'glow').setTint(COLORS.accent).setAlpha(0.4).setDisplaySize(R * 3, R * 3).setBlendMode(Phaser.BlendModes.ADD).setDepth(0);
        this.tweens.add({ targets: halo, alpha: 0.15, duration: 800, yoyo: true, repeat: -1 });
        this.tweens.add({ targets: node, scale: 1.12, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }

      if (unlocked) {
        const zone = this.add.zone(x, y, R * 2 + 8, R * 2 + 8).setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => { if (!isNext) this.tweens.add({ targets: node, scale: 1.14, duration: 90 }); });
        zone.on('pointerout', () => { if (!isNext) this.tweens.add({ targets: node, scale: 1, duration: 90 }); });
        zone.on('pointerup', () => { Sfx.click(); this.scene.start('Game', { island: this.island, run }); });
      }
    }

    makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 40, '← 섬 선택', () => this.scene.start('Map'), {
      width: 168, height: 46, fill: COLORS.panelBorder, textColor: '#ffffff', fontSize: 16,
    });
  }
}
