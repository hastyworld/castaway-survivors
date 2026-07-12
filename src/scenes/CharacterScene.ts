// ============================================================
// CharacterScene.ts — 캐릭터 선택 + 영구 진화 (골드 사용)
// ============================================================
import Phaser from 'phaser';
import { CSS, FONT, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { drawMenuBg } from '../ui/Background';
import { makeButton } from '../ui/Button';
import { drawPanel, goldChip } from '../ui/Panel';
import { load } from '../save';
import {
  CHARACTERS,
  MAX_STAGE,
  charStage,
  isCharUnlocked,
  selectedCharId,
  selectChar,
  unlockChar,
  evolveChar,
  heroTexture,
} from '../characters';
import { Sfx } from '../systems/Sfx';

export default class CharacterScene extends Phaser.Scene {
  constructor() {
    super('Chars');
  }

  create(): void {
    drawMenuBg(this, COLORS.oceanDark, 0x33334f, COLORS.accent2);
    const data = load();

    this.add.text(GAME_WIDTH / 2, 44, '캐릭터', { fontFamily: FONT, fontSize: '30px', color: CSS.text, fontStyle: 'bold' }).setOrigin(0.5).setShadow(0, 3, '#00000077', 6);
    goldChip(this, GAME_WIDTH / 2, 78, data.gold);

    const startY = 104;
    const cardH = 182;
    const gap = 8;

    CHARACTERS.forEach((c, i) => {
      const cy = startY + i * (cardH + gap) + cardH / 2;
      const unlocked = isCharUnlocked(c.id);
      const selected = selectedCharId() === c.id;
      const stage = charStage(c.id);
      const pw = GAME_WIDTH - 24;
      const left = GAME_WIDTH / 2 - pw / 2;

      drawPanel(this, GAME_WIDTH / 2, cy, pw, cardH, {
        radius: 20,
        fill: selected ? 0x1a4560 : COLORS.panel,
        border: selected ? COLORS.accent : COLORS.panelBorder,
        glow: selected ? COLORS.accent : undefined,
      });
      const top = cy - cardH / 2;

      if (selected) {
        this.add.text(left + 18, top + 16, '▶ 출전 중', { fontFamily: FONT, fontSize: '12px', color: CSS.green, fontStyle: 'bold' }).setOrigin(0, 0);
      }

      // 초상화 (원형 배지 + 진화 광채)
      const faceX = left + 60;
      const faceY = cy - 6;
      if (unlocked && stage >= 2) {
        this.add.image(faceX, faceY, 'glow').setTint(COLORS.accent).setAlpha(0.4).setDisplaySize(110, 110).setBlendMode(Phaser.BlendModes.ADD);
      }
      const bg = this.add.graphics();
      bg.fillStyle(COLORS.oceanDark, 0.9);
      bg.fillCircle(faceX, faceY, 38);
      bg.lineStyle(2.5, unlocked ? (selected ? COLORS.accent : COLORS.panelBorder) : 0x3a4652, 1);
      bg.strokeCircle(faceX, faceY, 38);
      const face = this.add.image(faceX, faceY, heroTexture(c.id, stage)).setDisplaySize(66, 66);
      if (!unlocked) face.setTintFill(0x24384a);
      else this.tweens.add({ targets: face, y: faceY - 5, duration: 1100 + i * 130, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

      // 텍스트 블록
      const tx = left + 112;
      const stageName = unlocked ? c.stages[stage].name : c.name;
      this.add.text(tx, top + 26, stageName, { fontFamily: FONT, fontSize: '20px', color: CSS.text, fontStyle: 'bold' }).setOrigin(0, 0.5);
      this.add.text(tx, top + 48, c.identity, { fontFamily: FONT, fontSize: '13px', color: CSS.accent }).setOrigin(0, 0.5);
      this.add.text(tx, top + 72, c.desc, { fontFamily: FONT, fontSize: '12px', color: CSS.textDim, wordWrap: { width: pw - 130 } }).setOrigin(0, 0.5);
      this.add.text(tx, top + 96, `진화: ${c.perStageDesc}`, { fontFamily: FONT, fontSize: '12px', color: CSS.textDim }).setOrigin(0, 0.5);

      // 진화 단계 점
      const dots = Array.from({ length: MAX_STAGE + 1 }, (_, k) => (k <= stage && unlocked ? '●' : '○')).join('  ');
      this.add.text(tx, top + 118, `진화  ${dots}`, { fontFamily: FONT, fontSize: '13px', color: unlocked ? CSS.accent : CSS.textDim }).setOrigin(0, 0.5);

      // ---- 버튼 ----
      const btnY = cy + cardH / 2 - 28;
      if (!unlocked) {
        const afford = data.gold >= c.unlockCost;
        makeButton(this, GAME_WIDTH / 2, btnY, `해금  ◈${c.unlockCost}`, () => {
          if (unlockChar(c.id)) { Sfx.click(); this.scene.restart(); }
        }, { width: 210, height: 44, fontSize: 16, disabled: !afford });
      } else {
        makeButton(this, GAME_WIDTH / 2 - 106, btnY, selected ? '출전 중' : '선택', () => {
          selectChar(c.id); this.scene.restart();
        }, { width: 172, height: 44, fontSize: 16, disabled: selected, fill: COLORS.accent });

        const maxed = stage >= MAX_STAGE;
        const cost = maxed ? 0 : c.stages[stage + 1].cost;
        const afford = !maxed && data.gold >= cost;
        makeButton(this, GAME_WIDTH / 2 + 106, btnY, maxed ? '최종 진화' : `진화 ◈${cost}`, () => {
          if (evolveChar(c.id)) { Sfx.levelup(); this.scene.restart(); }
        }, { width: 172, height: 44, fontSize: 16, disabled: maxed || !afford, fill: COLORS.panelBorder, textColor: '#ffffff' });
      }
    });

    makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 42, '← 타이틀', () => this.scene.start('Title'), {
      width: 180, height: 48, fill: COLORS.panelBorder, textColor: '#ffffff', fontSize: 17,
    });
  }
}
