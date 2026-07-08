// ============================================================
// Hud.ts — 인게임 상단 정보바 (체력/경험치/레벨/스테이지/시간/골드)
// 둥근 패널로 깔끔하게.
// ============================================================
import Phaser from 'phaser';
import { CSS, FONT, GAME_WIDTH, COLORS } from '../config';

export default class Hud {
  private hpBar: Phaser.GameObjects.Rectangle;
  private hpText: Phaser.GameObjects.Text;
  private xpBar: Phaser.GameObjects.Rectangle;
  private lvText: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;
  private timeText: Phaser.GameObjects.Text;
  private killText: Phaser.GameObjects.Text;
  private readonly hpW = GAME_WIDTH - 150;
  private readonly xpW = GAME_WIDTH - 28;

  constructor(scene: Phaser.Scene) {
    const d = 100;
    const panel = (x: number, y: number, w: number, h: number, tint: number, alpha = 1, corner = 10) =>
      scene.add.nineslice(x, y, 'panel', undefined, w, h, corner, corner, corner, corner).setOrigin(0, 0).setTint(tint).setAlpha(alpha).setScrollFactor(0);

    // 상단 배경 패널
    panel(6, 8, GAME_WIDTH - 12, 80, 0x06121c, 0.5, 14).setDepth(d - 1);

    // 체력바
    panel(14, 16, this.hpW, 20, COLORS.hpBack, 1, 9).setDepth(d);
    this.hpBar = scene.add.rectangle(16, 18, this.hpW - 4, 16, COLORS.hp).setOrigin(0, 0).setScrollFactor(0).setDepth(d + 1);
    this.hpText = scene.add.text(14 + this.hpW / 2, 26, '', { fontFamily: FONT, fontSize: '13px', color: CSS.text, fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2);

    // 골드/처치 (우상단)
    this.killText = scene.add.text(GAME_WIDTH - 16, 26, '', { fontFamily: FONT, fontSize: '14px', color: CSS.accent, fontStyle: 'bold' }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(d + 2);

    // 경험치바
    panel(14, 44, this.xpW, 12, 0x10202c, 1, 6).setDepth(d);
    this.xpBar = scene.add.rectangle(16, 46, 0, 8, COLORS.xpBar).setOrigin(0, 0).setScrollFactor(0).setDepth(d + 1);
    this.lvText = scene.add.text(16, 62, 'Lv.1', { fontFamily: FONT, fontSize: '14px', color: CSS.text, fontStyle: 'bold' }).setOrigin(0, 0).setScrollFactor(0).setDepth(d + 2);

    // 스테이지 / 시간
    this.waveText = scene.add.text(GAME_WIDTH / 2, 68, '', { fontFamily: FONT, fontSize: '15px', color: CSS.accent, fontStyle: 'bold' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(d + 2);
    this.timeText = scene.add.text(GAME_WIDTH - 16, 68, '', { fontFamily: FONT, fontSize: '14px', color: CSS.textDim }).setOrigin(1, 0).setScrollFactor(0).setDepth(d + 2);
  }

  update(opts: { hp: number; maxHp: number; xp: number; xpNeed: number; level: number; wave: string; timeMs: number; kills: number; gold: number }): void {
    const hpRatio = Phaser.Math.Clamp(opts.hp / opts.maxHp, 0, 1);
    this.hpBar.width = (this.hpW - 4) * hpRatio;
    this.hpBar.fillColor = hpRatio > 0.3 ? COLORS.hp : COLORS.danger;
    this.hpText.setText(`${Math.ceil(opts.hp)} / ${opts.maxHp}`);

    this.xpBar.width = (this.xpW - 4) * Phaser.Math.Clamp(opts.xp / opts.xpNeed, 0, 1);
    this.lvText.setText(`Lv.${opts.level}`);

    this.waveText.setText(opts.wave);
    const sec = Math.floor(opts.timeMs / 1000);
    this.timeText.setText(`${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`);
    this.killText.setText(`처치 ${opts.kills}  ·  ◈${opts.gold}`);
  }
}
