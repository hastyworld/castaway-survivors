// ============================================================
// LevelUp.ts — 레벨업 시 3개 중 택1 (탭해서 선택)
// 카드를 '탭'하면 바로 선택. 팝업 뜬 직후 200ms만 무시(조이스틱 떼는 손가락 오작동 방지).
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
  private items?: Phaser.GameObjects.GameObject[];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(options: UpgradeOption[], onPick: (opt: UpgradeOption) => void): void {
    const s = this.scene;
    const armAt = s.time.now + 200;
    const items: Phaser.GameObjects.GameObject[] = [];

    const dim = s.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x06121c, 0.82).setOrigin(0, 0).setScrollFactor(0).setDepth(500).setInteractive();
    const title = s.add.text(GAME_WIDTH / 2, 132, '레벨 업!', { fontFamily: FONT, fontSize: '36px', color: CSS.accent, fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
    const sub = s.add.text(GAME_WIDTH / 2, 174, '스킬 하나를 탭하세요', { fontFamily: FONT, fontSize: '15px', color: CSS.textDim }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
    items.push(dim, title, sub);

    const cardW = GAME_WIDTH - 52;
    const cardH = 116;
    const startY = 236;
    const gap = 18;

    options.forEach((opt, i) => {
      const cy = startY + i * (cardH + gap) + cardH / 2;
      const card = s.add.container(GAME_WIDTH / 2, cy).setScrollFactor(0).setDepth(502);

      const bg = s.add.nineslice(0, 0, 'panel', undefined, cardW, cardH, 18, 18, 18, 18).setTint(COLORS.panel);
      const iconBg = s.add.circle(-cardW / 2 + 46, 0, 27, opt.color);
      const iconBg2 = s.add.circle(-cardW / 2 + 46, 0, 21, 0xffffff, 0.18);
      const tTitle = s.add.text(-cardW / 2 + 86, -24, opt.title, { fontFamily: FONT, fontSize: '20px', color: CSS.text, fontStyle: 'bold' }).setOrigin(0, 0.5);
      const tTag = s.add.text(cardW / 2 - 20, -24, opt.tag, { fontFamily: FONT, fontSize: '14px', color: CSS.accent, fontStyle: 'bold' }).setOrigin(1, 0.5);
      const tDesc = s.add.text(-cardW / 2 + 86, 18, opt.desc, { fontFamily: FONT, fontSize: '14px', color: CSS.textDim, wordWrap: { width: cardW - 120 } }).setOrigin(0, 0.5);
      // 입력용 투명 Zone (nineslice 는 히트영역이 부정확)
      const hit = s.add.zone(0, 0, cardW, cardH).setInteractive({ useHandCursor: true });

      card.add([bg, iconBg, iconBg2, tTitle, tTag, tDesc, hit]);
      items.push(card);

      const pick = () => {
        if (s.time.now < armAt) return; // 팝업 직후 스침 방지
        this.close();
        onPick(opt);
      };
      hit.on('pointerover', () => bg.setTint(0x16506e));
      hit.on('pointerout', () => bg.setTint(COLORS.panel));
      hit.on('pointerup', pick);

      card.setScale(0.92).setAlpha(0);
      s.tweens.add({ targets: card, scale: 1, alpha: 1, duration: 160, delay: 45 * i, ease: 'Back.out' });
    });

    this.items = items;
  }

  private close(): void {
    this.items?.forEach((o) => o.destroy());
    this.items = undefined;
  }

  get isOpen(): boolean {
    return !!this.items;
  }
}
