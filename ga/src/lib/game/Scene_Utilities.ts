import Phaser from 'phaser';

const FADE_MS = 150;
const FADE_R = 26;
const FADE_G = 26;
const FADE_B = 46;
const RESIZE_DEBOUNCE_MS = 50;

/** Fade in unless this is a resize restart. */
export function setupFade(scene: Phaser.Scene) {
  if (!scene.data.get('skipFade')) {
    scene.cameras.main.fadeIn(FADE_MS, FADE_R, FADE_G, FADE_B);
  }
  scene.data.remove('skipFade');
}

/** Debounced resize → scene restart. Cleans up on shutdown. */
export function setupResize(scene: Phaser.Scene) {
  let timer: ReturnType<typeof setTimeout>;
  const onResize = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      scene.data.set('skipFade', true);
      scene.scene.restart();
    }, RESIZE_DEBOUNCE_MS);
  };
  scene.scale.on('resize', onResize);
  scene.events.on('shutdown', () => {
    clearTimeout(timer);
    scene.scale.off('resize', onResize);
  });
}

/** Fade out then start a target scene. Resets cursor. */
export function fadeToScene(scene: Phaser.Scene, target: string) {
  scene.input.setDefaultCursor('default');
  scene.cameras.main.fadeOut(FADE_MS, FADE_R, FADE_G, FADE_B);
  scene.cameras.main.once('camerafadeoutcomplete', () => {
    scene.scene.start(target);
  });
}
