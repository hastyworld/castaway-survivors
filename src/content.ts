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
  jelly: { id: 'jelly', name: '해파리', color: COLORS.jelly, texture: 'enemy_jelly', hp: 46, speed: 55, damage: 11, xp: 3, radius: 17, gold: 3 },
  eel: { id: 'eel', name: '바다뱀', color: COLORS.eel, texture: 'enemy_eel', hp: 62, speed: 105, damage: 13, xp: 3, radius: 17, gold: 3 },
  skeleton: { id: 'skeleton', name: '해골 병사', color: COLORS.skeleton, texture: 'enemy_skeleton', hp: 95, speed: 62, damage: 17, xp: 5, radius: 20, gold: 4 },
  bat: { id: 'bat', name: '흡혈박쥐', color: 0x6a5a80, texture: 'enemy_bat', hp: 40, speed: 122, damage: 10, xp: 3, radius: 15, gold: 3 },
  slug: { id: 'slug', name: '독 민달팽이', color: 0x6cbf5a, texture: 'enemy_slug', hp: 130, speed: 34, damage: 14, xp: 4, radius: 18, gold: 4 },
  golem: { id: 'golem', name: '바위 골렘', color: 0x8f8c84, texture: 'enemy_golem', hp: 210, speed: 40, damage: 22, xp: 7, radius: 22, gold: 5 },
  shark: { id: 'shark', name: '땅상어', color: 0x6b7d8a, texture: 'enemy_shark', hp: 92, speed: 100, damage: 18, xp: 5, radius: 20, gold: 4 },
};

// ---------------- 무기(판 안 성장 ①) ----------------
export const WEAPONS: WeaponDef[] = [
  { id: 'coconut', name: '야자열매 던지기', desc: '가장 가까운 적에게 열매를 던집니다.', maxLevel: 8 },
  { id: 'starfish', name: '불가사리 표창', desc: '적을 관통하며 날아가는 표창.', maxLevel: 8 },
  { id: 'campfire', name: '모닥불', desc: '주변의 적을 지속적으로 태웁니다.', maxLevel: 8 },
  { id: 'harpoon', name: '작살', desc: '일직선으로 꿰뚫는 강력한 작살.', maxLevel: 8 },
  { id: 'urchin', name: '성게 가시', desc: '내 주위를 도는 가시가 적을 벱니다.', maxLevel: 8 },
  { id: 'wave', name: '파도 술법', desc: '주기적으로 충격파가 퍼져 적을 밀쳐냅니다.', maxLevel: 8 },
];

// ---------------- 특성(판 안 성장 ①, 패시브) ----------------
export const PASSIVES: PassiveDef[] = [
  { id: 'maxhp', name: '튼튼한 몸', desc: '최대 체력 +25 (즉시 회복)', maxLevel: 5 },
  { id: 'power', name: '강한 손아귀', desc: '모든 피해 +15%', maxLevel: 5 },
  { id: 'speed', name: '날쌘 발', desc: '이동 속도 +8%', maxLevel: 5 },
  { id: 'haste', name: '숙련된 손놀림', desc: '공격 속도 +8%', maxLevel: 5 },
  { id: 'magnet', name: '자석 부적', desc: '경험치 획득 범위 +35', maxLevel: 5 },
  { id: 'regen', name: '재생력', desc: '초당 체력 +0.6 회복', maxLevel: 5 },
  { id: 'crit', name: '급소 노리기', desc: '치명타 확률 +7% (피해 1.8배)', maxLevel: 5 },
  { id: 'area', name: '커지는 힘', desc: '공격 범위/크기 +12%', maxLevel: 5 },
  { id: 'luck', name: '바다의 행운', desc: '아이템 드랍 확률 +30%', maxLevel: 5 },
];

// ---------------- 웨이브 생성 헬퍼 ----------------
function wave(enemies: string[], count: number, interval: number): WaveDef {
  return { enemies, count, interval };
}

// ============================================================
// 매크로 진행: 섬(Island) > 판(Run) > 스테이지(Stage)
//  - 판 하나 = 스테이지 3~6개 + 마지막 보스
//  - 섬 하나 = 판 RUNS_PER_ISLAND개 (절차 생성)
//  - 섬은 테마별로 아주 다양 (아래 표만 늘리면 섬 추가)
// ============================================================

export interface IslandTheme {
  name: string;
  vehicle: string;
  bgTop: number;
  bgBottom: number;
  baseDiff: number;
  enemyPool: string[]; // 이 섬에서 나오는 적
  bossPool: string[]; // 이 섬 보스 후보 (텍스처 키)
}

export const ISLAND_THEMES: IslandTheme[] = [
  { name: '모래 해변', vehicle: '뗏목', bgTop: COLORS.ocean, bgBottom: COLORS.sandDark, baseDiff: 1.0, enemyPool: ['bug', 'crab', 'bat'], bossPool: ['boss_kingcrab', 'boss_boarking'] },
  { name: '울창한 정글', vehicle: '나룻배', bgTop: COLORS.ocean, bgBottom: COLORS.jungle, baseDiff: 1.5, enemyPool: ['crab', 'boar', 'slug', 'bat'], bossPool: ['boss_boarking', 'boss_golem'] },
  { name: '산호초 바다', vehicle: '카누', bgTop: COLORS.ocean, bgBottom: COLORS.reef, baseDiff: 2.1, enemyPool: ['jelly', 'eel', 'shark', 'crab'], bossPool: ['boss_octopus', 'boss_shark'] },
  { name: '저주받은 해적항', vehicle: '범선', bgTop: COLORS.oceanDark, bgBottom: COLORS.pirate, baseDiff: 2.8, enemyPool: ['pirate', 'skeleton', 'ghost', 'bat'], bossPool: ['boss_captain', 'boss_lich'] },
  { name: '독기의 늪', vehicle: '증기선', bgTop: COLORS.oceanDark, bgBottom: COLORS.swamp, baseDiff: 3.5, enemyPool: ['slug', 'ghost', 'eel', 'jelly'], bossPool: ['boss_serpent', 'boss_lich'] },
  { name: '끓는 화산지대', vehicle: '쾌속정', bgTop: COLORS.oceanDark, bgBottom: COLORS.volcano, baseDiff: 4.3, enemyPool: ['golem', 'skeleton', 'boar', 'shark'], bossPool: ['boss_golem', 'boss_boarking'] },
  { name: '얼어붙은 심해', vehicle: '잠수함', bgTop: COLORS.arctic, bgBottom: COLORS.abyss, baseDiff: 5.2, enemyPool: ['shark', 'eel', 'ghost', 'skeleton'], bossPool: ['boss_octopus', 'boss_shark', 'boss_serpent'] },
  { name: '세상의 끝', vehicle: '전설의 방주', bgTop: COLORS.abyss, bgBottom: COLORS.sunset, baseDiff: 6.4, enemyPool: ['skeleton', 'ghost', 'golem', 'pirate', 'bat'], bossPool: ['boss_lich', 'boss_golem', 'boss_captain'] },
];

export const ISLAND_COUNT = ISLAND_THEMES.length;
export const RUNS_PER_ISLAND = 12;

export const VEHICLE_CHAIN = ISLAND_THEMES.map((t) => t.vehicle);
export const NEXT_VEHICLE = VEHICLE_CHAIN.slice(1);

const BOSS_NAMES: Record<string, string> = {
  boss_kingcrab: '왕집게게',
  boss_boarking: '멧돼지 왕',
  boss_octopus: '문어대왕',
  boss_captain: '해적 선장',
  boss_serpent: '대왕뱀',
  boss_lich: '유령 군주',
  boss_golem: '거대 골렘',
  boss_shark: '메가 상어',
};
const BOSS_RADIUS: Record<string, number> = {
  boss_kingcrab: 46,
  boss_boarking: 50,
  boss_octopus: 52,
  boss_captain: 54,
  boss_serpent: 56,
  boss_lich: 54,
  boss_golem: 56,
  boss_shark: 58,
};

// 한 판(run) 절차 생성: (섬, 판번호) → 스테이지들 + 보스
export function getRun(islandIndex: number, runIndex: number): IslandDef {
  const t = ISLAND_THEMES[Math.min(Math.max(islandIndex, 0), ISLAND_THEMES.length - 1)];
  const difficulty = t.baseDiff + runIndex * 0.1 + islandIndex * 0.05;

  const stageCount = 3 + (runIndex % 4); // 3~6 스테이지
  const pool = t.enemyPool;
  const stages: WaveDef[] = [];
  for (let s = 0; s < stageCount; s++) {
    const count = 14 + runIndex + s * 5;
    const interval = Math.max(240, 520 - runIndex * 8 - s * 20);
    const stagePool = s === 0 && pool.length > 1 ? pool.slice(0, pool.length - 1) : pool;
    stages.push(wave(stagePool, count, interval));
  }

  const bossTex = t.bossPool[runIndex % t.bossPool.length];
  const bossHp = Math.round(500 + islandIndex * 820 + runIndex * 240);
  const bossDmg = Math.round(16 + islandIndex * 6 + runIndex * 1.4);
  const bossRadius = Math.min(70, (BOSS_RADIUS[bossTex] ?? 52) + Math.min(islandIndex * 1.5, 12));

  return {
    id: islandIndex * 100 + runIndex,
    islandIndex,
    runIndex,
    name: `${t.name} · ${runIndex + 1}판`,
    vehicle: t.vehicle,
    bgTop: t.bgTop,
    bgBottom: t.bgBottom,
    difficulty,
    waves: stages,
    boss: { id: bossTex, name: BOSS_NAMES[bossTex] ?? '보스', color: COLORS.boss, texture: bossTex, hp: bossHp, speed: 48, damage: bossDmg, xp: 0, radius: bossRadius, gold: 0 },
    reward: Math.round(40 + islandIndex * 55 + runIndex * 18),
  };
}
