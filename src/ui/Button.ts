// ============================================================
// Button.ts — 메뉴 공용 버튼 헬퍼
// ============================================================
import Phaser from 'phaser';
import { CSS, FONT, COLORS } from '../config';

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
  const bg = scene.add.rectangle(0, 0, w, h, disabled ? 0x2a3a48 : fill, 1).setStrokeStyle(2, 0x000000, 0.15);
  bg.setInteractive({ useHandCursor: !disabled });
  const txt = scene.add
    .text(0, 0, label, {
      fontFamily: FONT,
      fontSize: `${opts.fontSize ?? 20}px`,
      color: disabled ? '#6f8496' : (opts.textColor ?? '#3a2a00'),
      fontStyle: 'bold',
    })
    .setOrigin(0.5);
  c.add([bg, txt]);

  if (!disabled) {
    bg.on('pointerover', () => scene.tweens.add({ targets: c, scale: 1.04, duration: 90 }));
    bg.on('pointerout', () => scene.tweens.add({ targets: c, scale: 1, duration: 90 }));
    bg.on('pointerdown', () => c.setScale(0.97));
    bg.on('pointerup', () => {
      c.setScale(1);
      onClick();
    });
  }
  c.setData('bg', bg);
  c.setData('txt', txt);
  return c;
}
