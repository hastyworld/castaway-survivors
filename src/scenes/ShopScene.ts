// ============================================================
// ShopScene.ts — 상점 (판 밖 영구 성장 ②, 골드로 구매)
// ============================================================
import Phaser from 'phaser';
import { CSS, FONT, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { drawMenuBg } from '../ui/Background';
import { makeButton } from '../ui/Button';
import { drawPanel, goldChip } from '../ui/Panel';
import { load, save, PERM_UPGRADES, permCost, resetSave } from '../save';

const ICONS: Record<string, string> = { maxhp: '❤️', power: '💪', speed: '🌀', magnet: '🧲' };

export default class ShopScene extends Phaser.Scene {
  constructor() {
    super('Shop');
  }

  create(): void {
    drawMenuBg(this, COLORS.oceanDark, 0x2a3f52, COLORS.accent);
    const data = load();

    this.add.text(GAME_WIDTH / 2, 52, '상점', { fontFamily: FONT, fontSize: '32px', color: CSS.text, fontStyle: 'bold' }).setOrigin(0.5).setShadow(0, 3, '#00000077', 6);
    this.add.text(GAME_WIDTH / 2, 82, '영구 성장 · 모든 판에 적용', { fontFamily: FONT, fontSize: '13px', color: CSS.textDim }).setOrigin(0.5);
    goldChip(this, GAME_WIDTH / 2, 112, data.gold);

    const startY = 156;
    const rowH = 104;

    PERM_UPGRADES.forEach((u, i) => {
      const cy = startY + i * rowH + (rowH - 12) / 2;
      const lvl = data.perm[u.id];
      const maxed = lvl >= u.maxLevel;
      const cost = permCost(u, lvl);
      const affordable = !maxed && data.gold >= cost;
      const pw = GAME_WIDTH - 36;

      drawPanel(this, GAME_WIDTH / 2, cy, pw, rowH - 14, { radius: 18 });
      const left = GAME_WIDTH / 2 - pw / 2;

      // 아이콘 배지
      const ig = this.add.graphics();
      ig.fillStyle(COLORS.oceanDark, 0.9);
      ig.fillCircle(left + 40, cy, 26);
      ig.lineStyle(2, maxed ? COLORS.accent : COLORS.panelBorder, 0.9);
      ig.strokeCircle(left + 40, cy, 26);
      this.add.text(left + 40, cy, ICONS[u.id] ?? '◆', { fontFamily: FONT, fontSize: '24px' }).setOrigin(0.5);

      this.add.text(left + 78, cy - 22, u.name, { fontFamily: FONT, fontSize: '19px', color: CSS.text, fontStyle: 'bold' }).setOrigin(0, 0.5);
      this.add.text(left + 78, cy, u.desc, { fontFamily: FONT, fontSize: '13px', color: CSS.textDim }).setOrigin(0, 0.5);

      // 레벨 진행 점
      const dots = Array.from({ length: u.maxLevel }, (_, k) => (k < lvl ? '●' : '○')).join(' ');
      this.add.text(left + 78, cy + 22, dots, { fontFamily: FONT, fontSize: '13px', color: maxed ? CSS.accent : CSS.textDim }).setOrigin(0, 0.5);

      // 구매 버튼
      const label = maxed ? 'MAX' : `◈${cost}`;
      makeButton(
        this,
        GAME_WIDTH / 2 + pw / 2 - 56,
        cy,
        label,
        () => {
          const d = load();
          const curLvl = d.perm[u.id];
          const cc = permCost(u, curLvl);
          if (curLvl < u.maxLevel && d.gold >= cc) {
            d.gold -= cc;
            d.perm[u.id] = curLvl + 1;
            save(d);
            this.scene.restart();
          }
        },
        { width: 92, height: 48, fontSize: 16, disabled: maxed || !affordable }
      );
    });

    makeButton(this, GAME_WIDTH / 2 - 92, GAME_HEIGHT - 46, '← 타이틀', () => this.scene.start('Title'), {
      width: 156, height: 50, fill: COLORS.panelBorder, textColor: '#ffffff', fontSize: 16,
    });
    makeButton(this, GAME_WIDTH / 2 + 92, GAME_HEIGHT - 46, '기록 초기화', () => { resetSave(); this.scene.restart(); }, {
      width: 156, height: 50, fill: COLORS.danger, textColor: '#ffffff', fontSize: 15,
    });
  }
}
