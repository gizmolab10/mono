import Phaser from 'phaser';
import { Map_Scene } from './scenes/Map_Scene';
import { Kindness_Scene } from './scenes/Kindness_Scene';
import { Trust_Scene } from './scenes/Trust_Scene';
import { Needs_Scene } from './scenes/Needs_Scene';

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#1a1a2e',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [Map_Scene, Kindness_Scene, Trust_Scene, Needs_Scene],
  };
}
