import Phaser from 'phaser';
import { eventBridge } from '../Event_Bridge';
import { setupFade, setupResize, fadeToScene } from '../Scene_Utilities';

/**
 * Trust Circle — a memory game about reading people.
 *
 * Five faces appear in a circle. One is highlighted as "trustworthy."
 * The faces shuffle positions. Player picks who they trust.
 * Get it right 3 times → earn regard.
 */

const FACE_COLORS = [0xc9a96b, 0xa8836b, 0x8b6b5b, 0xd4b896, 0xb89878];
const CIRCLE_RADIUS = 120;

export class Trust_Scene extends Phaser.Scene {
  private faces: Phaser.GameObjects.Arc[] = [];
  private faceLabels: Phaser.GameObjects.Text[] = [];
  private trusteeIndex = 0;
  private roundsWon = 0;
  private readonly roundsToWin = 3;
  private feedbackText!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  private canPick = false;

  constructor() {
    super({ key: 'TrustScene' });
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.roundsWon = 0;
    this.canPick = false;

    setupFade(this);
    setupResize(this);

    // title
    this.add.text(cx, 40, 'Trust Circle', {
      fontFamily: 'Georgia, serif',
      fontSize: '26px',
      color: '#5b8a72',
    }).setOrigin(0.5);

    // back button
    const back = this.add.text(30, 30, '← back', {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: '#a89880',
    }).setInteractive();
    back.on('pointerover', () => { back.setColor('#e0d8c8'); this.input.setDefaultCursor('pointer'); });
    back.on('pointerout', () => { back.setColor('#a89880'); this.input.setDefaultCursor('default'); });
    back.on('pointerdown', () => {
      fadeToScene(this, 'MapScene');
    });

    // instructions
    this.add.text(cx, cy - 190, 'watch who glows, then find them after the shuffle', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#b8b8d0',
    }).setOrigin(0.5);

    // build faces in a circle
    const radius = Math.min(CIRCLE_RADIUS, (width - 100) / 2);
    this.faces = [];
    this.faceLabels = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const fx = cx + Math.cos(angle) * radius;
      const fy = cy + Math.sin(angle) * radius;

      const face = this.add.circle(fx, fy, 30, FACE_COLORS[i])
        .setStrokeStyle(2, 0x3a3a4e)
        .setInteractive();

      const label = this.add.text(fx, fy, String(i + 1), {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#1a1a2e',
      }).setOrigin(0.5);

      face.on('pointerover', () => {
        if (this.canPick) this.input.setDefaultCursor('pointer');
      });
      face.on('pointerout', () => {
        this.input.setDefaultCursor('default');
      });
      face.on('pointerdown', () => {
        if (!this.canPick) return;
        this.pickFace(i);
      });

      this.faces.push(face);
      this.faceLabels.push(label);
    }

    // feedback
    this.feedbackText = this.add.text(cx, cy + 180, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#5b8a72',
    }).setOrigin(0.5);

    // round counter
    this.roundText = this.add.text(cx, height - 40, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#a8a8c0',
    }).setOrigin(0.5);

    this.startRound();
  }

  private startRound() {
    this.canPick = false;
    this.updateRoundText();

    // pick a random trustee
    this.trusteeIndex = Phaser.Math.Between(0, 4);

    // highlight the trustee
    this.faces[this.trusteeIndex].setStrokeStyle(4, 0x5b8a72);
    this.feedbackText.setText('remember this one...');
    this.feedbackText.setColor('#b8b8d0');

    // after a pause, shuffle
    this.time.delayedCall(1500, () => {
      // remove highlight
      this.faces.forEach(f => f.setStrokeStyle(2, 0x3a3a4e));
      this.feedbackText.setText('shuffling...');
      this.shuffle();
    });
  }

  private shuffle() {
    // generate a random permutation of positions
    const positions = this.faces.map(f => ({ x: f.x, y: f.y }));
    const shuffled = Phaser.Utils.Array.Shuffle([...positions]);

    // animate each face and label to their new position
    this.faces.forEach((face, i) => {
      const target = shuffled[i];
      this.tweens.add({ targets: face, x: target.x, y: target.y, duration: 600, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: this.faceLabels[i], x: target.x, y: target.y, duration: 600, ease: 'Sine.easeInOut' });
    });

    this.time.delayedCall(700, () => {
      this.feedbackText.setText('who do you trust?');
      this.feedbackText.setColor('#a89880');
      this.canPick = true;
    });
  }

  private pickFace(index: number) {
    this.canPick = false;
    this.input.setDefaultCursor('default');

    if (index === this.trusteeIndex) {
      this.roundsWon++;
      this.faces[index].setStrokeStyle(4, 0x5b8a72);
      this.feedbackText.setText('yes! you remembered.');
      this.feedbackText.setColor('#5b8a72');

      if (this.roundsWon >= this.roundsToWin) {
        this.time.delayedCall(800, () => {
          eventBridge.emit('regard:earn', 5);
          this.feedbackText.setText('regard earned: +5');
          this.feedbackText.setColor('#c97b4b');
          this.time.delayedCall(1500, () => {
            fadeToScene(this, 'MapScene');
          });
        });
      } else {
        this.time.delayedCall(1000, () => this.startRound());
      }
    } else {
      this.faces[index].setStrokeStyle(4, 0x8b4b4b);
      this.faces[this.trusteeIndex].setStrokeStyle(4, 0x5b8a72);
      this.feedbackText.setText('not quite. try again.');
      this.feedbackText.setColor('#8b6b5b');
      this.time.delayedCall(1200, () => this.startRound());
    }

    this.updateRoundText();
  }

  private updateRoundText() {
    this.roundText.setText(`${this.roundsWon} / ${this.roundsToWin}`);
  }
}
