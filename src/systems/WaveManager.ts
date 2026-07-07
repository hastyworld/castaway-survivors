// ============================================================
// WaveManager.ts — 웨이브 진행 (기획안 4번: 전멸 방식)
// 웨이브의 적을 전부 처치하면 다음 웨이브. 마지막 웨이브 뒤 보스.
// 보스를 잡으면 스테이지(섬) 클리어.
// ============================================================
import { ENEMIES } from '../content';
import { IslandDef } from '../config';
import type GameScene from '../scenes/GameScene';
import Enemy from '../entities/Enemy';
import { Sfx } from './Sfx';

const CONCURRENT_CAP = 80; // 동시에 살아있는 잡몹 상한(과부하 방지)

type Phase = 'wave' | 'boss' | 'done';

export default class WaveManager {
  private scene: GameScene;
  private island: IslandDef;
  phase: Phase = 'wave';
  waveIndex = 0;
  private spawnedInWave = 0;
  private spawnTimer = 0;
  private boss?: Enemy;

  constructor(scene: GameScene, island: IslandDef) {
    this.scene = scene;
    this.island = island;
  }

  get totalWaves(): number {
    return this.island.waves.length;
  }

  label(): string {
    if (this.phase === 'boss') return '⚠ 보스전';
    if (this.phase === 'done') return '클리어!';
    return `웨이브 ${this.waveIndex + 1} / ${this.totalWaves}`;
  }

  update(delta: number): void {
    if (this.phase === 'wave') this.updateWave(delta);
    else if (this.phase === 'boss') this.updateBoss();
  }

  private updateWave(delta: number): void {
    const wave = this.island.waves[this.waveIndex];
    const alive = this.scene.getActiveEnemies().length;

    // 스폰
    if (this.spawnedInWave < wave.count && alive < CONCURRENT_CAP) {
      this.spawnTimer -= delta;
      if (this.spawnTimer <= 0) {
        const id = wave.enemies[Math.floor(Math.random() * wave.enemies.length)];
        this.scene.spawnEnemy(ENEMIES[id], this.island.difficulty, false);
        this.spawnedInWave += 1;
        this.spawnTimer = wave.interval;
      }
    }

    // 전멸 판정: 다 뽑았고 + 다 죽음 → 다음 단계
    if (this.spawnedInWave >= wave.count && alive === 0) {
      if (this.waveIndex < this.totalWaves - 1) {
        this.waveIndex += 1;
        this.spawnedInWave = 0;
        this.spawnTimer = 0;
        Sfx.waveClear();
        this.scene.announce(this.label());
      } else {
        this.startBoss();
      }
    }
  }

  private startBoss(): void {
    this.phase = 'boss';
    this.scene.announce('⚠ 보스 출현!');
    this.boss = this.scene.spawnEnemy(this.island.boss, this.island.difficulty, true);
  }

  private updateBoss(): void {
    if (this.boss && !this.boss.active) {
      this.phase = 'done';
      this.scene.onVictory();
    }
  }
}
