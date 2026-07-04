import { defineConfig } from 'vite';

// base: './' → Capacitor(모바일 앱 포장) 에서 상대경로로 에셋을 찾게 해줌
// server.host: true → 같은 와이파이의 휴대폰에서도 접속해 실기기 테스트 가능
export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
});
