// ============================================================
// ResultScene.ts — 판(Run) 결과 (승리/패배)
// 승리 시: 탈것 진화 연출 + 골드. 다음 판/섬으로 이어가기.
// ============================================================
import Phaser from 'phaser';
import { CSS, FONT, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { drawMenuBg } from '../ui/Background';
import { makeButton } from '../ui/Button';
import { drawPanel } from '../ui/Panel';
import { ISLAND_THEMES, RUNS_PER_ISLAND } from '../content';
import { currentVehicle, isIslandUnlocked, isRunUnlocked } from '../save';

interface ResultData {
  victory: boolean;
  island: number;
  run: number;
  runName: string;
  kills: number;
  timeMs: number;
  goldEarned: number;
  level: number;
}

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  create(data: ResultData): void {
    const win = data.victory;
    drawMenuBg(this, win ? COLORS.ocean : COLORS.oceanDark, win ? 0x6a4a52 : 0x3a2b4d, win ? COLORS.accent : COLORS.accent2);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // 결과 엠블럼 (승/패)
    const emY = 138;
    this.add.image(GAME_WIDTH / 2, emY, 'glow').setTint(win ? COLORS.accent : COLORS.danger).setAlpha(0.35).setDisplaySize(300, 300).setBlendMode(Phaser.BlendModes.ADD);
    this.add.text(GAME_WIDTH / 2, emY - 8, win ? '🏆' : '💀', { fontFamily: FONT, fontSize: '58px' }).setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, emY + 68, win ? '판 클리어!' : '조난...', { fontFamily: FONT, fontSize: '42px', color: win ? CSS.accent : CSS.danger, fontStyle: 'bold' })
      .setOrigin(0.5).setShadow(0, 3, '#00000088', 6);
    this.add
      .text(GAME_WIDTH / 2, emY + 108, win ? `${data.runName} 돌파!` : `${data.runName}에서 쓰러졌다`, { fontFamily: FONT, fontSize: '15px', color: CSS.textDim })
      .setOrigin(0.5);

    if (win) {
      const veh = this.add
        .text(GAME_WIDTH / 2, emY + 138, `🚢 현재 탈것: ${currentVehicle()}`, { fontFamily: FONT, fontSize: '16px', color: CSS.green, fontStyle: 'bold' })
        .setOrigin(0.5)
        .setScale(0.6)
        .setAlpha(0);
      this.tweens.add({ targets: veh, scale: 1, alpha: 1, duration: 500, ease: 'Back.out', delay: 300 });
    }

    // 통계 패널
    const panelY = 448;
    const panelW = GAME_WIDTH - 72;
    drawPanel(this, GAME_WIDTH / 2, panelY, panelW, 194, { radius: 22 });
    const rows: [string, string, string][] = [
      ['⚔️', '처치한 적', `${data.kills}`],
      ['⭐', '도달 레벨', `Lv.${data.level}`],
      ['⏱️', '생존 시간', this.fmtTime(data.timeMs)],
      ['◈', '획득 골드', `${data.goldEarned}`],
    ];
    rows.forEach((r, i) => {
      const y = panelY - 72 + i * 46;
      this.add.text(GAME_WIDTH / 2 - panelW / 2 + 24, y, `${r[0]}  ${r[1]}`, { fontFamily: FONT, fontSize: '16px', color: CSS.textDim }).setOrigin(0, 0.5);
      this.add.text(GAME_WIDTH / 2 + panelW / 2 - 24, y, r[2], { fontFamily: FONT, fontSize: '19px', color: i === 3 ? CSS.accent : CSS.text, fontStyle: 'bold' }).setOrigin(1, 0.5);
      if (i < 3) {
        const g = this.add.graphics();
        g.lineStyle(1, COLORS.panelBorder, 0.35);
        g.lineBetween(GAME_WIDTH / 2 - panelW / 2 + 20, y + 23, GAME_WIDTH / 2 + panelW / 2 - 20, y + 23);
      }
    });

    // 진행 버튼
    const nextRun = data.run + 1;
    const hasNextRun = win && nextRun < RUNS_PER_ISLAND && isRunUnlocked(data.island, nextRun);
    const nextIsland = data.island + 1;
    const hasNextIsland = win && nextRun >= RUNS_PER_ISLAND && nextIsland < ISLAND_THEMES.length && isIslandUnlocked(nextIsland);

    if (hasNextRun) {
      makeButton(this, GAME_WIDTH / 2, 590, '다음 판 →', () => this.scene.start('Game', { island: data.island, run: nextRun }), { width: 260, height: 58, fontSize: 20 });
    } else if (hasNextIsland) {
      makeButton(this, GAME_WIDTH / 2, 590, '다음 섬으로 →', () => this.scene.start('Runs', { island: nextIsland }), { width: 260, height: 58, fontSize: 20 });
    } else {
      makeButton(this, GAME_WIDTH / 2, 590, win ? '다시 도전' : '재도전', () => this.scene.start('Game', { island: data.island, run: data.run }), { width: 260, height: 58, fontSize: 20 });
    }

    makeButton(this, GAME_WIDTH / 2 - 90, 668, '판 선택', () => this.scene.start('Runs', { island: data.island }), { width: 150, height: 50, fill: COLORS.panelBorder, textColor: '#ffffff', fontSize: 16 });
    makeButton(this, GAME_WIDTH / 2 + 90, 668, '타이틀', () => this.scene.start('Title'), { width: 150, height: 50, fill: COLORS.panelBorder, textColor: '#ffffff', fontSize: 16 });
  }

  private fmtTime(ms: number): string {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}분 ${s % 60}초`;
  }
}
