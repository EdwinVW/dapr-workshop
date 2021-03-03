import { DebugScene } from './debugscene.js';
import { TrafficScene } from './trafficscene.js';
import { TestScene } from './testscene.js';

var phaserConfig = {
    type: Phaser.WEBGL,
    width: 1200,
    height: 600,
    backgroundColor: '#336023',
    parent: 'phaser',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: [ TrafficScene, DebugScene ]
};

new Phaser.Game(phaserConfig);