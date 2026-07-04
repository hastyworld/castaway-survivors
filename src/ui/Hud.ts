// ============================================================
// Hud.ts — 인게임 상단 정보바 (체력/경험치/레벨/웨이브/시간/골드)
// ============================================================
import Phaser from 'phaser';
import { CSS, FONT, GAME_WIDTH, COLORS } from '../config';

export default class Hud {
  private scene: Phaser.Scene;
  private hpBar: Phaser.GameObjects.Rectangle;
  private hpText: Phaser.GameObjects.Text;
  private xpBar: Phaser.GameObjects.Rectangle;
  private lvText: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;
  private timeText: Phaser.GameObjects.Text;
  private killText: Phaser.GameObjects.Text;
  private readonly hpW = GAME_WIDTH - 150;
  private readonly xpW = GAME_WIDTH - 24;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const d = 100;

    // 체력바
    scene.add.rectangle(12, 14, this.hpW, 20, COLORS.hpBack).setOrigin(0, 0).setScrollFactor(0).setDepth(d);
    this.hpBar = scene.add.rectangle(12, 14, this.hpW, 20, COLORS.hp).setOrigin(0, 0).setScrollFactor(0).setDepth(d + 1);
    this.hpText = scene.add
      .text(12 + this.hpW / 2, 24, '', { fontFamily: FONT, fontSize: '13px', color: CSS.text })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(d + 2);

    // 골드 (우상단)
    this.killText = scene.add
      .text(GAME_WIDTH - 12, 24, '', { fontFamily: FONT, fontSize: '14px', color: CSS.accent })
      .setOrigin(1, 0.5)
      .setScrollFactor(0)
      .setDepth(d + 2);

    // 경험치바
    scene.add.rectangle(12, 44, this.xpW, 10, 0x10202c).setOrigin(0, 0).setScrollFactor(0).setDepth(d);
    this.xpBar = scene.add.rectangle(12, 44, 0, 10, COLORS.xpBar).setOrigin(0, 0).setScrollFactor(0).setDepth(d + 1);
    this.lvText = scene.add
      .text(12, 60, 'Lv.1', { fontFamily: FONT, fontSize: '14px', color: CSS.text, fontStyle: 'bold' })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(d + 2);

    // 웨이브 / 시간
    this.waveText = scene.add
      .text(GAME_WIDTH / 2, 66, '', { fontFamily: FONT, fontSize: '15px', color: CSS.accent, fontStyle: 'bold' })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(d + 2);
    this.timeText = scene.add
      .text(GAME_WIDTH - 12, 66, '', { fontFamily: FONT, fontSize: '14px', color: CSS.textDim })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(d + 2);
  }

  update(opts: {
    hp: number;
    maxHp: number;
    xp: number;
    xpNeed: number;
    level: number;
    wave: string;
    timeMs: number;
    kills: number;
    gold: number;
  }): void {
    const hpRatio = Phaser.Math.Clamp(opts.hp / opts.maxHp, 0, 1);
    this.hpBar.width = this.hpW * hpRatio;
    this.hpBar.fillColor = hpRatio > 0.3 ? COLORS.hp : COLORS.danger;
    this.hpText.setText(`${Math.ceil(opts.hp)} / ${opts.maxHp}`);

    this.xpBar.width = this.xpW * Phaser.Math.Clamp(opts.xp / opts.xpNeed, 0, 1);
    this.lvText.setText(`Lv.${opts.level}`);

    this.waveText.setText(opts.wave);
    const sec = Math.floor(opts.timeMs / 1000);
    this.timeText.setText(`${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`);
    this.killText.setText(`처치 ${opts.kills}  ·  ◈${opts.gold}`);
  }
}
