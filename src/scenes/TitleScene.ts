// ============================================================
// TitleScene.ts — 타이틀 화면
// ============================================================
import Phaser from 'phaser';
import { CSS, FONT, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { drawGradient } from '../ui/Background';
import { makeButton } from '../ui/Button';
import { load, currentVehicle } from '../save';
import { Sfx } from '../systems/Sfx';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    drawGradient(this, COLORS.ocean, COLORS.sandDark);

    // 떠다니는 뗏목 느낌의 장식 원
    for (let i = 0; i < 6; i++) {
      const c = this.add.circle(
        Phaser.Math.Between(30, GAME_WIDTH - 30),
        Phaser.Math.Between(GAME_HEIGHT - 260, GAME_HEIGHT - 40),
        Phaser.Math.Between(6, 16),
        0xffffff,
        0.08
      );
      this.tweens.add({ targets: c, y: c.y - 20, duration: Phaser.Math.Between(2000, 4000), yoyo: true, repeat: -1 });
    }

    this.add
      .text(GAME_WIDTH / 2, 210, '표류 서바이버', { fontFamily: FONT, fontSize: '46px', color: CSS.text, fontStyle: 'bold' })
      .setOrigin(0.5)
      .setShadow(0, 4, '#00000066', 6);
    this.add
      .text(GAME_WIDTH / 2, 258, 'Castaway Survivors', { fontFamily: FONT, fontSize: '18px', color: CSS.accent })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 300, '무인도에서 살아남아 탈출하라', { fontFamily: FONT, fontSize: '15px', color: CSS.textDim })
      .setOrigin(0.5);

    // 주인공 미리보기
    const hero = this.add.image(GAME_WIDTH / 2, 400, 'player').setDisplaySize(80, 80);
    this.tweens.add({ targets: hero, y: 384, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    makeButton(this, GAME_WIDTH / 2, 560, '여정 시작', () => this.scene.start('Map'), { width: 260, height: 62, fontSize: 22 });
    makeButton(this, GAME_WIDTH / 2, 636, '상점 (영구 성장)', () => this.scene.start('Shop'), {
      width: 260,
      height: 54,
      fill: COLORS.panelBorder,
      textColor: '#ffffff',
      fontSize: 18,
    });

    const save = load();
    this.add
      .text(GAME_WIDTH / 2, 720, `보유 골드  ◈${save.gold}    ·    현재 탈것: ${currentVehicle()}`, {
        fontFamily: FONT,
        fontSize: '15px',
        color: CSS.accent,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'v0.2 · 이동만 조작, 공격은 자동 · 화면을 누르면 소리 켜짐', {
        fontFamily: FONT,
        fontSize: '12px',
        color: CSS.textDim,
      })
      .setOrigin(0.5);

    // 음소거 토글 (우상단)
    const mi = this.add
      .text(GAME_WIDTH - 24, 28, Sfx.muted ? '♪ 꺼짐' : '♪ 켜짐', {
        fontFamily: FONT,
        fontSize: '14px',
        color: Sfx.muted ? '#6f8496' : CSS.accent,
        fontStyle: 'bold',
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    mi.on('pointerup', () => {
      const m = Sfx.toggleMute();
      mi.setText(m ? '♪ 꺼짐' : '♪ 켜짐').setColor(m ? '#6f8496' : CSS.accent);
    });
  }
}
