// ============================================================
// Button.ts — 공용 버튼 ("캔디/스티커" 광택 알약 버튼)
//  입체 그림자 + 아랫면 립 + 광택 하이라이트로 3D 느낌.
//  ⚠ 히트영역은 정확한 크기의 투명 Zone. (그림은 Graphics 로 직접 그림)
//  ⚠ getData('bg'|'hit'|'txt') 인터페이스는 기존 호출부 호환 위해 유지.
// ============================================================
import Phaser from 'phaser';
import { FONT, COLORS, CSS } from '../config';
import { Sfx } from '../systems/Sfx';

export interface ButtonOpts {
  width?: number;
  height?: number;
  fill?: number;
  textColor?: string;
  fontSize?: number;
  disabled?: boolean;
  icon?: string; // 왼쪽 아이콘 텍스처 키 (선택)
}

// 색을 어둡게/밝게 (립·하이라이트 자동 생성용)
function shade(color: number, f: number): number {
  const c = Phaser.Display.Color.IntegerToColor(color);
  const cl = (v: number) => Phaser.Math.Clamp(Math.round(v), 0, 255);
  return Phaser.Display.Color.GetColor(cl(c.red * f), cl(c.green * f), cl(c.blue * f));
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
  const disabled = opts.disabled ?? false;
  const fill = disabled ? 0x2c4152 : (opts.fill ?? COLORS.accent);
  const r = h / 2; // 완전한 알약 형태
  const edge = shade(fill, 0.68); // 아랫면 립(입체)
  const lip = 5;

  const c = scene.add.container(x, y);

  // 입체 그림자
  const shadow = scene.add.graphics();
  shadow.fillStyle(COLORS.shadow, 0.32);
  shadow.fillRoundedRect(-w / 2, -h / 2 + 7, w, h, r);

  // 본체 (아랫면 립 → 윗면)
  const bg = scene.add.graphics();
  const paint = (pressed = false) => {
    bg.clear();
    const off = pressed ? lip : 0; // 눌리면 윗면이 립 위치로 내려감
    // 아랫면(어두운 립)
    bg.fillStyle(edge, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    // 윗면
    bg.fillStyle(fill, 1);
    bg.fillRoundedRect(-w / 2, -h / 2 + off, w, h - lip, r);
    // 광택 하이라이트(윗면 상단 절반)
    if (!disabled) {
      bg.fillStyle(0xffffff, 0.22);
      bg.fillRoundedRect(-w / 2 + 6, -h / 2 + off + 5, w - 12, (h - lip) * 0.42, r * 0.7);
    }
  };
  paint(false);

  const txtColor = disabled ? '#6f8496' : (opts.textColor ?? CSS.ink);
  const iconOffset = opts.icon ? 14 : 0;
  const txt = scene.add
    .text(iconOffset, -1, label, {
      fontFamily: FONT,
      fontSize: `${opts.fontSize ?? 20}px`,
      color: txtColor,
      fontStyle: 'bold',
    })
    .setOrigin(0.5);

  const children: Phaser.GameObjects.GameObject[] = [shadow, bg];
  if (opts.icon) {
    children.push(scene.add.image(-txt.width / 2 - 4, -1, opts.icon).setDisplaySize(26, 26));
  }
  children.push(txt);

  const hit = scene.add.zone(0, 0, w, h);
  children.push(hit);
  c.add(children);

  if (!disabled) {
    hit.setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => scene.tweens.add({ targets: c, scale: 1.035, duration: 90, ease: 'Sine.out' }));
    hit.on('pointerout', () => {
      scene.tweens.add({ targets: c, scale: 1, duration: 90 });
      paint(false);
      txt.y = -1;
    });
    hit.on('pointerdown', () => {
      paint(true);
      txt.y = -1 + lip; // 글자도 같이 눌림
    });
    hit.on('pointerup', () => {
      paint(false);
      txt.y = -1;
      Sfx.click();
      onClick();
    });
  }

  c.setData('bg', bg);
  c.setData('hit', hit);
  c.setData('txt', txt);
  return c;
}
