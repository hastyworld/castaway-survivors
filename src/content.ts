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
// 섬 스펙 표 — 여기에 한 줄 추가하면 섬이 늘어납니다.
interface IslandSpec {
  name: string;
  bgTop: number;
  bgBottom: number;
  difficulty: number;
  pool: string[]; // 등장 적 id
  bossName: string;
  bossTex: string;
  bossHp: number;
  bossDmg: number;
  bossRadius: number;
  reward: number;
}

// 탈것 진화 체인 (섬 클리어할수록)
export const VEHICLE_CHAIN = ['뗏목', '나룻배', '카누', '돛단배', '범선', '증기선', '쾌속정', '요트', '잠수함', '항공모함', '유령선', '전설의 방주'];

const ISLAND_SPECS: IslandSpec[] = [
  { name: '작은 모래섬', bgTop: COLORS.ocean, bgBottom: COLORS.sandDark, difficulty: 1.0, pool: ['bug', 'crab'], bossName: '왕집게게', bossTex: 'boss_kingcrab', bossHp: 650, bossDmg: 20, bossRadius: 46, reward: 60 },
  { name: '울창한 정글섬', bgTop: COLORS.ocean, bgBottom: COLORS.jungle, difficulty: 1.35, pool: ['crab', 'boar', 'bug'], bossName: '성난 멧돼지 왕', bossTex: 'boss_boarking', bossHp: 1050, bossDmg: 24, bossRadius: 50, reward: 95 },
  { name: '산호초 여울', bgTop: COLORS.ocean, bgBottom: COLORS.reef, difficulty: 1.7, pool: ['crab', 'jelly', 'boar'], bossName: '문어대왕', bossTex: 'boss_octopus', bossHp: 1550, bossDmg: 28, bossRadius: 52, reward: 135 },
  { name: '저주받은 해적 바다', bgTop: COLORS.oceanDark, bgBottom: COLORS.pirate, difficulty: 2.05, pool: ['ghost', 'pirate', 'jelly'], bossName: '저주받은 해적 선장', bossTex: 'boss_captain', bossHp: 2200, bossDmg: 32, bossRadius: 54, reward: 185 },
  { name: '짙은 늪지 섬', bgTop: COLORS.oceanDark, bgBottom: COLORS.swamp, difficulty: 2.4, pool: ['boar', 'jelly', 'eel'], bossName: '심해 대왕뱀', bossTex: 'boss_serpent', bossHp: 2900, bossDmg: 36, bossRadius: 56, reward: 250 },
  { name: '유령 안개해', bgTop: COLORS.abyss, bgBottom: COLORS.pirate, difficulty: 2.75, pool: ['ghost', 'eel', 'skeleton'], bossName: '유령 군주', bossTex: 'boss_lich', bossHp: 3600, bossDmg: 40, bossRadius: 56, reward: 330 },
  { name: '해골 해적항', bgTop: COLORS.oceanDark, bgBottom: COLORS.sunset, difficulty: 3.1, pool: ['pirate', 'skeleton', 'boar'], bossName: '심연의 왕집게게', bossTex: 'boss_kingcrab', bossHp: 4400, bossDmg: 44, bossRadius: 58, reward: 430 },
  { name: '끓는 화산섬', bgTop: COLORS.oceanDark, bgBottom: COLORS.volcano, difficulty: 3.45, pool: ['skeleton', 'eel', 'pirate'], bossName: '분노한 멧돼지 왕', bossTex: 'boss_boarking', bossHp: 5300, bossDmg: 48, bossRadius: 60, reward: 540 },
  { name: '심해 협곡', bgTop: COLORS.abyss, bgBottom: COLORS.reef, difficulty: 3.8, pool: ['jelly', 'eel', 'skeleton', 'ghost'], bossName: '심연의 문어', bossTex: 'boss_octopus', bossHp: 6300, bossDmg: 52, bossRadius: 60, reward: 670 },
  { name: '빙하 무덤', bgTop: COLORS.arctic, bgBottom: COLORS.abyss, difficulty: 4.2, pool: ['skeleton', 'ghost', 'pirate', 'boar'], bossName: '유령 해적 선장', bossTex: 'boss_captain', bossHp: 7400, bossDmg: 56, bossRadius: 62, reward: 820 },
  { name: '저주받은 심연', bgTop: COLORS.abyss, bgBottom: COLORS.volcano, difficulty: 4.6, pool: ['eel', 'skeleton', 'ghost', 'pirate'], bossName: '각성한 대왕뱀', bossTex: 'boss_serpent', bossHp: 8700, bossDmg: 62, bossRadius: 64, reward: 1000 },
  { name: '세상의 끝', bgTop: COLORS.abyss, bgBottom: COLORS.sunset, difficulty: 5.2, pool: ['skeleton', 'ghost', 'pirate', 'eel', 'boar'], bossName: '태초의 유령 군주', bossTex: 'boss_lich', bossHp: 10500, bossDmg: 70, bossRadius: 66, reward: 1300 },
];

export const ISLANDS: IslandDef[] = ISLAND_SPECS.map((s, id) => {
  const pool = s.pool;
  const lead = pool.length > 1 ? pool.slice(0, pool.length - 1) : pool;
  const iv = (n: number) => Math.max(240, n - id * 6); // 뒤 섬일수록 스폰 빨라짐
  return {
    id,
    name: s.name,
    vehicle: VEHICLE_CHAIN[id] ?? '방주',
    bgTop: s.bgTop,
    bgBottom: s.bgBottom,
    difficulty: s.difficulty,
    waves: [
      wave(lead, 16 + id, iv(520)),
      wave(pool, 22 + id, iv(460)),
      wave(pool, 26 + id, iv(410)),
      wave(pool, 32 + id, iv(360)),
    ],
    boss: { id: s.bossTex, name: s.bossName, color: COLORS.boss, texture: s.bossTex, hp: s.bossHp, speed: 48, damage: s.bossDmg, xp: 0, radius: s.bossRadius, gold: 0 },
    reward: s.reward,
  };
});

// 다음 섬으로 갈 때 진화하는 탈것 이름
export const NEXT_VEHICLE = VEHICLE_CHAIN.slice(1);
