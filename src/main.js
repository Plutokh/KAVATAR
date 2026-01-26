import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';


const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    backgroundColor: '#000000',
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    dom: {
        createContainer: true
    },
    resolution: window.devicePixelRatio, // High DPI Text Fix
    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: true // Snap to integers for sharp text
    },
    scene: [BootScene, TitleScene, GameScene, UIScene]
};

const game = new Phaser.Game(config);
