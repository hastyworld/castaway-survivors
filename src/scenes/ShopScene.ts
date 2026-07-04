// ============================================================
// ShopScene.ts — 상점 (판 밖 영구 성장 ②, 골드로 구매)
// 기획안 5번: 유저가 체감하는 "점점 강해진다"의 핵심 축.
// ============================================================
import Phaser from 'phaser';
import { CSS, FONT, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { drawGradient } from '../ui/Background';
import { makeButton } from '../ui/Button';
import { load, save, PERM_UPGRADES, permCost, resetSave } from '../save';

export default class ShopScene extends Phaser.Scene {
  constructor() {
    super('Shop');
  }

  create(): void {
    drawGradient(this, COLORS.panel, COLORS.oceanDark);
    const data = load();

    this.add
      .text(GAME_WIDTH / 2, 56, '상점', { fontFamily: FONT, fontSize: '34px', color: CSS.text, fontStyle: 'bold' })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 94, `보유 골드  ◈${data.gold}`, { fontFamily: FONT, fontSize: '18px', color: CSS.accent })
      .setOrigin(0.5);

    const startY = 150;
    const rowH = 110;

    PERM_UPGRADES.forEach((u, i) => {
      const y = startY + i * rowH;
      const lvl = data.perm[u.id];
      const maxed = lvl >= u.maxLevel;
      const cost = permCost(u, lvl);
      const affordable = !maxed && data.gold >= cost;

      const panel = this.add
        .rectangle(GAME_WIDTH / 2, y + rowH / 2 - 8, GAME_WIDTH - 40, rowH - 16, COLORS.panel, 0.9)
        .setStrokeStyle(2, COLORS.panelBorder);

      this.add
        .text(panel.x - panel.width / 2 + 16, y + 8, u.name, {
          fontFamily: FONT,
          fontSize: '19px',
          color: CSS.text,
          fontStyle: 'bold',
        })
        .setOrigin(0, 0);
      this.add
        .text(panel.x - panel.width / 2 + 16, y + 36, u.desc, { fontFamily: FONT, fontSize: '14px', color: CSS.textDim })
        .setOrigin(0, 0);

      // 레벨 표시 (칸)
      const dots = Array.from({ length: u.maxLevel }, (_, k) => (k < lvl ? '●' : '○')).join(' ');
      this.add
        .text(panel.x - panel.width / 2 + 16, y + 62, dots, { fontFamily: FONT, fontSize: '13px', color: CSS.accent })
        .setOrigin(0, 0);

      // 구매 버튼
      const label = maxed ? 'MAX' : `◈${cost}`;
      makeButton(
        this,
        panel.x + panel.width / 2 - 62,
        y + rowH / 2 - 8,
        label,
        () => {
          const d = load();
          const curLvl = d.perm[u.id];
          const c = permCost(u, curLvl);
          if (curLvl < u.maxLevel && d.gold >= c) {
            d.gold -= c;
            d.perm[u.id] = curLvl + 1;
            save(d);
            this.scene.restart();
          }
        },
        { width: 96, height: 46, fontSize: 17, disabled: maxed || !affordable }
      );
    });

    makeButton(this, GAME_WIDTH / 2 - 90, GAME_HEIGHT - 54, '← 타이틀', () => this.scene.start('Title'), {
      width: 150,
      height: 50,
      fill: COLORS.panelBorder,
      textColor: '#ffffff',
      fontSize: 17,
    });
    makeButton(
      this,
      GAME_WIDTH / 2 + 90,
      GAME_HEIGHT - 54,
      '기록 초기화',
      () => {
        resetSave();
        this.scene.restart();
      },
      { width: 150, height: 50, fill: COLORS.danger, textColor: '#ffffff', fontSize: 15 }
    );
  }
}
