import Phaser from 'phaser';
import { eventBridge } from '../Event_Bridge';
import { setupFade, setupResize, fadeToScene } from '../Scene_Utilities';

interface BoothZone {
  id: string;
  label: string;
  x: number;
  y: number;
  color: number;
  hoverColor: number;
}

// x/y are fractions of half-width / half-height, applied at runtime
const BOOTHS: BoothZone[] = [
  { id: 'kindness', label: 'Kindness\nExchange', x: -0.45, y: -0.15, color: 0xc97b4b, hoverColor: 0xe09060 },
  { id: 'trust', label: 'Trust\nCircle', x: 0, y: -0.3, color: 0x5b8a72, hoverColor: 0x70a888 },
  { id: 'needs', label: 'Needs\nSpotter', x: 0.45, y: -0.15, color: 0x6b5b8a, hoverColor: 0x8070a8 },
];

const SCENE_KEYS: Record<string, string> = {
  kindness: 'KindnessScene',
  trust: 'TrustScene',
  needs: 'NeedsScene',
};

const BASE_SIZE = 60;

function pentagonPoints(cx: number, cy: number, r: number): Phaser.Geom.Point[] {
  return Array.from({ length: 5 }, (_, i) => {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return new Phaser.Geom.Point(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
  });
}

function drawPent(gfx: Phaser.GameObjects.Graphics, pts: Phaser.Geom.Point[], color: number) {
  gfx.clear();
  gfx.fillStyle(color, 1);
  gfx.lineStyle(2, 0xe0d8c8, 1);
  gfx.beginPath();
  gfx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < 5; i++) gfx.lineTo(pts[i].x, pts[i].y);
  gfx.closePath();
  gfx.fillPath();
  gfx.strokePath();
}

export class Map_Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'MapScene' });
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    setupFade(this);
    setupResize(this);

    // ambient stars
    for (let i = 0; i < 30; i++) {
      const sx = Phaser.Math.Between(20, width - 20);
      const sy = Phaser.Math.Between(20, height - 20);
      const star = this.add.circle(sx, sy, Phaser.Math.Between(1, 2), 0xe0d8c8, 0.15);
      this.tweens.add({
        targets: star,
        alpha: { from: 0.05, to: Phaser.Math.FloatBetween(0.2, 0.5) },
        duration: Phaser.Math.Between(1500, 3500),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
        ease: 'Sine.easeInOut',
      });
    }

    const title = this.add.text(cx, Math.max(28, cy - 200), 'The Carnival', {
      fontFamily: 'Georgia, serif',
      fontSize: '32px',
      color: '#e0d8c8',
    }).setOrigin(0.5);

    // gentle title float
    this.tweens.add({
      targets: title,
      y: Math.max(33, cy - 195),
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add.rectangle(cx, cy + 30, width, 4, 0x3a3a4e);

    const spread = Math.min(width * 0.5, 440);
    const vspread = Math.min(height * 0.5, 400);
    const r = BASE_SIZE * Math.min(1, width / 600);

    BOOTHS.forEach(zone => {
      const tx = cx + zone.x * spread;
      const ty = cy + zone.y * vspread;

      const gfx = this.add.graphics();
      const pts = pentagonPoints(tx, ty, r);
      drawPent(gfx, pts, zone.color);

      const label = this.add.text(tx, ty, zone.label, {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#e0d8c8',
        align: 'center',
      }).setOrigin(0.5);

      gfx.setInteractive(
        new Phaser.Geom.Circle(tx, ty, r),
        Phaser.Geom.Circle.Contains
      );

      gfx.on('pointerover', () => {
        drawPent(gfx, pts, zone.hoverColor);
        this.tweens.add({ targets: label, scaleX: 1.05, scaleY: 1.05, duration: 150, ease: 'Sine.easeOut' });
        this.input.setDefaultCursor('pointer');
      });

      gfx.on('pointerout', () => {
        drawPent(gfx, pts, zone.color);
        this.tweens.add({ targets: label, scaleX: 1, scaleY: 1, duration: 150, ease: 'Sine.easeOut' });
        this.input.setDefaultCursor('default');
      });

      gfx.on('pointerdown', () => {
        fadeToScene(this, SCENE_KEYS[zone.id]);
      });
    });

    this.add.text(cx, cy + 80, 'click a tent to enter', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#b8b8d0',
    }).setOrigin(0.5);

    // listen for return-to-map
    const unsubscribe = eventBridge.on('map:return', () => {
      this.scene.start('MapScene');
    });

    this.events.on('shutdown', () => {
      unsubscribe();
      this.input.setDefaultCursor('default');
    });
  }
}
