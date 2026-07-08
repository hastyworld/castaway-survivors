// ============================================================
// save.ts — 저장/불러오기 (localStorage)
// 판 밖 영구 성장(②) + 진행도 + 탈것 진화 상태를 보관합니다.
// 기획안 5번: 성장은 3겹으로 분리. 여기 저장되는 건 ②(영구)와 ③(탈것).
// ============================================================
import { VEHICLE_CHAIN, ISLAND_COUNT, RUNS_PER_ISLAND } from './content';

// 다음 섬을 열려면 현재 섬에서 이만큼 판을 깨야 함
const UNLOCK_THRESHOLD = 8;

const KEY = 'castaway_survivors_save_v1';

// 영구 특성(골드로 구매). 판 시작 시 플레이어 기본 스탯에 반영됩니다.
export type PermId = 'maxhp' | 'power' | 'speed' | 'magnet';

export interface PermUpgrade {
  id: PermId;
  name: string;
  desc: string;
  maxLevel: number;
  costBase: number; // 레벨당 비용 = costBase * (현재레벨+1)
}

export const PERM_UPGRADES: PermUpgrade[] = [
  { id: 'maxhp', name: '체력 단련', desc: '시작 최대 체력 +20', maxLevel: 10, costBase: 30 },
  { id: 'power', name: '기초 근력', desc: '기본 피해 +8%', maxLevel: 10, costBase: 40 },
  { id: 'speed', name: '생존 본능', desc: '기본 이동속도 +5%', maxLevel: 6, costBase: 35 },
  { id: 'magnet', name: '보물 감각', desc: '기본 획득범위 +20', maxLevel: 6, costBase: 25 },
];

export interface SaveData {
  gold: number;
  runsCleared: Record<number, number>; // 섬index → 클리어한 판 수 (0..RUNS_PER_ISLAND)
  perm: Record<PermId, number>; // 영구 특성 레벨
}

function fresh(): SaveData {
  return {
    gold: 0,
    runsCleared: {},
    perm: { maxhp: 0, power: 0, speed: 0, magnet: 0 },
  };
}

let cache: SaveData | null = null;

export function load(): SaveData {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      cache = {
        ...fresh(),
        ...parsed,
        perm: { ...fresh().perm, ...(parsed.perm ?? {}) },
        runsCleared: parsed.runsCleared ?? {},
      };
      return cache;
    }
  } catch (e) {
    console.warn('세이브 불러오기 실패, 새로 시작:', e);
  }
  cache = fresh();
  return cache;
}

export function save(data: SaveData): void {
  cache = data;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('세이브 저장 실패:', e);
  }
}

export function addGold(amount: number): void {
  const d = load();
  d.gold += Math.max(0, Math.round(amount));
  save(d);
}

// 판 클리어 기록: 그 판 인덱스 +1 만큼 진행됨
export function markRunCleared(island: number, run: number): void {
  const d = load();
  const cur = d.runsCleared[island] ?? 0;
  if (run + 1 > cur) {
    d.runsCleared[island] = Math.min(RUNS_PER_ISLAND, run + 1);
    save(d);
  }
}

export function runsClearedIn(island: number): number {
  return load().runsCleared[island] ?? 0;
}

// 섬 해금: 0번 항상, 그 외엔 직전 섬에서 UNLOCK_THRESHOLD 판 클리어
export function isIslandUnlocked(island: number): boolean {
  if (island <= 0) return true;
  return runsClearedIn(island - 1) >= UNLOCK_THRESHOLD;
}

// 판 해금: 섬이 열려있고, 이전 판까지 깼으면
export function isRunUnlocked(island: number, run: number): boolean {
  if (!isIslandUnlocked(island)) return false;
  return run <= runsClearedIn(island);
}

export function highestUnlockedIsland(): number {
  let h = 0;
  for (let i = 1; i < ISLAND_COUNT; i++) if (isIslandUnlocked(i)) h = i;
  return h;
}

// 현재 탈것(진화 상징 ③): 해금한 최고 섬 기준
export function currentVehicle(): string {
  return VEHICLE_CHAIN[Math.min(highestUnlockedIsland(), VEHICLE_CHAIN.length - 1)];
}

export function permCost(u: PermUpgrade, level: number): number {
  return u.costBase * (level + 1);
}

// 영구 특성이 판 시작 스탯에 주는 보정값
export function permBonuses() {
  const p = load().perm;
  return {
    maxHp: p.maxhp * 20,
    powerMult: 1 + p.power * 0.08,
    speedMult: 1 + p.speed * 0.05,
    pickup: p.magnet * 20,
  };
}

export function resetSave(): void {
  cache = fresh();
  save(cache);
}
