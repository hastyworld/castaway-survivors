// ============================================================
// characters.ts — 플레이 가능한 캐릭터 + 영구 진화(정체성)
// 캐릭터마다: 시작 무기 + 고유 스탯 성향 + 3단계 영구 진화.
// 진화는 골드로 구매(save.ts에 저장)하며 외형(art.ts 텍스처)도 바뀝니다.
// ============================================================
import { CharId, WeaponId } from './config';
import { load, save } from './save';

// 진화 단계 하나 (0단계 = 기본 모습)
export interface CharStage {
  name: string; // 이 단계의 칭호 (정체성)
  cost: number; // 이 단계로 진화하는 비용 (0단계는 0)
}

export interface CharDef {
  id: CharId;
  name: string;
  identity: string; // 한 줄 컨셉
  desc: string; // 고유 특성 설명
  unlockCost: number; // 캐릭터 해금 골드 (기본 캐릭터는 0)
  startWeapon: WeaponId;
  // 기본 성향(1 = 보통). 판 시작 시 플레이어 스탯에 곱/합산.
  base: {
    hpMult: number;
    powerMult: number;
    speedMult: number;
    hasteMult: number; // 작을수록 공격 빠름
    pickupBonus: number;
    regen: number; // 초당 회복
  };
  // 진화 1단계당 추가되는 고유 보너스 (캐릭터 정체성 강화)
  perStage: {
    hpMult?: number;
    powerMult?: number;
    speedMult?: number;
    hasteMult?: number;
    pickupBonus?: number;
    regen?: number;
  };
  perStageDesc: string; // 진화 보너스 설명 (UI용)
  stages: [CharStage, CharStage, CharStage];
}

export const MAX_STAGE = 2; // 0,1,2 → 총 3단계

export const CHARACTERS: CharDef[] = [
  {
    id: 'castaway',
    name: '표류자',
    identity: '균형 잡힌 만능 생존자',
    desc: '시작 무기: 야자열매 · 모든 능력이 고르게 성장',
    unlockCost: 0,
    startWeapon: 'coconut',
    base: { hpMult: 1, powerMult: 1, speedMult: 1, hasteMult: 1, pickupBonus: 0, regen: 0 },
    perStage: { hpMult: 0.08, powerMult: 0.08, speedMult: 0.04 },
    perStageDesc: '진화당 체력 +8% · 피해 +8% · 이동 +4%',
    stages: [
      { name: '표류자', cost: 0 },
      { name: '개척자', cost: 500 },
      { name: '섬의 왕', cost: 1500 },
    ],
  },
  {
    id: 'fisher',
    name: '작살잡이',
    identity: '빠른 손놀림의 바다 사냥꾼',
    desc: '시작 무기: 불가사리 표창 · 공격속도 +8% · 획득범위 +30',
    unlockCost: 400,
    startWeapon: 'starfish',
    base: { hpMult: 0.95, powerMult: 1, speedMult: 1.03, hasteMult: 0.92, pickupBonus: 30, regen: 0 },
    perStage: { hasteMult: -0.06, pickupBonus: 30 },
    perStageDesc: '진화당 공격속도 +6% · 획득범위 +30',
    stages: [
      { name: '작살잡이', cost: 0 },
      { name: '작살 명인', cost: 600 },
      { name: '심해 사냥꾼', cost: 1800 },
    ],
  },
  {
    id: 'pirate',
    name: '불의 해적',
    identity: '몸으로 밀어붙이는 화력덩어리',
    desc: '시작 무기: 모닥불 · 피해 +20% · 체력 +15% · 이동 -8%',
    unlockCost: 800,
    startWeapon: 'campfire',
    base: { hpMult: 1.15, powerMult: 1.2, speedMult: 0.92, hasteMult: 1, pickupBonus: 0, regen: 0 },
    perStage: { powerMult: 0.12, hpMult: 0.05 },
    perStageDesc: '진화당 피해 +12% · 체력 +5%',
    stages: [
      { name: '불의 해적', cost: 0 },
      { name: '화염 선장', cost: 700 },
      { name: '불꽃의 제왕', cost: 2000 },
    ],
  },
  {
    id: 'shaman',
    name: '섬의 주술사',
    identity: '스스로 회복하는 불사의 존재',
    desc: '시작 무기: 야자열매 · 초당 체력 +1.2 회복 · 체력 -10%',
    unlockCost: 1200,
    startWeapon: 'coconut',
    base: { hpMult: 0.9, powerMult: 1, speedMult: 1, hasteMult: 1, pickupBonus: 15, regen: 1.2 },
    perStage: { regen: 0.8, hpMult: 0.08 },
    perStageDesc: '진화당 초당회복 +0.8 · 체력 +8%',
    stages: [
      { name: '섬의 주술사', cost: 0 },
      { name: '정령 술사', cost: 800 },
      { name: '섬의 수호신', cost: 2200 },
    ],
  },
];

export function getChar(id: CharId): CharDef {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}

// ---------------- 저장 연동 헬퍼 ----------------

export function charStage(id: CharId): number {
  return load().chars[id]?.stage ?? 0;
}

export function isCharUnlocked(id: CharId): boolean {
  return id === 'castaway' || !!load().chars[id]?.unlocked;
}

export function selectedCharId(): CharId {
  const d = load();
  return isCharUnlocked(d.selectedChar) ? d.selectedChar : 'castaway';
}

export function selectChar(id: CharId): void {
  if (!isCharUnlocked(id)) return;
  const d = load();
  d.selectedChar = id;
  save(d);
}

// 해금 시도 → 성공 여부
export function unlockChar(id: CharId): boolean {
  const def = getChar(id);
  const d = load();
  if (isCharUnlocked(id) || d.gold < def.unlockCost) return false;
  d.gold -= def.unlockCost;
  d.chars[id] = { unlocked: true, stage: d.chars[id]?.stage ?? 0 };
  save(d);
  return true;
}

// 진화 시도 → 성공 여부
export function evolveChar(id: CharId): boolean {
  const def = getChar(id);
  const d = load();
  const cur = d.chars[id]?.stage ?? 0;
  if (!isCharUnlocked(id) || cur >= MAX_STAGE) return false;
  const cost = def.stages[cur + 1].cost;
  if (d.gold < cost) return false;
  d.gold -= cost;
  d.chars[id] = { unlocked: true, stage: cur + 1 };
  save(d);
  return true;
}

// 현재 선택 캐릭터의 텍스처 키 (art.ts 에서 hero_<id>_<stage> 로 생성됨)
export function heroTexture(id?: CharId, stage?: number): string {
  const cid = id ?? selectedCharId();
  const st = stage ?? charStage(cid);
  return `hero_${cid}_${st}`;
}

// 판 시작 시 플레이어에 적용할 최종 보정치 (기본 성향 + 진화 보너스)
export function charBonuses(id?: CharId) {
  const cid = id ?? selectedCharId();
  const def = getChar(cid);
  const st = charStage(cid);
  const p = def.perStage;
  return {
    hpMult: def.base.hpMult + (p.hpMult ?? 0) * st,
    powerMult: def.base.powerMult + (p.powerMult ?? 0) * st,
    speedMult: def.base.speedMult + (p.speedMult ?? 0) * st,
    hasteMult: Math.max(0.6, def.base.hasteMult + (p.hasteMult ?? 0) * st),
    pickupBonus: def.base.pickupBonus + (p.pickupBonus ?? 0) * st,
    regen: def.base.regen + (p.regen ?? 0) * st,
    startWeapon: def.startWeapon,
  };
}
