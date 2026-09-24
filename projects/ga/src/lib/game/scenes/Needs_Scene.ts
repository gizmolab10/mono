import Phaser from 'phaser';
import { eventBridge } from '../Event_Bridge';
import { setupFade, setupResize, fadeToScene } from '../Scene_Utilities';

/**
 * Needs Spotter — surface community needs, vote on priorities.
 *
 * Shows the needs list. Player can vote on existing needs
 * or spot a new one. Voting earns small regard. Adding a need earns more.
 */

interface Need {
  id: string;
  text: string;
  votes: number;
  addedBy: string;
}

export class Needs_Scene extends Phaser.Scene {
  private needItems: { need: Need; bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text; voteText: Phaser.GameObjects.Text }[] = [];
  private feedbackText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'NeedsScene' });
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.needItems = [];

    setupFade(this);
    setupResize(this);

    // title
    this.add.text(cx, 40, 'Needs Spotter', {
      fontFamily: 'Georgia, serif',
      fontSize: '26px',
      color: '#8a78b0',
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
    this.add.text(cx, 75, 'click a need to upvote it — every voice matters', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#b8b8d0',
    }).setOrigin(0.5);

    // feedback
    this.feedbackText = this.add.text(cx, height - 50, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: '#8a78b0',
    }).setOrigin(0.5);

    // listen first, then request
    const unsubData = eventBridge.on('needs:data', (data) => {
      this.renderNeeds(data as Need[], cx);
      unsubData();
    });
    eventBridge.emit('needs:request');

    // listen for refresh (after adding a new need)
    const unsubRefresh = eventBridge.on('needs:refresh', () => {
      this.scene.restart();
    });

    this.events.on('shutdown', () => {
      unsubRefresh();
      this.input.setDefaultCursor('default');
    });
  }

  private renderNeeds(needsList: Need[], cx: number) {
    // sort by votes descending
    const sorted = [...needsList].sort((a, b) => b.votes - a.votes);

    const startY = 110;
    const rowHeight = 52;
    const rowWidth = Math.min(500, this.scale.width - 60);

    sorted.forEach((need, i) => {
      const y = startY + i * rowHeight;

      const bg = this.add.rectangle(cx, y, rowWidth, 42, 0x2a2a3e)
        .setStrokeStyle(1, 0x3a3a4e)
        .setInteractive();

      const text = this.add.text(cx - rowWidth / 2 + 16, y, need.text, {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#e0d8c8',
        wordWrap: { width: rowWidth - 80 },
      }).setOrigin(0, 0.5);

      const voteText = this.add.text(cx + rowWidth / 2 - 16, y, `▲ ${need.votes}`, {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#8a78b0',
      }).setOrigin(1, 0.5);

      // hover
      bg.on('pointerover', () => {
        bg.setStrokeStyle(2, 0x6b5b8a);
        this.input.setDefaultCursor('pointer');
      });
      bg.on('pointerout', () => {
        bg.setStrokeStyle(1, 0x3a3a4e);
        this.input.setDefaultCursor('default');
      });

      // vote on click
      bg.on('pointerdown', () => {
        eventBridge.emit('needs:vote', need.id);
        eventBridge.emit('regard:earn', 1);

        // animate
        need.votes++;
        voteText.setText(`▲ ${need.votes}`);
        this.tweens.add({ targets: voteText, scaleX: 1.3, scaleY: 1.3, duration: 150, yoyo: true, ease: 'Sine.easeOut' });
        bg.setFillStyle(0x3a3a5e);
        this.time.delayedCall(200, () => bg.setFillStyle(0x2a2a3e));

        this.feedbackText.setText('your voice was heard. +1 regard');
        this.feedbackText.setAlpha(0);
        this.tweens.add({ targets: this.feedbackText, alpha: 1, duration: 300 });
        this.time.delayedCall(1500, () => {
          this.tweens.add({ targets: this.feedbackText, alpha: 0, duration: 300 });
        });
      });

      this.needItems.push({ need, bg, text, voteText });
    });

    // "spot a new need" button
    const buttonY = startY + sorted.length * rowHeight + 20;
    const btn = this.add.text(cx, buttonY, '+ spot a new need', {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: '#8a78b0',
    }).setOrigin(0.5).setInteractive();

    btn.on('pointerover', () => { btn.setColor('#8070a8'); this.input.setDefaultCursor('pointer'); });
    btn.on('pointerout', () => { btn.setColor('#8a78b0'); this.input.setDefaultCursor('default'); });
    btn.on('pointerdown', () => {
      // emit to Svelte to show an input prompt
      eventBridge.emit('needs:prompt-add');
    });
  }
}
