// ============================================================
// TapZones.ts — 화면 고정 UI 버튼용 탭 판정 매니저
// ⚠ GameScene 은 카메라가 스크롤되므로 게임오브젝트 setInteractive 의
//   히트영역이 어긋나 클릭이 안 먹음(레벨업 카드와 동일 버그).
//   해결: 조이스틱과 같은 씬 레벨 pointerdown 좌표로 직접 판정.
// 사용: add(cx, cy, w, h, 콜백, 활성조건) — 조건이 false면 무시.
// ============================================================
import Phaser from 'phaser';

interface Zone {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cb: () => void;
  when?: () => boolean;
}

export default class TapZones {
  private scene: Phaser.Scene;
  private zones: Zone[] = [];
  private handler: (p: Phaser.Input.Pointer) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.handler = (p) => {
      for (const z of this.zones) {
        if (z.when && !z.when()) continue;
        if (p.x >= z.x1 && p.x <= z.x2 && p.y >= z.y1 && p.y <= z.y2) {
          z.cb();
          return;
        }
      }
    };
    scene.input.on('pointerdown', this.handler);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  // 중심좌표 + 크기로 등록 (버튼과 같은 기준)
  add(cx: number, cy: number, w: number, h: number, cb: () => void, when?: () => boolean): void {
    this.zones.push({ x1: cx - w / 2, y1: cy - h / 2, x2: cx + w / 2, y2: cy + h / 2, cb, when });
  }

  // 현재 활성 존 위에 있는 좌표인지 (조이스틱이 버튼 위 탭을 무시하게)
  hitAt(x: number, y: number): boolean {
    for (const z of this.zones) {
      if (z.when && !z.when()) continue;
      if (x >= z.x1 && x <= z.x2 && y >= z.y1 && y <= z.y2) return true;
    }
    return false;
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.handler);
    this.zones = [];
  }
}
