// ============================================================
// Panel.ts — 공용 카드/패널 (둥근 모서리 + 그림자 + 상단 림 하이라이트)
// 상점·결과·캐릭터 등 모든 정보 카드를 이걸로 통일.
// 반환: 그래픽 컨테이너가 아니라 Graphics 하나(원하는 depth 지정 가능).
// ============================================================
import Phaser from 'phaser';
import { COLORS, CSS, FONT } from '../config';

export interface PanelOpts {
  radius?: number;
  fill?: number;
  alpha?: number;
  border?: number; // 테두리 색 (없으면 panelBorder)
  glow?: number; // 지정 시 은은한 외곽 광채 색
  shadow?: boolean; // 아래 그림자 (기본 true)
}

// (x, y)는 패널 중심. 반환된 Graphics 를 씬이 depth 조절 가능.
export function drawPanel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, opts: PanelOpts = {}): Phaser.GameObjects.Graphics {
  const radius = opts.radius ?? 20;
  const fill = opts.fill ?? COLORS.panel;
  const alpha = opts.alpha ?? 0.94;
  const border = opts.border ?? COLORS.panelBorder;
  const g = scene.add.graphics();
  const left = x - w / 2;
  const top = y - h / 2;

  // 외곽 광채 (선택)
  if (opts.glow !== undefined) {
    scene.add
      .image(x, y, 'glow')
      .setTint(opts.glow)
      .setAlpha(0.35)
      .setDisplaySize(w + 60, h + 60)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth((g.depth ?? 0) - 1);
  }

  // 그림자
  if (opts.shadow !== false) {
    g.fillStyle(COLORS.shadow, 0.3);
    g.fillRoundedRect(left, top + 6, w, h, radius);
  }

  // 본체
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(left, top, w, h, radius);

  // 상단 림 하이라이트 (윗변만 살짝 밝게)
  g.fillStyle(COLORS.panelHi, 0.5);
  g.fillRoundedRect(left + radius * 0.5, top + 2, w - radius, 3, 2);

  // 테두리
  g.lineStyle(1.5, border, 0.8);
  g.strokeRoundedRect(left, top, w, h, radius);

  return g;
}

// 골드 표시용 알약 칩 (◈ 아이콘 + 숫자). 중심 (x,y).
export function goldChip(scene: Phaser.Scene, x: number, y: number, amount: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const label = `◈ ${amount}`;
  const txt = scene.add.text(10, 0, label, { fontFamily: FONT, fontSize: '16px', color: CSS.accent, fontStyle: 'bold' }).setOrigin(0, 0.5);
  const w = txt.width + 32;
  const h = 30;
  const g = scene.add.graphics();
  g.fillStyle(COLORS.shadow, 0.28);
  g.fillRoundedRect(-w / 2, -h / 2 + 3, w, h, h / 2);
  g.fillStyle(0x0e2333, 0.9);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  g.lineStyle(1.5, COLORS.accent, 0.55);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  txt.setX(-w / 2 + 16);
  c.add([g, txt]);
  return c;
}
