// ============================================================
// Button.ts — 메뉴 공용 버튼 (둥근 패널 + Zone 히트영역)
// ⚠ NineSlice 는 기본 히트영역이 원본 텍스처(작음)라 입력이 안 먹음 →
//   보이는 건 nineslice, 입력은 정확한 크기의 투명 Zone 으로 처리.
// ============================================================
import Phaser from 'phaser';
import { FONT, COLORS } from '../config';
import { Sfx } from '../systems/Sfx';

export interface ButtonOpts {
  width?: number;
  height?: number;
  fill?: number;
  textColor?: string;
  fontSize?: number;
  disabled?: boolean;
}

export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  opts: ButtonOpts = {}
): Phaser.GameObjects.Container {
  const w = opts.width ?? 240;
  const h = opts.height ?? 58;
  const fill = opts.fill ?? COLORS.accent;
  const disabled = opts.disabled ?? false;

  const c = scene.add.container(x, y);
  const shadow = scene.add.nineslice(0, 4, 'panel', undefined, w, h, 16, 16, 16, 16).setTint(0x000000).setAlpha(0.22);
  const bg = scene.add.nineslice(0, 0, 'panel', undefined, w, h, 16, 16, 16, 16).setTint(disabled ? 0x2a3a48 : fill);
  const txt = scene.add
    .text(0, 0, label, {
      fontFamily: FONT,
      fontSize: `${opts.fontSize ?? 20}px`,
      color: disabled ? '#6f8496' : (opts.textColor ?? '#3a2a00'),
      fontStyle: 'bold',
    })
    .setOrigin(0.5);
  const hit = scene.add.zone(0, 0, w, h);
  c.add([shadow, bg, txt, hit]);

  if (!disabled) {
    hit.setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => scene.tweens.add({ targets: c, scale: 1.04, duration: 90 }));
    hit.on('pointerout', () => scene.tweens.add({ targets: c, scale: 1, duration: 90 }));
    hit.on('pointerdown', () => c.setScale(0.97));
    hit.on('pointerup', () => {
      c.setScale(1);
      Sfx.click();
      onClick();
    });
  }
  c.setData('bg', bg);
  c.setData('hit', hit);
  c.setData('txt', txt);
  return c;
}
