import Phaser from 'phaser';

export class Boot_Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    const { width, height } = this.scale;

    // carnival tent shape — a warm triangle
    const tent = this.add.triangle(
      width / 2, height / 2 - 40,
      0, 120,
      80, 0,
      160, 120,
      0xc97b4b
    );
    tent.setStrokeStyle(3, 0xe0d8c8);

    // ground line
    this.add.rectangle(width / 2, height / 2 + 22, 200, 4, 0x6b5b4e);

    // title text
    this.add.text(width / 2, height / 2 + 60, 'Civilization 2.0', {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      color: '#e0d8c8',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 95, 'the carnival', {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#8b7d6b',
    }).setOrigin(0.5);

    // reposition on resize
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      const cx = gameSize.width / 2;
      const cy = gameSize.height / 2;
      tent.setPosition(cx, cy - 40);
      // triangle vertices stay relative to position
    });
  }
}
