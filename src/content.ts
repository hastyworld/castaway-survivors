// ============================================================
// content.ts — 게임 콘텐츠 데이터 (적 / 무기 / 특성 / 섬)
// 새 적·무기·섬을 추가하려면 대부분 이 파일만 늘리면 됩니다.
// ============================================================

import {
  COLORS,
  EnemyDef,
  IslandDef,
  PassiveDef,
  WaveDef,
  WeaponDef,
} from './config';

// ---------------- 적 원형(base) ----------------
// 섬의 difficulty 배수를 곱해서 최종 능력치가 됩니다.
export const ENEMIES: Record<string, EnemyDef> = {
  bug: { id: 'bug', name: '모기떼', color: COLORS.bug, texture: 'enemy_bug', hp: 12, speed: 78, damage: 5, xp: 1, radius: 12, gold: 1 },
  crab: { id: 'crab', name: '집게게', color: COLORS.crab, texture: 'enemy_crab', hp: 34, speed: 50, damage: 9, xp: 2, radius: 17, gold: 2 },
  boar: { id: 'boar', name: '멧돼지', color: COLORS.boar, texture: 'enemy_boar', hp: 78, speed: 64, damage: 15, xp: 4, radius: 21, gold: 3 },
  ghost: { id: 'ghost', name: '저주받은 유령', color: COLORS.ghost, texture: 'enemy_ghost', hp: 55, speed: 90, damage: 12, xp: 3, radius: 17, gold: 3 },
  pirate: { id: 'pirate', name: '해적', color: COLORS.pirate_enemy, texture: 'enemy_pirate', hp: 110, speed: 58, damage: 18, xp: 5, radius: 20, gold: 4 },
};

// ---------------- 무기(판 안 성장 ①) ----------------
export const WEAPONS: WeaponDef[] = [
  { id: 'coconut', name: '야자열매 던지기', desc: '가장 가까운 적에게 열매를 던집니다.', maxLevel: 8 },
  { id: 'starfish', name: '불가사리 표창', desc: '적을 관통하며 날아가는 표창.', maxLevel: 8 },
  { id: 'campfire', name: '모닥불', desc: '주변의 적을 지속적으로 태웁니다.', maxLevel: 8 },
];

// ---------------- 특성(판 안 성장 ①, 패시브) ----------------
export const PASSIVES: PassiveDef[] = [
  { id: 'maxhp', name: '튼튼한 몸', desc: '최대 체력 +25 (즉시 회복)', maxLevel: 5 },
  { id: 'power', name: '강한 손아귀', desc: '모든 피해 +15%', maxLevel: 5 },
  { id: 'speed', name: '날쌘 발', desc: '이동 속도 +8%', maxLevel: 5 },
  { id: 'haste', name: '숙련된 손놀림', desc: '공격 속도 +8%', maxLevel: 5 },
  { id: 'magnet', name: '자석 부적', desc: '경험치 획득 범위 +35', maxLevel: 5 },
  { id: 'regen', name: '재생력', desc: '초당 체력 +0.6 회복', maxLevel: 5 },
];

// ---------------- 웨이브 생성 헬퍼 ----------------
function wave(enemies: string[], count: number, interval: number): WaveDef {
  return { enemies, count, interval };
}

// ---------------- 섬(매크로 진행) ----------------
// 기획안 4번: 섬 3개. 초안에서는 섬당 웨이브 4개 + 보스 1로 압축.
export const ISLANDS: IslandDef[] = [
  {
    id: 0,
    name: '작은 모래섬',
    vehicle: '뗏목',
    bgTop: COLORS.ocean,
    bgBottom: COLORS.sandDark,
    difficulty: 1.0,
    waves: [
      wave(['bug'], 16, 520),
      wave(['bug', 'crab'], 22, 460),
      wave(['crab'], 24, 420),
      wave(['bug', 'crab'], 30, 360),
    ],
    boss: { id: 'kingcrab', name: '왕집게게', color: COLORS.boss, texture: 'boss_kingcrab', hp: 650, speed: 42, damage: 20, xp: 0, radius: 46, gold: 0 },
    reward: 60,
  },
  {
    id: 1,
    name: '울창한 정글섬',
    vehicle: '나룻배',
    bgTop: COLORS.ocean,
    bgBottom: COLORS.jungle,
    difficulty: 1.5,
    waves: [
      wave(['crab', 'boar'], 22, 600),
      wave(['boar'], 24, 540),
      wave(['crab', 'boar', 'ghost'], 30, 460),
      wave(['boar', 'ghost'], 34, 400),
    ],
    boss: { id: 'boarking', name: '성난 멧돼지 왕', color: COLORS.boss, texture: 'boss_boarking', hp: 1250, speed: 70, damage: 26, xp: 0, radius: 52, gold: 0 },
    reward: 110,
  },
  {
    id: 2,
    name: '저주받은 해적 바다',
    vehicle: '범선',
    bgTop: COLORS.oceanDark,
    bgBottom: COLORS.pirate,
    difficulty: 2.1,
    waves: [
      wave(['ghost', 'pirate'], 26, 560),
      wave(['boar', 'pirate'], 30, 500),
      wave(['ghost', 'pirate'], 36, 430),
      wave(['boar', 'ghost', 'pirate'], 42, 360),
    ],
    boss: { id: 'captain', name: '저주받은 해적 선장', color: COLORS.boss, texture: 'boss_captain', hp: 2400, speed: 60, damage: 34, xp: 0, radius: 56, gold: 0 },
    reward: 200,
  },
];

// 섬 클리어 후 도착 연출용: 다음 섬으로 갈 때 진화하는 탈것 이름
export const NEXT_VEHICLE = ['나룻배', '범선', '증기선'];
