// ============================================================
// CharacterScene.ts — 캐릭터 선택 + 영구 진화 (골드 사용)
// 캐릭터마다 시작무기/성향이 달라 빌드 정체성이 생기고,
// 진화(3단계)하면 스탯과 외형(금장식 → 왕관+오라)이 영구 강화됩니다.
// ============================================================
import Phaser from 'phaser';
import { CSS, FONT, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { drawGradient } from '../ui/Background';
import { makeButton } from '../ui/Button';
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
    drawGradient(this, COLORS.panel, COLORS.oceanDark);
    const data = load();

    this.add
      .text(GAME_WIDTH / 2, 46, '캐릭터', { fontFamily: FONT, fontSize: '32px', color: CSS.text, fontStyle: 'bold' })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 82, `보유 골드  ◈${data.gold}`, { fontFamily: FONT, fontSize: '16px', color: CSS.accent })
      .setOrigin(0.5);

    const startY = 112;
    const cardH = 178;
    const gap = 10;

    CHARACTERS.forEach((c, i) => {
      const y = startY + i * (cardH + gap);
      const cy = y + cardH / 2;
      const unlocked = isCharUnlocked(c.id);
      const selected = selectedCharId() === c.id;
      const stage = charStage(c.id);

      // 카드 배경 (선택 중이면 테두리 강조)
      const bg = this.add
        .nineslice(GAME_WIDTH / 2, cy, 'panel', undefined, GAME_WIDTH - 28, cardH, 18, 18, 18, 18)
        .setTint(selected ? 0x16506e : COLORS.panel);
      if (selected) {
        this.add
          .text(GAME_WIDTH / 2 - bg.width / 2 + 16, y + 10, '▶ 출전 중', { fontFamily: FONT, fontSize: '12px', color: CSS.green, fontStyle: 'bold' })
          .setOrigin(0, 0);
      }

      // 초상화 (진화 단계별 외형). 미해금은 실루엣.
      const face = this.add.image(62, cy - 8, heroTexture(c.id, stage)).setDisplaySize(74, 74);
      if (!unlocked) face.setTintFill(0x1c3648);
      this.tweens.add({ targets: face, y: face.y - 5, duration: 1100 + i * 130, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

      // 이름 + 현재 칭호
      const stageName = c.stages[stage].name;
      this.add
        .text(112, y + 26, unlocked ? stageName : c.name, { fontFamily: FONT, fontSize: '20px', color: CSS.text, fontStyle: 'bold' })
        .setOrigin(0, 0.5);
      this.add
        .text(112, y + 48, c.identity, { fontFamily: FONT, fontSize: '13px', color: CSS.accent })
        .setOrigin(0, 0.5);

      // 특성 설명
      this.add
        .text(112, y + 72, c.desc, { fontFamily: FONT, fontSize: '12px', color: CSS.textDim, wordWrap: { width: GAME_WIDTH - 150 } })
        .setOrigin(0, 0.5);
      this.add
        .text(112, y + 94, `진화: ${c.perStageDesc}`, { fontFamily: FONT, fontSize: '12px', color: CSS.textDim })
        .setOrigin(0, 0.5);

      // 진화 단계 점
      const dots = Array.from({ length: MAX_STAGE + 1 }, (_, k) => (k <= stage && unlocked ? '●' : '○')).join(' ');
      this.add
        .text(112, y + 116, `진화 단계  ${dots}`, { fontFamily: FONT, fontSize: '13px', color: CSS.accent })
        .setOrigin(0, 0.5);

      // ---- 버튼들 (하단 줄) ----
      const btnY = y + cardH - 30;
      if (!unlocked) {
        const afford = data.gold >= c.unlockCost;
        makeButton(
          this,
          GAME_WIDTH / 2,
          btnY,
          `해금  ◈${c.unlockCost}`,
          () => {
            if (unlockChar(c.id)) {
              Sfx.click();
              this.scene.restart();
            }
          },
          { width: 200, height: 44, fontSize: 16, disabled: !afford }
        );
      } else {
        // 선택 버튼
        makeButton(
          this,
          GAME_WIDTH / 2 - 105,
          btnY,
          selected ? '출전 중' : '선택',
          () => {
            selectChar(c.id);
            this.scene.restart();
          },
          { width: 170, height: 44, fontSize: 16, disabled: selected, fill: COLORS.accent }
        );
        // 진화 버튼
        const maxed = stage >= MAX_STAGE;
        const cost = maxed ? 0 : c.stages[stage + 1].cost;
        const afford = !maxed && data.gold >= cost;
        makeButton(
          this,
          GAME_WIDTH / 2 + 105,
          btnY,
          maxed ? '최종 진화' : `진화  ◈${cost}`,
          () => {
            if (evolveChar(c.id)) {
              Sfx.levelup();
              this.scene.restart();
            }
          },
          { width: 170, height: 44, fontSize: 16, disabled: maxed || !afford, fill: COLORS.panelBorder, textColor: '#ffffff' }
        );
      }
    });

    makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 46, '← 타이틀', () => this.scene.start('Title'), {
      width: 180,
      height: 48,
      fill: COLORS.panelBorder,
      textColor: '#ffffff',
      fontSize: 17,
    });
  }
}
