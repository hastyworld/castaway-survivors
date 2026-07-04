// ============================================================
// LevelUp.ts — 레벨업 시 3개 중 택1 팝업 (기획안 3단계)
// 판 안 성장(①)의 핵심 재미. 게임은 이 동안 일시정지.
// ============================================================
import Phaser from 'phaser';
import { CSS, FONT, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

export interface UpgradeOption {
  kind: 'weapon' | 'passive';
  id: string;
  title: string;
  tag: string; // 'NEW' 또는 'Lv.n → n+1'
  desc: string;
  color: number;
}

export default class LevelUp {
  private scene: Phaser.Scene;
  private group?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(options: UpgradeOption[], onPick: (opt: UpgradeOption) => void): void {
    const s = this.scene;
    const c = s.add.container(0, 0).setDepth(500).setScrollFactor(0);

    const dim = s.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72).setOrigin(0, 0).setInteractive();
    const title = s.add
      .text(GAME_WIDTH / 2, 150, '레벨 업!', { fontFamily: FONT, fontSize: '34px', color: CSS.accent, fontStyle: 'bold' })
      .setOrigin(0.5);
    const sub = s.add
      .text(GAME_WIDTH / 2, 190, '하나를 골라 더 강해지세요', { fontFamily: FONT, fontSize: '15px', color: CSS.textDim })
      .setOrigin(0.5);
    c.add([dim, title, sub]);

    const cardW = GAME_WIDTH - 60;
    const cardH = 120;
    const startY = 250;
    const gap = 20;

    options.forEach((opt, i) => {
      const y = startY + i * (cardH + gap);
      const card = s.add.container(GAME_WIDTH / 2, y + cardH / 2);

      const bg = s.add.rectangle(0, 0, cardW, cardH, COLORS.panel).setStrokeStyle(3, opt.color);
      bg.setInteractive({ useHandCursor: true });

      const icon = s.add.circle(-cardW / 2 + 44, 0, 26, opt.color);
      const tTitle = s.add
        .text(-cardW / 2 + 84, -26, opt.title, { fontFamily: FONT, fontSize: '20px', color: CSS.text, fontStyle: 'bold' })
        .setOrigin(0, 0.5);
      const tTag = s.add
        .text(cardW / 2 - 16, -26, opt.tag, { fontFamily: FONT, fontSize: '14px', color: CSS.accent, fontStyle: 'bold' })
        .setOrigin(1, 0.5);
      const tDesc = s.add
        .text(-cardW / 2 + 84, 14, opt.desc, {
          fontFamily: FONT,
          fontSize: '14px',
          color: CSS.textDim,
          wordWrap: { width: cardW - 110 },
        })
        .setOrigin(0, 0.5);

      card.add([bg, icon, tTitle, tTag, tDesc]);
      c.add(card);

      const pick = () => {
        this.close();
        onPick(opt);
      };
      bg.on('pointerover', () => bg.setFillStyle(0x16374f));
      bg.on('pointerout', () => bg.setFillStyle(COLORS.panel));
      bg.on('pointerup', pick);

      // 등장 애니메이션
      card.setScale(0.85).setAlpha(0);
      s.tweens.add({ targets: card, scale: 1, alpha: 1, duration: 180, delay: 60 * i, ease: 'Back.out' });
    });

    this.group = c;
  }

  private close(): void {
    this.group?.destroy(true);
    this.group = undefined;
  }

  get isOpen(): boolean {
    return !!this.group;
  }
}
