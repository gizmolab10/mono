import Phaser from 'phaser';
import { eventBridge } from '../Event_Bridge';
import { setupFade, setupResize, fadeToScene } from '../Scene_Utilities';

interface Gift {
  emoji: string;
  label: string;
}

const GIFTS: Gift[] = [
  { emoji: '🎁', label: 'a gift' },
  { emoji: '🌻', label: 'a flower' },
  { emoji: '☕', label: 'a warm drink' },
  { emoji: '📖', label: 'a story' },
  { emoji: '🎵', label: 'a song' },
];

const RECIPIENTS = [
  'a stranger who looks tired',
  'a child who seems lost',
  'someone sitting alone',
  'a neighbor you haven\'t met',
  'an elder crossing the road',
];

export class Kindness_Scene extends Phaser.Scene {
  private feedbackText!: Phaser.GameObjects.Text;
  private recipientText!: Phaser.GameObjects.Text;
  private currentRecipient = '';
  private giftsGiven = 0;
  private readonly giftsToWin = 3;

  constructor() {
    super({ key: 'KindnessScene' });
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.giftsGiven = 0;

    setupFade(this);
    setupResize(this);

    // title
    this.add.text(cx, 40, 'Kindness Exchange', {
      fontFamily: 'Georgia, serif',
      fontSize: '26px',
      color: '#c97b4b',
    }).setOrigin(0.5);

    // back button
    const back = this.add.text(30, 30, '← back', {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: '#a89880',
    }).setInteractive();
    back.on('pointerover', () => {
      back.setColor('#e0d8c8');
      this.input.setDefaultCursor('pointer');
    });
    back.on('pointerout', () => {
      back.setColor('#a89880');
      this.input.setDefaultCursor('default');
    });
    back.on('pointerdown', () => {
      fadeToScene(this, 'MapScene');
    });

    // prompt
    this.add.text(cx, cy - 120, 'You notice...', {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#a89880',
    }).setOrigin(0.5);

    // recipient
    this.recipientText = this.add.text(cx, cy - 85, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#e0d8c8',
    }).setOrigin(0.5);

    // instruction
    this.add.text(cx, cy - 40, 'drag a gift to them', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#b8b8d0',
    }).setOrigin(0.5);

    // drop zone
    const dropZone = this.add.rectangle(cx, cy + 20, 120, 60, 0x2a2a3e)
      .setStrokeStyle(2, 0x3a3a4e);
    this.add.text(cx, cy + 20, '↓ drop here', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#a8a8c0',
    }).setOrigin(0.5);

    // gifts
    const giftY = cy + 110;
    const giftSpacing = Math.min(70, (width - 40) / GIFTS.length);
    const startX = cx - ((GIFTS.length - 1) * giftSpacing) / 2;

    GIFTS.forEach((gift, i) => {
      const gx = startX + i * giftSpacing;
      const text = this.add.text(gx, giftY, gift.emoji, {
        fontSize: '36px',
      }).setOrigin(0.5).setInteractive({ draggable: true });

      const originX = gx;
      const originY = giftY;

      this.input.setDraggable(text);

      text.on('dragstart', () => {
        text.setScale(1.2);
      });

      text.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        text.setPosition(dragX, dragY);
      });

      text.on('dragend', () => {
        text.setScale(1);
        // check if dropped on the zone
        const bounds = dropZone.getBounds();
        if (bounds.contains(text.x, text.y)) {
          this.giveGift(gift, text);
        } else {
          // snap back
          this.tweens.add({ targets: text, x: originX, y: originY, duration: 200, ease: 'Sine.easeOut' });
        }
      });

    });

    // feedback
    this.feedbackText = this.add.text(cx, cy + 170, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#5b8a72',
    }).setOrigin(0.5);

    // progress
    this.add.text(cx, height - 40, `give ${this.giftsToWin} gifts to earn regard`, {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#a8a8c0',
    }).setOrigin(0.5);

    // start first round
    this.nextRecipient();
  }

  private nextRecipient() {
    this.currentRecipient = RECIPIENTS[Phaser.Math.Between(0, RECIPIENTS.length - 1)];
    this.recipientText.setText(this.currentRecipient);
  }

  private giveGift(gift: Gift, giftText: Phaser.GameObjects.Text) {
    this.giftsGiven++;

    // hide the used gift
    this.tweens.add({
      targets: giftText,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      duration: 300,
      ease: 'Sine.easeIn',
      onComplete: () => { giftText.setVisible(false); },
    });

    // feedback
    const messages = [
      `you gave ${gift.label}. they smiled.`,
      `${gift.label} — their eyes lit up.`,
      `a small kindness. ${gift.label} for ${this.currentRecipient}.`,
      `${gift.label}. they said thank you.`,
    ];
    this.feedbackText.setText(messages[Phaser.Math.Between(0, messages.length - 1)]);
    this.feedbackText.setAlpha(0);
    this.tweens.add({ targets: this.feedbackText, alpha: 1, duration: 400 });

    if (this.giftsGiven >= this.giftsToWin) {
      // win
      this.time.delayedCall(800, () => {
        eventBridge.emit('regard:earn', 5);
        this.feedbackText.setText('regard earned: +5');
        this.feedbackText.setColor('#c97b4b');
        this.time.delayedCall(1500, () => {
          fadeToScene(this, 'MapScene');
        });
      });
    } else {
      this.time.delayedCall(600, () => {
        this.nextRecipient();
      });
    }
  }
}
