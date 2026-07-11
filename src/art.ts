// ============================================================
// art.ts — 코드로 그리는 캐릭터/적/소품 텍스처 (에셋 파일 없음)
// 모든 텍스처는 64x64 기준(원형 히트박스 setCircle(32)와 호환).
// BootScene 에서 generateArt(scene) 한 번 호출.
// ============================================================
import Phaser from 'phaser';

type G = Phaser.GameObjects.Graphics;

// 자주 쓰는 색
const SKIN = 0xf2c79a;
const SKIN_D = 0xd9a878;
const STRAW = 0xe8c877;
const STRAW_D = 0xc9a24e;
const WHITE = 0xffffff;
const DARK = 0x22252b;

// 귀여운 눈 (흰자 + 눈동자)
function eyes(g: G, cx: number, gap: number, y: number, r: number, pr: number, angry = false): void {
  g.fillStyle(WHITE, 1);
  g.fillCircle(cx - gap, y, r);
  g.fillCircle(cx + gap, y, r);
  g.fillStyle(DARK, 1);
  g.fillCircle(cx - gap, y, pr);
  g.fillCircle(cx + gap, y, pr);
  if (angry) {
    // 성난 눈썹
    g.lineStyle(2.5, DARK, 1);
    g.lineBetween(cx - gap - r, y - r - 1, cx - gap + r * 0.3, y - 1);
    g.lineBetween(cx + gap + r, y - r - 1, cx + gap - r * 0.3, y - 1);
  }
}

function crown(g: G, cx: number, y: number, w: number): void {
  g.fillStyle(0xffd45e, 1);
  const h = 10;
  g.fillRect(cx - w / 2, y, w, 4);
  g.fillTriangle(cx - w / 2, y, cx - w / 2 + 6, y - h, cx - w / 2 + 12, y);
  g.fillTriangle(cx - 6, y, cx, y - h - 2, cx + 6, y);
  g.fillTriangle(cx + w / 2, y, cx + w / 2 - 6, y - h, cx + w / 2 - 12, y);
}

export function generateArt(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  const tex = (key: string, size = 64) => {
    g.generateTexture(key, size, size);
    g.clear();
  };

  // ---------- 기본 도형 (오라/링/파티클/조이스틱) ----------
  g.fillStyle(WHITE, 1);
  g.fillCircle(32, 32, 32);
  tex('circle');

  g.fillStyle(WHITE, 1);
  g.beginPath();
  g.moveTo(12, 0);
  g.lineTo(24, 12);
  g.lineTo(12, 24);
  g.lineTo(0, 12);
  g.closePath();
  g.fillPath();
  tex('gem', 24);

  g.fillStyle(WHITE, 0.35);
  g.fillCircle(8, 8, 8);
  g.fillStyle(WHITE, 1);
  g.fillCircle(8, 8, 4);
  tex('spark', 16);

  g.lineStyle(6, WHITE, 1);
  g.strokeCircle(70, 70, 64);
  tex('joyBase', 140);

  g.fillStyle(WHITE, 1);
  g.fillCircle(32, 32, 30);
  tex('joyThumb');

  // ---------- 주인공들: 캐릭터 4종 × 진화 3단계 ----------
  // characters.ts 의 hero_<id>_<stage> 키와 1:1 대응.
  type HatKind = 'straw' | 'headband' | 'bandana' | 'hood';
  interface HeroOpts {
    shirt: number;
    shirtLight: number;
    hat: HatKind;
    hatC: number;
    hatD: number;
    eyepatch?: boolean;
    stage: number; // 0..2 — 1: 금장식, 2: 왕관 + 황금 오라
  }
  const hero = (key: string, o: HeroOpts) => {
    // 진화 2단계: 황금 오라 (몸 뒤 은은한 빛)
    if (o.stage >= 2) {
      g.fillStyle(0xffd45e, 0.1);
      g.fillCircle(32, 34, 29);
      g.fillStyle(0xffd45e, 0.14);
      g.fillCircle(32, 34, 24);
    }
    // 그림자
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(32, 56, 34, 10);
    // 몸통
    g.fillStyle(o.shirt, 1);
    g.fillRoundedRect(20, 38, 24, 20, 9);
    g.fillStyle(o.shirtLight, 1);
    g.fillRoundedRect(22, 40, 20, 12, 7);
    // 진화 1단계+: 가슴의 금 브로치
    if (o.stage >= 1) {
      g.fillStyle(0xffd45e, 1);
      g.fillCircle(32, 46, 3);
      g.fillStyle(0xfff2c0, 1);
      g.fillCircle(31, 45, 1.2);
    }
    // 팔
    g.fillStyle(SKIN, 1);
    g.fillCircle(19, 46, 4.5);
    g.fillCircle(45, 46, 4.5);
    // 머리
    g.fillStyle(SKIN, 1);
    g.fillCircle(32, 30, 12);
    g.fillStyle(SKIN_D, 1);
    g.fillEllipse(32, 40, 16, 6); // 턱 그늘
    g.fillStyle(SKIN, 1);
    g.fillCircle(32, 29, 11.5);
    // 눈 + 볼
    eyes(g, 32, 5, 30, 3, 1.6);
    g.fillStyle(0xffb0a0, 0.5);
    g.fillCircle(25, 34, 2.5);
    g.fillCircle(39, 34, 2.5);
    // 안대 (해적)
    if (o.eyepatch) {
      g.fillStyle(DARK, 1);
      g.fillCircle(37, 30, 4.5);
      g.lineStyle(2, DARK, 1);
      g.lineBetween(26, 25, 42, 27);
    }
    // 모자
    switch (o.hat) {
      case 'straw': // 밀짚모자 (챙 + 고깔)
        g.fillStyle(o.hatD, 1);
        g.fillEllipse(32, 20, 42, 12);
        g.fillStyle(o.hatC, 1);
        g.fillEllipse(32, 19, 40, 9);
        g.fillStyle(o.hatD, 1);
        g.fillTriangle(20, 19, 44, 19, 32, 5);
        g.fillStyle(o.hatC, 1);
        g.fillTriangle(22, 18, 42, 18, 32, 7);
        if (o.stage >= 1) {
          g.fillStyle(0xffd45e, 1); // 금 리본
          g.fillRect(23, 16, 18, 3);
        }
        break;
      case 'headband': // 이마 머리띠 (어부)
        g.fillStyle(o.hatD, 1);
        g.fillEllipse(32, 22, 25, 12); // 머리카락 느낌 윗부분
        g.fillStyle(o.hatC, 1);
        g.fillRect(21, 22, 22, 5); // 띠
        g.fillStyle(o.hatD, 1);
        g.fillTriangle(43, 23, 51, 20, 48, 27); // 묶은 매듭 자락
        if (o.stage >= 1) {
          g.fillStyle(0xffd45e, 1);
          g.fillRect(21, 23, 22, 1.6);
        }
        break;
      case 'bandana': // 두건 (해적)
        g.fillStyle(o.hatC, 1);
        g.fillEllipse(32, 22, 27, 17);
        g.fillRect(19, 22, 27, 4);
        g.fillStyle(o.hatD, 1);
        g.fillTriangle(45, 24, 55, 22, 51, 31); // 매듭 자락
        g.fillStyle(WHITE, 0.55); // 물방울 무늬
        g.fillCircle(26, 18, 1.8);
        g.fillCircle(34, 15, 1.8);
        g.fillCircle(40, 19, 1.8);
        if (o.stage >= 1) {
          g.fillStyle(0xffd45e, 1);
          g.fillRect(19, 24, 27, 2);
        }
        break;
      case 'hood': // 후드 (주술사)
        g.fillStyle(o.hatD, 1);
        g.fillEllipse(32, 21, 30, 20);
        g.fillRect(17, 21, 30, 7);
        g.fillStyle(o.hatC, 1);
        g.fillEllipse(32, 19, 24, 13);
        g.fillStyle(o.hatD, 1);
        g.fillTriangle(32, 4, 27, 14, 37, 14); // 뾰족한 후드 끝
        if (o.stage >= 1) {
          g.fillStyle(0xffd45e, 1); // 이마의 금 문양
          g.fillCircle(32, 24, 2.2);
        }
        break;
    }
    // 진화 2단계: 작은 금관
    if (o.stage >= 2) crown(g, 32, 12, 18);
    tex(key);
  };

  const heroDefs: { id: string; o: Omit<HeroOpts, 'stage'> }[] = [
    { id: 'castaway', o: { shirt: 0x6fb7e0, shirtLight: 0x8fd3ff, hat: 'straw', hatC: STRAW, hatD: STRAW_D } },
    { id: 'fisher', o: { shirt: 0x3aa88f, shirtLight: 0x5cc9ad, hat: 'headband', hatC: 0x4a86c8, hatD: 0x2e567e } },
    { id: 'pirate', o: { shirt: 0xa8433a, shirtLight: 0xc95c4e, hat: 'bandana', hatC: 0x73364a, hatD: 0x4a2231, eyepatch: true } },
    { id: 'shaman', o: { shirt: 0x7a5aa8, shirtLight: 0x9678c8, hat: 'hood', hatC: 0x9678c8, hatD: 0x5a3f80 } },
  ];
  for (const h of heroDefs) for (let st = 0; st <= 2; st++) hero(`hero_${h.id}_${st}`, { ...h.o, stage: st });

  // 구버전 호환: 'player' = 기본 표류자 모습
  hero('player', { ...heroDefs[0].o, stage: 0 });

  // ---------- 적: 모기떼 (작고 빠른 벌레) ----------
  g.fillStyle(WHITE, 0.45);
  g.fillEllipse(20, 24, 18, 12); // 날개
  g.fillEllipse(44, 24, 18, 12);
  g.fillStyle(0xb5453f, 1);
  g.fillEllipse(32, 36, 20, 26); // 몸통
  g.fillStyle(0x8f322e, 1);
  g.fillCircle(32, 24, 8); // 머리
  g.lineStyle(2, 0x8f322e, 1);
  g.lineBetween(29, 18, 25, 9); // 더듬이
  g.lineBetween(35, 18, 39, 9);
  eyes(g, 32, 4, 24, 3, 1.5);
  g.lineStyle(2.5, 0x5a1f1c, 1);
  g.lineBetween(32, 44, 32, 52); // 침
  tex('enemy_bug');

  // ---------- 적: 집게게 ----------
  g.fillStyle(0xe07b34, 1); // 집게
  g.fillCircle(13, 38, 9);
  g.fillCircle(51, 38, 9);
  g.fillStyle(0xf59b52, 1);
  g.fillTriangle(13, 30, 5, 34, 13, 40); // 집게 벌어짐
  g.fillTriangle(51, 30, 59, 34, 51, 40);
  g.fillStyle(0xf59b52, 1);
  g.fillEllipse(32, 38, 34, 26); // 등딱지
  g.fillStyle(0xe07b34, 1);
  g.fillEllipse(32, 33, 30, 14);
  // 다리
  g.lineStyle(2.5, 0xe07b34, 1);
  g.lineBetween(20, 46, 12, 54);
  g.lineBetween(44, 46, 52, 54);
  // 눈자루
  g.lineStyle(3, 0xe07b34, 1);
  g.lineBetween(26, 26, 26, 18);
  g.lineBetween(38, 26, 38, 18);
  eyes(g, 32, 6, 16, 4, 2);
  tex('enemy_crab');

  // ---------- 적: 멧돼지 ----------
  g.fillStyle(0x7a5335, 1); // 귀
  g.fillTriangle(20, 22, 26, 8, 30, 24);
  g.fillTriangle(44, 22, 38, 8, 34, 24);
  g.fillStyle(0x9c6b45, 1);
  g.fillEllipse(32, 36, 38, 30); // 몸통
  g.fillStyle(0x8a5c3a, 1);
  g.fillEllipse(32, 30, 32, 16); // 등 그늘
  // 주둥이
  g.fillStyle(0x6e4a2e, 1);
  g.fillEllipse(32, 45, 18, 12);
  g.fillStyle(0x4a3020, 1);
  g.fillCircle(28, 45, 2);
  g.fillCircle(36, 45, 2);
  // 엄니
  g.fillStyle(WHITE, 1);
  g.fillTriangle(24, 46, 27, 40, 22, 38);
  g.fillTriangle(40, 46, 37, 40, 42, 38);
  eyes(g, 32, 8, 30, 3.5, 1.8, true);
  tex('enemy_boar');

  // ---------- 적: 저주받은 유령 ----------
  g.fillStyle(0xc7b8ff, 0.92);
  g.fillCircle(32, 28, 16); // 머리
  g.fillRect(16, 28, 32, 18); // 몸
  g.fillCircle(21, 46, 6); // 물결 아랫단
  g.fillCircle(32, 47, 6);
  g.fillCircle(43, 46, 6);
  g.fillStyle(0xe6dfff, 0.9);
  g.fillCircle(32, 24, 11);
  // 눈/입
  g.fillStyle(0x3a2f5c, 1);
  g.fillEllipse(26, 27, 6, 9);
  g.fillEllipse(38, 27, 6, 9);
  g.fillCircle(32, 38, 4);
  tex('enemy_ghost');

  // ---------- 적: 해적 ----------
  g.fillStyle(0x5a636e, 1); // 몸
  g.fillRoundedRect(19, 34, 26, 24, 9);
  g.fillStyle(0x6b7280, 1);
  g.fillRoundedRect(21, 36, 22, 14, 7);
  g.fillStyle(0xc8a98a, 1); // 얼굴
  g.fillCircle(32, 28, 11);
  // 삼각모
  g.fillStyle(0x2e2e38, 1);
  g.fillEllipse(32, 18, 34, 9);
  g.fillTriangle(18, 19, 46, 19, 32, 6);
  g.fillStyle(0xffd45e, 1); // 해골 마크
  g.fillCircle(32, 14, 3);
  // 안대 + 눈
  g.fillStyle(0x1a1a1a, 1);
  g.fillCircle(28, 28, 3.5);
  g.lineStyle(2, 0x1a1a1a, 1);
  g.lineBetween(24, 24, 38, 26);
  g.fillStyle(WHITE, 1);
  g.fillCircle(37, 29, 3);
  g.fillStyle(DARK, 1);
  g.fillCircle(37, 29, 1.6);
  tex('enemy_pirate');

  // ---------- 보스: 왕집게게 ----------
  g.fillStyle(0xc0392b, 1);
  g.fillCircle(11, 40, 11);
  g.fillCircle(53, 40, 11);
  g.fillStyle(0xe74c3c, 1);
  g.fillTriangle(11, 30, 2, 35, 11, 44);
  g.fillTriangle(53, 30, 62, 35, 53, 44);
  g.fillEllipse(32, 40, 40, 30);
  g.fillStyle(0xc0392b, 1);
  g.fillEllipse(32, 34, 34, 16);
  g.lineStyle(3, 0xc0392b, 1);
  g.lineBetween(26, 26, 26, 16);
  g.lineBetween(38, 26, 38, 16);
  eyes(g, 32, 7, 15, 4.5, 2.2, true);
  crown(g, 32, 8, 22);
  tex('boss_kingcrab');

  // ---------- 보스: 성난 멧돼지 왕 ----------
  g.fillStyle(0x5c3d24, 1);
  g.fillTriangle(18, 22, 25, 6, 30, 24);
  g.fillTriangle(46, 22, 39, 6, 34, 24);
  g.fillStyle(0x7a4a2c, 1);
  g.fillEllipse(32, 37, 44, 34);
  g.fillStyle(0x633c22, 1);
  g.fillEllipse(32, 30, 36, 16);
  g.fillStyle(0x4a3020, 1);
  g.fillEllipse(32, 46, 22, 14);
  g.fillStyle(0x2a1a10, 1);
  g.fillCircle(27, 46, 2.5);
  g.fillCircle(37, 46, 2.5);
  g.fillStyle(WHITE, 1);
  g.fillTriangle(22, 48, 26, 38, 19, 36);
  g.fillTriangle(42, 48, 38, 38, 45, 36);
  g.fillStyle(0xff5a5a, 1); // 붉은 눈
  g.fillCircle(25, 30, 3.5);
  g.fillCircle(39, 30, 3.5);
  g.fillStyle(DARK, 1);
  g.fillCircle(25, 30, 1.6);
  g.fillCircle(39, 30, 1.6);
  crown(g, 32, 10, 22);
  tex('boss_boarking');

  // ---------- 보스: 저주받은 해적 선장 ----------
  g.fillStyle(0x3a2b4d, 1);
  g.fillRoundedRect(16, 34, 32, 26, 10);
  g.fillStyle(0x4a3a5f, 1);
  g.fillRoundedRect(19, 37, 26, 16, 8);
  g.fillStyle(0xb89a7a, 1);
  g.fillCircle(32, 27, 13);
  // 큰 삼각모 + 금테
  g.fillStyle(0x1a1626, 1);
  g.fillEllipse(32, 16, 42, 11);
  g.fillTriangle(13, 17, 51, 17, 32, 3);
  g.fillStyle(0xffd45e, 1);
  g.fillCircle(32, 12, 4);
  g.fillTriangle(28, 12, 36, 12, 32, 6);
  // 안대 + 붉은 눈
  g.fillStyle(0x120f1a, 1);
  g.fillCircle(27, 27, 4);
  g.lineStyle(2.5, 0x120f1a, 1);
  g.lineBetween(22, 22, 38, 25);
  g.fillStyle(0xff5a5a, 1);
  g.fillCircle(38, 28, 3.5);
  g.fillStyle(DARK, 1);
  g.fillCircle(38, 28, 1.6);
  crown(g, 32, 4, 20);
  tex('boss_captain');

  // ---------- 적: 해파리 ----------
  g.fillStyle(0xff9ecf, 0.9);
  g.fillCircle(32, 26, 16);
  g.fillStyle(0xffb8dd, 0.9);
  g.fillEllipse(32, 21, 24, 12);
  g.fillStyle(0xff9ecf, 0.9);
  g.fillCircle(20, 38, 5);
  g.fillCircle(30, 40, 5);
  g.fillCircle(40, 40, 5);
  g.fillCircle(48, 38, 5);
  g.lineStyle(2.5, 0xff9ecf, 0.8);
  g.lineBetween(20, 40, 18, 56);
  g.lineBetween(29, 42, 30, 58);
  g.lineBetween(39, 42, 38, 58);
  g.lineBetween(48, 40, 50, 56);
  eyes(g, 32, 5, 26, 3, 1.5);
  tex('enemy_jelly');

  // ---------- 적: 바다뱀 ----------
  g.fillStyle(0x3fa886, 1);
  g.fillCircle(12, 50, 5);
  g.fillCircle(18, 45, 6);
  g.fillCircle(25, 43, 6.5);
  g.fillCircle(32, 46, 7);
  g.fillCircle(39, 47, 7);
  g.fillStyle(0x4bbf9a, 1);
  g.fillCircle(47, 40, 9); // 머리
  g.fillStyle(0x3fa886, 1);
  g.fillTriangle(53, 36, 61, 41, 53, 46); // 주둥이
  eyes(g, 46, 3, 36, 2.6, 1.3, true);
  g.fillStyle(WHITE, 1);
  g.fillTriangle(49, 46, 51, 52, 53, 46); // 송곳니
  tex('enemy_eel');

  // ---------- 적: 해골 병사 ----------
  g.fillStyle(0xe8e4d8, 1);
  g.fillRoundedRect(24, 34, 16, 20, 5); // 몸
  g.fillStyle(0xcfcabb, 1);
  g.fillRect(25, 39, 14, 2);
  g.fillRect(25, 44, 14, 2);
  g.fillRect(25, 49, 14, 2);
  g.fillStyle(0xe8e4d8, 1);
  g.fillCircle(20, 40, 3.5); // 팔뼈
  g.fillCircle(44, 40, 3.5);
  g.fillStyle(0xf3f0e7, 1); // 두개골
  g.fillCircle(32, 25, 12);
  g.fillRect(26, 30, 12, 6);
  g.fillStyle(0x1a1a1a, 1);
  g.fillCircle(28, 25, 3.5); // 눈구멍
  g.fillCircle(36, 25, 3.5);
  g.fillTriangle(31, 29, 33, 29, 32, 33); // 코
  g.fillStyle(0xcfcabb, 1);
  g.fillRect(28, 34, 2, 3); // 이빨
  g.fillRect(31, 34, 2, 3);
  g.fillRect(34, 34, 2, 3);
  tex('enemy_skeleton');

  // ---------- 보스: 문어대왕 ----------
  g.fillStyle(0x7d3c98, 1); // 다리
  [
    [12, 52],
    [21, 58],
    [32, 60],
    [43, 58],
    [52, 52],
  ].forEach(([x, y]) => g.fillTriangle(32, 42, x - 5, y, x + 5, y));
  g.fillStyle(0x9b59b6, 1);
  g.fillCircle(32, 28, 19);
  g.fillStyle(0xac6bc7, 1);
  g.fillEllipse(32, 22, 26, 14);
  g.fillStyle(0x6a2f82, 1); // 빨판
  g.fillCircle(24, 44, 2.5);
  g.fillCircle(32, 47, 2.5);
  g.fillCircle(40, 44, 2.5);
  eyes(g, 32, 8, 28, 5, 2.6, true);
  crown(g, 32, 7, 22);
  tex('boss_octopus');

  // ---------- 보스: 심해 대왕뱀 ----------
  g.fillStyle(0x1f6e5f, 1);
  g.fillCircle(13, 52, 8);
  g.fillCircle(21, 46, 9);
  g.fillCircle(30, 48, 10);
  g.fillStyle(0x2e8b78, 1);
  g.fillEllipse(42, 36, 24, 20); // 머리
  g.fillStyle(0x1f6e5f, 1);
  g.fillTriangle(52, 32, 62, 38, 52, 44); // 주둥이
  g.fillStyle(0xff5a5a, 1);
  g.fillCircle(40, 32, 4);
  g.fillCircle(48, 32, 4);
  g.fillStyle(DARK, 1);
  g.fillCircle(40, 32, 1.8);
  g.fillCircle(48, 32, 1.8);
  g.fillStyle(WHITE, 1);
  g.fillTriangle(48, 44, 51, 52, 54, 44); // 송곳니
  crown(g, 42, 22, 22);
  tex('boss_serpent');

  // ---------- 보스: 유령 군주 ----------
  g.fillStyle(0x6a4c93, 0.95);
  g.fillCircle(32, 30, 19);
  g.fillRect(13, 30, 38, 20);
  g.fillCircle(20, 50, 6);
  g.fillCircle(32, 52, 6);
  g.fillCircle(44, 50, 6);
  g.fillStyle(0x8368b0, 0.95);
  g.fillCircle(32, 26, 13);
  g.fillStyle(0xe8e4d8, 1); // 해골 얼굴
  g.fillCircle(32, 27, 11);
  g.fillStyle(0x00e5ff, 1); // 빛나는 눈
  g.fillCircle(28, 27, 3.2);
  g.fillCircle(36, 27, 3.2);
  g.fillStyle(DARK, 1);
  g.fillTriangle(31, 31, 33, 31, 32, 34);
  crown(g, 32, 8, 22);
  tex('boss_lich');

  // ---------- 적: 박쥐 ----------
  g.fillStyle(0x4a3f5c, 1);
  g.fillTriangle(6, 22, 26, 20, 22, 40);
  g.fillTriangle(58, 22, 38, 20, 42, 40);
  g.fillStyle(0x3a3048, 1);
  g.fillEllipse(32, 33, 20, 22);
  g.fillStyle(0x2a2238, 1);
  g.fillTriangle(24, 20, 27, 9, 31, 22);
  g.fillTriangle(40, 20, 37, 9, 33, 22);
  eyes(g, 32, 5, 30, 3, 1.5, true);
  g.fillStyle(WHITE, 1);
  g.fillTriangle(28, 42, 30, 48, 32, 42);
  g.fillTriangle(32, 42, 34, 48, 36, 42);
  tex('enemy_bat');

  // ---------- 적: 민달팽이 ----------
  g.fillStyle(0x6cbf5a, 1);
  g.fillEllipse(28, 44, 44, 18);
  g.fillStyle(0x5aa84a, 1);
  g.fillEllipse(22, 42, 26, 14);
  g.fillStyle(0xd98b4a, 1);
  g.fillCircle(40, 34, 14);
  g.fillStyle(0xb56b32, 1);
  g.fillCircle(40, 34, 9);
  g.fillCircle(40, 34, 4);
  g.lineStyle(2.5, 0x6cbf5a, 1);
  g.lineBetween(17, 38, 15, 24);
  g.lineBetween(24, 36, 24, 22);
  g.fillStyle(WHITE, 1);
  g.fillCircle(15, 23, 3);
  g.fillCircle(24, 21, 3);
  g.fillStyle(DARK, 1);
  g.fillCircle(15, 23, 1.5);
  g.fillCircle(24, 21, 1.5);
  tex('enemy_slug');

  // ---------- 적: 바위 골렘 ----------
  g.fillStyle(0x7d7a72, 1);
  g.fillRoundedRect(18, 26, 28, 30, 5);
  g.fillStyle(0x8f8c84, 1);
  g.fillRoundedRect(21, 19, 18, 15, 4);
  g.fillStyle(0x6a675f, 1);
  g.fillRoundedRect(11, 30, 11, 14, 3);
  g.fillRoundedRect(42, 30, 11, 14, 3);
  g.fillStyle(0x00e5ff, 1);
  g.fillCircle(26, 26, 3);
  g.fillCircle(34, 26, 3);
  g.fillStyle(0x5a574f, 1);
  g.fillRect(24, 40, 16, 2);
  g.fillRect(30, 44, 10, 2);
  tex('enemy_golem');

  // ---------- 적: 상어 ----------
  g.fillStyle(0x6b7d8a, 1);
  g.fillEllipse(30, 34, 44, 22);
  g.fillStyle(0x9aaab6, 1);
  g.fillEllipse(28, 40, 34, 10);
  g.fillStyle(0x556673, 1);
  g.fillTriangle(26, 22, 36, 22, 31, 8);
  g.fillTriangle(50, 28, 63, 20, 58, 40);
  g.fillStyle(WHITE, 1);
  g.fillTriangle(9, 34, 15, 32, 15, 38);
  g.fillTriangle(9, 38, 15, 36, 14, 42);
  g.fillStyle(WHITE, 1);
  g.fillCircle(19, 30, 3);
  g.fillStyle(DARK, 1);
  g.fillCircle(19, 30, 1.5);
  tex('enemy_shark');

  // ---------- 보스: 거대 골렘 ----------
  g.fillStyle(0x6a675f, 1);
  g.fillRoundedRect(13, 28, 38, 34, 6);
  g.fillStyle(0x7d7a72, 1);
  g.fillRoundedRect(20, 17, 24, 19, 5);
  g.fillStyle(0x565349, 1);
  g.fillRoundedRect(6, 32, 12, 18, 4);
  g.fillRoundedRect(46, 32, 12, 18, 4);
  g.fillStyle(0xff5a5a, 1);
  g.fillCircle(27, 26, 4);
  g.fillCircle(37, 26, 4);
  g.fillStyle(DARK, 1);
  g.fillCircle(27, 26, 1.8);
  g.fillCircle(37, 26, 1.8);
  g.fillStyle(0x4a473f, 1);
  g.fillRect(22, 44, 20, 3);
  crown(g, 32, 9, 22);
  tex('boss_golem');

  // ---------- 보스: 메가 상어 ----------
  g.fillStyle(0x556673, 1);
  g.fillEllipse(30, 34, 50, 28);
  g.fillStyle(0x7a8b98, 1);
  g.fillEllipse(30, 41, 40, 12);
  g.fillStyle(0x3f4f5b, 1);
  g.fillTriangle(25, 20, 39, 20, 32, 3);
  g.fillTriangle(52, 26, 64, 15, 60, 44);
  g.fillStyle(WHITE, 1);
  for (let i = 0; i < 5; i++) g.fillTriangle(8 + i * 5, 40, 11 + i * 5, 47, 14 + i * 5, 40);
  g.fillStyle(0xff5a5a, 1);
  g.fillCircle(21, 29, 4);
  g.fillStyle(DARK, 1);
  g.fillCircle(21, 29, 1.8);
  crown(g, 32, 6, 20);
  tex('boss_shark');

  // ---------- 투사체: 야자열매 ----------
  g.fillStyle(0x6b4a2b, 1);
  g.fillCircle(32, 32, 22);
  g.fillStyle(0x543a22, 1);
  g.fillCircle(32, 24, 4); // 코코넛 눈 3개
  g.fillCircle(24, 36, 4);
  g.fillCircle(40, 36, 4);
  g.fillStyle(0x7d5836, 1);
  g.fillEllipse(26, 26, 8, 5); // 하이라이트
  tex('coconut');

  // ---------- 투사체: 불가사리 ----------
  g.fillStyle(0xffb347, 1);
  const cx = 32;
  const cy = 32;
  const outer = 30;
  const inner = 12;
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fillPath();
  g.fillStyle(0xe08a2c, 1); // 점무늬
  g.fillCircle(32, 32, 4);
  g.fillCircle(32, 20, 2.5);
  g.fillCircle(22, 38, 2.5);
  g.fillCircle(42, 38, 2.5);
  tex('starfish_p');

  // ---------- 소품: 야자수 ----------
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(32, 58, 28, 8);
  g.fillStyle(0x8a6239, 1); // 줄기
  g.fillRoundedRect(28, 26, 8, 30, 3);
  g.fillStyle(0x2e8b57, 1); // 잎
  g.fillEllipse(20, 22, 26, 12);
  g.fillEllipse(44, 22, 26, 12);
  g.fillEllipse(32, 16, 14, 22);
  g.fillEllipse(18, 28, 22, 10);
  g.fillEllipse(46, 28, 22, 10);
  g.fillStyle(0x8b5a2b, 1); // 열매
  g.fillCircle(29, 27, 3);
  g.fillCircle(35, 28, 3);
  tex('palm');

  // ---------- 소품: 바위 ----------
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(32, 46, 40, 10);
  g.fillStyle(0x8a8f96, 1);
  g.fillEllipse(32, 36, 40, 26);
  g.fillStyle(0x9ba0a7, 1);
  g.fillEllipse(28, 30, 26, 14);
  g.fillStyle(0x767b82, 1);
  g.fillEllipse(40, 40, 20, 10);
  tex('rock');

  // ---------- 소품: 수풀 ----------
  g.fillStyle(0x000000, 0.12);
  g.fillEllipse(32, 48, 36, 8);
  g.fillStyle(0x3aa76d, 1);
  g.fillCircle(20, 40, 12);
  g.fillCircle(44, 40, 12);
  g.fillCircle(32, 34, 14);
  g.fillStyle(0x4fc07f, 1);
  g.fillCircle(26, 34, 7);
  g.fillCircle(40, 36, 7);
  tex('bush');

  // ---------- 투사체: 작살 (긴 창) ----------
  g.fillStyle(0x8a6239, 1); // 자루
  g.fillRect(6, 29, 42, 6);
  g.fillStyle(0xd8e8f0, 1); // 창날
  g.fillTriangle(46, 22, 62, 32, 46, 42);
  g.fillStyle(0xaac8d8, 1);
  g.fillTriangle(48, 26, 58, 32, 48, 38);
  g.fillStyle(0xd8e8f0, 1); // 미늘
  g.fillTriangle(44, 24, 50, 30, 40, 30);
  tex('harpoon_p');

  // ---------- 투사체: 성게 가시 (뾰족한 공) ----------
  g.fillStyle(0x5a3fa0, 1);
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i;
    g.fillTriangle(
      32 + Math.cos(a) * 30, 32 + Math.sin(a) * 30,
      32 + Math.cos(a + 0.5) * 14, 32 + Math.sin(a + 0.5) * 14,
      32 + Math.cos(a - 0.5) * 14, 32 + Math.sin(a - 0.5) * 14
    );
  }
  g.fillStyle(0x8a6ad8, 1);
  g.fillCircle(32, 32, 15);
  g.fillStyle(0xb59af0, 1);
  g.fillCircle(28, 28, 6);
  tex('urchin_p');

  // ---------- 링 (파도 충격파/픽업 광채용, 흰 테두리 원) ----------
  g.lineStyle(6, WHITE, 1);
  g.strokeCircle(64, 64, 58);
  g.lineStyle(3, WHITE, 0.5);
  g.strokeCircle(64, 64, 50);
  g.generateTexture('ring', 128, 128);
  g.clear();

  // ---------- 아이템: 고기 (체력 회복) ----------
  g.fillStyle(0xf0e6d0, 1); // 뼈
  g.fillRect(10, 28, 22, 8);
  g.fillCircle(9, 27, 5);
  g.fillCircle(9, 37, 5);
  g.fillStyle(0xc0563c, 1); // 살코기
  g.fillEllipse(40, 32, 32, 26);
  g.fillStyle(0xe07a5c, 1);
  g.fillEllipse(44, 28, 18, 12);
  tex('item_meat');

  // ---------- 아이템: 자석 (전체 흡수) ----------
  g.fillStyle(0xd84a4a, 1); // U자 자석
  g.fillRect(18, 14, 10, 28);
  g.fillRect(36, 14, 10, 28);
  g.fillEllipse(32, 42, 28, 20);
  g.fillStyle(0x0d3b5c, 1);
  g.fillEllipse(32, 38, 12, 10); // 안쪽 파냄
  g.fillRect(26, 14, 12, 26);
  g.fillStyle(0xe8e8e8, 1); // 끝부분
  g.fillRect(18, 12, 10, 8);
  g.fillRect(36, 12, 10, 8);
  tex('item_magnet');

  // ---------- 아이템: 폭탄 (광역 폭발) ----------
  g.fillStyle(0x2a2f38, 1);
  g.fillCircle(32, 38, 18);
  g.fillStyle(0x454c58, 1);
  g.fillCircle(26, 32, 7); // 하이라이트
  g.fillStyle(0x8a6239, 1); // 심지
  g.fillRect(30, 16, 5, 8);
  g.fillStyle(0xffd45e, 1); // 불꽃
  g.fillCircle(33, 12, 5);
  g.fillStyle(0xff7a3c, 1);
  g.fillCircle(33, 12, 2.5);
  tex('item_bomb');

  // ---------- 아이템: 보물상자 (무기 강화) ----------
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(32, 52, 36, 8);
  g.fillStyle(0x8a6239, 1); // 몸통
  g.fillRoundedRect(12, 28, 40, 22, 4);
  g.fillStyle(0xa87c4a, 1); // 뚜껑
  g.fillRoundedRect(10, 18, 44, 14, 6);
  g.fillStyle(0xffd45e, 1); // 금장식 띠
  g.fillRect(29, 18, 6, 32);
  g.fillRect(12, 30, 40, 3);
  g.fillStyle(0xfff2c0, 1); // 자물쇠
  g.fillCircle(32, 36, 4);
  tex('chest');

  // ---------- 환경: 나뭇잎 (떠다니는 파티클) ----------
  g.fillStyle(0x4fc07f, 1);
  g.fillEllipse(12, 12, 18, 8);
  g.fillStyle(0x2e8b57, 1);
  g.fillEllipse(12, 12, 12, 4);
  tex('leaf', 24);

  // ---------- 환경: 조개 ----------
  g.fillStyle(0xf0d8e8, 1);
  g.fillEllipse(16, 20, 24, 16);
  g.fillStyle(0xd8b0c8, 1);
  g.fillTriangle(16, 22, 8, 12, 12, 22);
  g.fillTriangle(16, 22, 16, 10, 20, 22);
  g.fillTriangle(16, 22, 24, 12, 20, 22);
  tex('shell', 32);

  // ---------- 환경: 들꽃 ----------
  g.fillStyle(0xffb0c8, 1);
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    g.fillCircle(16 + Math.cos(a) * 7, 14 + Math.sin(a) * 7, 5);
  }
  g.fillStyle(0xffd45e, 1);
  g.fillCircle(16, 14, 4);
  tex('flower', 32);

  // ---------- 환경: 횃불 ----------
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(32, 58, 20, 6);
  g.fillStyle(0x6b4a2b, 1); // 기둥
  g.fillRect(29, 28, 6, 30);
  g.fillStyle(0x8a6239, 1);
  g.fillRect(26, 26, 12, 6);
  g.fillStyle(0xff7a3c, 1); // 불꽃
  g.fillEllipse(32, 18, 14, 20);
  g.fillStyle(0xffd45e, 1);
  g.fillEllipse(32, 21, 8, 12);
  tex('torch');

  // ---------- UI: 둥근 패널 (버튼/카드용, 나인슬라이스로 tint해서 사용) ----------
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(0, 0, 48, 48, 16);
  g.generateTexture('panel', 48, 48);
  g.clear();

  g.destroy();
}
