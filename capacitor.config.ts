/// <reference types="@capacitor/cli" />
// ============================================================
// capacitor.config.ts — 모바일(안드로이드/iOS) 앱 포장 설정
// ⚠ 아직 사용 안 함. 기획안 10단계(모바일 빌드)에서 Capacitor 설치 후 사용.
//    설치 방법은 README.md 의 "구글 플레이 출시 준비" 참고.
// ============================================================
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.castaway.survivors', // 실제 출시 시 본인 도메인 역순으로 변경
  appName: '표류 서바이버',
  webDir: 'dist', // vite build 결과물
  android: {
    backgroundColor: '#071a2b',
  },
};

export default config;
