// ============================================================
// main.ts — Phaser 게임 부팅 (진입점)
// ============================================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config';
import BootScene from './scenes/BootScene';
import TitleScene from './scenes/TitleScene';
import ShopScene from './scenes/ShopScene';
import CharacterScene from './scenes/CharacterScene';
import MapScene from './scenes/MapScene';
import RunSelectScene from './scenes/RunSelectScene';
import GameScene from './scenes/GameScene';
import ResultScene from './scenes/ResultScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.oceanDark,
  scale: {
    mode: Phaser.Scale.FIT, // 화면에 맞춰 비율 유지하며 확대/축소
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  render: { antialias: true, roundPixels: false },
  scene: [BootScene, TitleScene, CharacterScene, ShopScene, MapScene, RunSelectScene, GameScene, ResultScene],
};

// HMR(코드 저장 시 자동 새로고침) 대비: 기존 게임 인스턴스가 있으면 정리
const w = window as unknown as { __game?: Phaser.Game; __errs?: string[] };
if (w.__game) {
  w.__game.destroy(true);
}

const game = new Phaser.Game(config);
w.__game = game; // 디버깅용: 콘솔에서 window.__game

w.__errs = w.__errs ?? [];
window.addEventListener('error', (e) => w.__errs!.push(String(e.message)));
window.addEventListener('unhandledrejection', (e) => w.__errs!.push('promise: ' + String(e.reason)));

if (import.meta.hot) {
  import.meta.hot.dispose(() => game.destroy(true));
}

// 서비스워커 등록 (웹 배포 빌드에서만) — 오프라인 실행 + 자동 업데이트
// ⚠ Capacitor(안드로이드 앱) 안에서는 등록 안 함: 앱은 에셋을 자체 번들하므로
//    SW 캐시가 앱 업데이트 후 옛 코드를 물고 있을 수 있어 오히려 문제.
const isNative = !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
if (import.meta.env.PROD && !isNative && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
