// ============================================================
// ResultScene.ts — 스테이지 결과 (승리/패배)
// 승리 시: 탈것 진화 연출(③) + 골드 보상. 기획안 6단계.
// ============================================================
import Phaser from 'phaser';
import { CSS, FONT, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { drawGradient } from '../ui/Background';
import { makeButton } from '../ui/Button';
import { ISLANDS } from '../content';
import { currentVehicle, isIslandUnlocked } from '../save';

interface ResultData {
  victory: boolean;
  islandId: number;
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
    drawGradient(this, win ? COLORS.ocean : COLORS.oceanDark, win ? COLORS.sandDark : COLORS.pirate);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    const island = ISLANDS[data.islandId];

    this.add
      .text(GAME_WIDTH / 2, 150, win ? '탈출 성공!' : '조난...', {
        fontFamily: FONT,
        fontSize: '44px',
        color: win ? CSS.accent : CSS.danger,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 200, win ? `${island.name}에서 살아남았다` : `${island.name}에서 쓰러졌다`, {
        fontFamily: FONT,
        fontSize: '16px',
        color: CSS.textDim,
      })
      .setOrigin(0.5);

    // 탈것 진화 연출 (승리 시)
    if (win) {
      const veh = this.add
        .text(GAME_WIDTH / 2, 270, `🚢 ${island.vehicle} 완성 → ${currentVehicle()}`, {
          fontFamily: FONT,
          fontSize: '18px',
          color: CSS.green,
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setScale(0.6)
        .setAlpha(0);
      this.tweens.add({ targets: veh, scale: 1, alpha: 1, duration: 500, ease: 'Back.out', delay: 300 });
    }

    // 통계 패널
    const panel = this.add.rectangle(GAME_WIDTH / 2, 430, GAME_WIDTH - 80, 190, COLORS.panel, 0.9).setStrokeStyle(2, COLORS.panelBorder);
    const rows: [string, string][] = [
      ['처치한 적', `${data.kills}`],
      ['도달 레벨', `Lv.${data.level}`],
      ['생존 시간', this.fmtTime(data.timeMs)],
      ['획득 골드', `◈${data.goldEarned}`],
    ];
    rows.forEach((r, i) => {
      const y = panel.y - 70 + i * 42;
      this.add.text(panel.x - panel.width / 2 + 24, y, r[0], { fontFamily: FONT, fontSize: '16px', color: CSS.textDim }).setOrigin(0, 0.5);
      this.add
        .text(panel.x + panel.width / 2 - 24, y, r[1], { fontFamily: FONT, fontSize: '18px', color: CSS.text, fontStyle: 'bold' })
        .setOrigin(1, 0.5);
    });

    // 버튼
    const nextId = data.islandId + 1;
    const hasNext = win && nextId < ISLANDS.length && isIslandUnlocked(nextId);

    if (hasNext) {
      makeButton(this, GAME_WIDTH / 2, 600, '다음 섬으로 →', () => this.scene.start('Game', { islandId: nextId }), {
        width: 260,
        height: 58,
        fontSize: 20,
      });
    } else {
      makeButton(this, GAME_WIDTH / 2, 600, win ? '다시 도전' : '재도전', () => this.scene.start('Game', { islandId: data.islandId }), {
        width: 260,
        height: 58,
        fontSize: 20,
      });
    }

    makeButton(this, GAME_WIDTH / 2 - 90, 680, '지도', () => this.scene.start('Map'), {
      width: 150,
      height: 50,
      fill: COLORS.panelBorder,
      textColor: '#ffffff',
      fontSize: 17,
    });
    makeButton(this, GAME_WIDTH / 2 + 90, 680, '타이틀', () => this.scene.start('Title'), {
      width: 150,
      height: 50,
      fill: COLORS.panelBorder,
      textColor: '#ffffff',
      fontSize: 17,
    });
  }

  private fmtTime(ms: number): string {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}분 ${s % 60}초`;
  }
}
