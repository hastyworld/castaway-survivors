// ============================================================
// TitleScene.ts — 타이틀 화면 ("석양의 무인도" 룩)
// ============================================================
import Phaser from 'phaser';
import { CSS, FONT, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { drawMenuBg } from '../ui/Background';
import { makeButton } from '../ui/Button';
import { goldChip } from '../ui/Panel';
import { load, currentVehicle } from '../save';
import { heroTexture, selectedCharId, getChar, charStage } from '../characters';
import { Sfx } from '../systems/Sfx';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    drawMenuBg(this, COLORS.oceanDark, 0x6a4a52, COLORS.accent2);
    const save = load();

    // ---- 타이틀 로고 ----
    const title = this.add
      .text(GAME_WIDTH / 2, 168, '표류 서바이버', { fontFamily: FONT, fontSize: '50px', color: CSS.text, fontStyle: 'bold' })
      .setOrigin(0.5)
      .setShadow(0, 5, '#00000088', 10);
    // 골드 밑줄 강조
    this.add.rectangle(GAME_WIDTH / 2, 202, 150, 4, COLORS.accent).setOrigin(0.5).setAlpha(0.9);
    this.add
      .text(GAME_WIDTH / 2, 226, 'CASTAWAY  SURVIVORS', { fontFamily: FONT, fontSize: '15px', color: CSS.accent, fontStyle: 'bold' })
      .setOrigin(0.5)
      .setLetterSpacing?.(4);
    this.add
      .text(GAME_WIDTH / 2, 256, '무인도에서 살아남아 탈출하라', { fontFamily: FONT, fontSize: '14px', color: CSS.textDim })
      .setOrigin(0.5);
    this.tweens.add({ targets: title, y: 164, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // ---- 주인공 스탠드 ----
    const px = GAME_WIDTH / 2;
    const py = 388;
    // 발판 그림자 + 광채
    this.add.image(px, py + 44, 'glow').setTint(COLORS.accent).setAlpha(0.3).setDisplaySize(180, 90).setBlendMode(Phaser.BlendModes.ADD);
    this.add.ellipse(px, py + 44, 120, 26, 0x000000, 0.25);
    const hero = this.add.image(px, py, heroTexture()).setDisplaySize(96, 96);
    this.tweens.add({ targets: hero, y: py - 12, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const cid = selectedCharId();
    this.add
      .text(px, py + 74, getChar(cid).stages[charStage(cid)].name, { fontFamily: FONT, fontSize: '16px', color: CSS.accent, fontStyle: 'bold' })
      .setOrigin(0.5);

    // ---- 메인 버튼 ----
    makeButton(this, px, 552, '여정 시작', () => this.scene.start('Map'), { width: 268, height: 66, fontSize: 24 });
    makeButton(this, px - 68, 636, '캐릭터', () => this.scene.start('Chars'), {
      width: 128, height: 54, fill: COLORS.panelBorder, textColor: '#ffffff', fontSize: 17,
    });
    makeButton(this, px + 68, 636, '상점', () => this.scene.start('Shop'), {
      width: 128, height: 54, fill: COLORS.panelBorder, textColor: '#ffffff', fontSize: 17,
    });

    // ---- 하단 정보 ----
    goldChip(this, px - 66, 714, save.gold);
    this.add.text(px + 66, 714, `🚢 ${currentVehicle()}`, { fontFamily: FONT, fontSize: '15px', color: CSS.textDim }).setOrigin(0.5, 0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 26, 'v1.1 · 이동만 조작, 공격은 자동 · 화면을 누르면 소리 켜짐', {
        fontFamily: FONT, fontSize: '12px', color: CSS.textDim,
      })
      .setOrigin(0.5)
      .setAlpha(0.7);

    // ---- 음소거 토글 (우상단) ----
    this.makeMuteToggle();
  }

  private makeMuteToggle(): void {
    const x = GAME_WIDTH - 34;
    const y = 34;
    const g = this.add.graphics();
    g.fillStyle(0x0e2333, 0.85);
    g.fillCircle(0, 0, 20);
    g.lineStyle(1.5, COLORS.panelBorder, 0.7);
    g.strokeCircle(0, 0, 20);
    g.setPosition(x, y);
    const mi = this.add
      .text(x, y - 1, Sfx.muted ? '🔇' : '🔊', { fontFamily: FONT, fontSize: '18px' })
      .setOrigin(0.5);
    const zone = this.add.zone(x, y, 44, 44).setInteractive({ useHandCursor: true });
    zone.on('pointerup', () => {
      const m = Sfx.toggleMute();
      mi.setText(m ? '🔇' : '🔊');
    });
  }
}
