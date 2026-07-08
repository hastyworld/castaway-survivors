// ============================================================
// LevelUp.ts — 레벨업 시 3개 중 택1 팝업 (기획안 3단계)
// 판 안 성장(①)의 핵심 재미. 게임은 이 동안 일시정지.
// ============================================================
import Phaser from 'phaser';
import { CSS, FONT, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

export interface UpgradeOption {
  kind: 'weapon' | 'passive' | 'evolve';
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
      .text(GAME_WIDTH / 2, 190, "카드를 '눌렀다 떼서' 선택하세요 (스치기만 하면 안 됨)", {
        fontFamily: FONT,
        fontSize: '14px',
        color: CSS.textDim,
      })
      .setOrigin(0.5);
    c.add([dim, title, sub]);

    const cardW = GAME_WIDTH - 60;
    const cardH = 120;
    const startY = 250;
    const gap = 20;

    // 팝업이 뜬 직후 짧은 시간은 선택 무시 (조이스틱 떼는 손가락의 오작동 방지)
    const armAt = s.time.now + 420;
    // 카드에서 '눌렀다 뗀' 경우에만 선택 → 지나가는 터치로 선택되지 않음
    let pressed: Phaser.GameObjects.Rectangle | null = null;

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

      const hi = (on: boolean) => bg.setFillStyle(on ? 0x1a4363 : COLORS.panel);
      bg.on('pointerdown', () => {
        if (s.time.now < armAt) return;
        pressed = bg;
        hi(true);
      });
      bg.on('pointerout', () => {
        if (pressed === bg) pressed = null;
        hi(false);
      });
      bg.on('pointerup', () => {
        if (s.time.now < armAt || pressed !== bg) return; // 이 카드에서 누르고 뗀 경우만
        this.close();
        onPick(opt);
      });

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
