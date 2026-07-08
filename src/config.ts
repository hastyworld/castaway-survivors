// ============================================================
// config.ts — 게임 전역 상수 / 색상 / 밸런스 수치 / 공용 타입
// 밸런싱은 되도록 이 파일과 content.ts 안에서만 만지면 됩니다.
// ============================================================

// 세로 화면 (9:16). 기획안 8번: 뱀서라이크는 한 손 세로 플레이 권장.
export const GAME_WIDTH = 540;
export const GAME_HEIGHT = 960;

// HUD(상단 정보바) 높이 — 이 아래가 실제 플레이 영역
export const HUD_HEIGHT = 96;

// 하단 조작 세이프존 높이 (구 고정아레나용; 스크롤 월드에선 미사용이지만 상수 유지)
export const BOTTOM_MARGIN = 150;

// 스크롤 월드 크기 — 화면보다 훨씬 넓은 무인도. 카메라가 플레이어를 따라감.
export const WORLD_W = 2000;
export const WORLD_H = 2000;

// 색상 팔레트 (무인도/바다 톤). 하드코딩 대신 여기서 가져다 씁니다.
export const COLORS = {
  ocean: 0x0d3b5c, // 깊은 바다
  oceanDark: 0x071a2b,
  sand: 0xf4d9a0, // 모래
  sandDark: 0xe0b877,
  jungle: 0x1f5e3a, // 정글
  pirate: 0x3a2b4d, // 해적 바다(보라빛)

  player: 0x8fd3ff, // 주인공
  playerRing: 0xffffff,

  bug: 0xd76b6b, // 벌레
  crab: 0xff9a52, // 게
  boar: 0x9c6b45, // 멧돼지
  ghost: 0xc7b8ff, // 유령
  pirate_enemy: 0x6b7280, // 해적
  jelly: 0xff9ecf, // 해파리
  eel: 0x4bbf9a, // 바다뱀
  skeleton: 0xe8e4d8, // 해골
  boss: 0xff4d6d, // 보스

  // 섬 배경 테마용
  swamp: 0x3b4a2a, // 늪지
  volcano: 0x5a2a2a, // 화산
  arctic: 0x3a5a6a, // 빙하
  abyss: 0x1a1030, // 심연
  sunset: 0x5a3a4a, // 노을
  reef: 0x1f6e6a, // 산호초

  coconut: 0x6b4a2b, // 야자열매(기본 무기)
  starfish: 0xffcf4d, // 불가사리(관통)
  campfire: 0xff7a3c, // 모닥불(오라)

  xp: 0x64e2a0, // 경험치 젬
  gold: 0xffd45e, // 골드
  hp: 0x4de07a, // 체력바
  hpBack: 0x2a2a2a,
  xpBar: 0x64c8ff,

  text: 0xffffff,
  textDim: 0xbfd4e0,
  panel: 0x0f2a3f,
  panelBorder: 0x2b5e82,
  accent: 0xffd45e, // 포인트색(골드)
  danger: 0xff5a5a,
} as const;

// 공용 문자열 색상(텍스트/스타일용)
export const CSS = {
  text: '#ffffff',
  textDim: '#bfd4e0',
  accent: '#ffd45e',
  danger: '#ff5a5a',
  green: '#4de07a',
};

export const FONT = 'Arial, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

// ---------------- 공용 타입 ----------------

export type WeaponId = 'coconut' | 'starfish' | 'campfire';
export type PassiveId = 'maxhp' | 'power' | 'speed' | 'haste' | 'magnet' | 'regen';

export interface EnemyDef {
  id: string;
  name: string;
  color: number; // 파티클/보조 색
  texture: string; // 스프라이트 텍스처 키 (art.ts)
  hp: number;
  speed: number;
  damage: number;
  xp: number;
  radius: number; // 표시 반지름(px)
  gold?: number;
}

export interface WaveDef {
  enemies: string[]; // 이 웨이브에서 등장할 적 id들
  count: number; // 총 스폰 수
  interval: number; // 스폰 간격(ms)
}

// IslandDef = 한 '판(run)' 설정. waves = 그 판의 스테이지들(전멸→다음).
export interface IslandDef {
  id: number;
  islandIndex: number; // 몇 번째 섬
  runIndex: number; // 섬 안 몇 번째 판
  name: string;
  vehicle: string;
  bgTop: number;
  bgBottom: number;
  difficulty: number; // 적 능력치 배수
  waves: WaveDef[]; // 스테이지들
  boss: EnemyDef;
  reward: number; // 클리어 골드
}

// 무기 정의(설명/최대레벨). 실제 성능은 systems/Weapons.ts 에서 레벨로 계산.
export interface WeaponDef {
  id: WeaponId;
  name: string;
  desc: string;
  maxLevel: number;
}

export interface PassiveDef {
  id: PassiveId;
  name: string;
  desc: string;
  maxLevel: number;
}
