// ============================================================
// LevelUp.ts — 레벨업 시 3개 중 택1
// ⚠ 입력 확실화: 조이스틱과 '동일한' 씬 레벨 포인터 입력을 사용.
//   (조이스틱이 폰에서 작동 = 씬 pointerdown 은 확실히 먹힘)
//   카드마다 게임오브젝트 히트영역에 의존하지 않고, 탭 좌표가
//   어느 카드 사각형 안인지 직접 계산해서 선택 → 컨테이너/depth/히트영역 이슈 무관.
// ============================================================
import Phaser from 'phaser';
import { CSS, FONT, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

export interface UpgradeOption {
  kind: 'weapon' | 'passive' | 'evolve';
  id: string;
  title: string;
  tag: string;
  desc: string;
  color: number;
}

interface CardRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opt: UpgradeOption;
  bg: Phaser.GameObjects.NineSlice;
}

export default class LevelUp {
  private scene: Phaser.Scene;
  private items?: Phaser.GameObjects.GameObject[];
  private onDown?: (p: Phaser.Input.Pointer) => void;
  private onMove?: (p: Phaser.Input.Pointer) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(options: UpgradeOption[], onPick: (opt: UpgradeOption) => void): void {
    const s = this.scene;
    const armAt = s.time.now + 180; // 팝업 직후 스침 방지
    let done = false;
    const items: Phaser.GameObjects.GameObject[] = [];
    const rects: CardRect[] = [];

    const dim = s.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x06121c, 0.82).setOrigin(0, 0).setScrollFactor(0).setDepth(500);
    const title = s.add.text(GAME_WIDTH / 2, 130, '레벨 업!', { fontFamily: FONT, fontSize: '36px', color: CSS.accent, fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
    const sub = s.add.text(GAME_WIDTH / 2, 172, '스킬 하나를 탭하세요', { fontFamily: FONT, fontSize: '15px', color: CSS.textDim }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
    items.push(dim, title, sub);

    const cardW = GAME_WIDTH - 52;
    const cardH = 116;
    const startY = 234;
    const gap = 18;
    const cx = GAME_WIDTH / 2;

    options.forEach((opt, i) => {
      const cy = startY + i * (cardH + gap) + cardH / 2;

      const bg = s.add.nineslice(cx, cy, 'panel', undefined, cardW, cardH, 18, 18, 18, 18).setTint(COLORS.panel).setScrollFactor(0).setDepth(502);
      const icon = s.add.circle(cx - cardW / 2 + 46, cy, 27, opt.color).setScrollFactor(0).setDepth(503);
      const icon2 = s.add.circle(cx - cardW / 2 + 46, cy, 21, 0xffffff, 0.18).setScrollFactor(0).setDepth(503);
      const tTitle = s.add.text(cx - cardW / 2 + 86, cy - 24, opt.title, { fontFamily: FONT, fontSize: '20px', color: CSS.text, fontStyle: 'bold' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(503);
      const tTag = s.add.text(cx + cardW / 2 - 20, cy - 24, opt.tag, { fontFamily: FONT, fontSize: '14px', color: CSS.accent, fontStyle: 'bold' }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(503);
      const tDesc = s.add.text(cx - cardW / 2 + 86, cy + 18, opt.desc, { fontFamily: FONT, fontSize: '14px', color: CSS.textDim, wordWrap: { width: cardW - 120 } }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(503);
      items.push(bg, icon, icon2, tTitle, tTag, tDesc);

      rects.push({ x1: cx - cardW / 2, y1: cy - cardH / 2, x2: cx + cardW / 2, y2: cy + cardH / 2, opt, bg });

      bg.setScale(0.94).setAlpha(0);
      s.tweens.add({ targets: bg, scale: 1, alpha: 1, duration: 150, delay: 45 * i, ease: 'Back.out' });
    });

    // 탭 좌표로 어느 카드인지 직접 판정 (조이스틱과 같은 씬 입력)
    const cardAt = (px: number, py: number): CardRect | null => {
      for (const r of rects) if (px >= r.x1 && px <= r.x2 && py >= r.y1 && py <= r.y2) return r;
      return null;
    };
    this.onMove = (p) => {
      const r = cardAt(p.x, p.y);
      rects.forEach((rr) => rr.bg.setTint(rr === r ? 0x16506e : COLORS.panel));
    };
    this.onDown = (p) => {
      if (done || s.time.now < armAt) return;
      const r = cardAt(p.x, p.y);
      if (r) {
        done = true;
        this.close();
        onPick(r.opt);
      }
    };
    s.input.on('pointermove', this.onMove);
    s.input.on('pointerdown', this.onDown);

    this.items = items;
  }

  private close(): void {
    if (this.onDown) this.scene.input.off('pointerdown', this.onDown);
    if (this.onMove) this.scene.input.off('pointermove', this.onMove);
    this.onDown = undefined;
    this.onMove = undefined;
    this.items?.forEach((o) => o.destroy());
    this.items = undefined;
  }

  get isOpen(): boolean {
    return !!this.items;
  }
}
