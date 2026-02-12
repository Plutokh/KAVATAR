export default class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    async create() {
        await document.fonts.load('60px "Ghanachocolate"');

        // Defensive Cleanup
        if (this.scene.get('GameScene').sys.isActive()) this.scene.stop('GameScene');
        if (this.scene.get('UIScene').sys.isActive()) this.scene.stop('UIScene');

        this.input.mouse.releasePointerLock();
        this.input.setDefaultCursor('default');

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background Image
        const bg = this.add.image(width / 2, height / 2, 'bg_title');
        bg.setDisplaySize(width, height);

        // Start Button (positioned in bottom-right brown space area)
        // Approximate position for 1920x1080: ~1650, 950
        const startBtn = this.add.text(1650, 950, 'START', {
            fontFamily: 'Ghanachocolate',
            fontSize: '60px',
            color: '#deb989',
            stroke: '#3E2723',
            strokeThickness: 4,
            padding: { x: 30, y: 15 }
        }).setOrigin(0.5).setInteractive().setScale(1.0); // 150% size

        // Hover effect
        startBtn.on('pointerover', () => {
            startBtn.setStyle({ color: '#a8875b' }); // Gold on hover (preserves fontFamily)
            startBtn.setScale(1.0); // 1.5 base * 1.1 hover
        });

        startBtn.on('pointerout', () => {
            startBtn.setStyle({ color: '#deb989' }); // Beige default (preserves fontFamily)
            startBtn.setScale(1.0); // Back to 150% base
        });

        // Start game on click (default to Map 1: KAIST)
        startBtn.on('pointerdown', () => {
            this.startGame(1);
        });

        // Continue Button (Only if Save Exists)
        const SaveManager = (await import('../utils/SaveManager.js')).default;
        if (SaveManager.hasSave()) {
            console.log("Save Found. Adding Continue Button.");
            const continueBtn = this.add.text(1650, 1020, 'CONTINUE', { // Position below START
                fontFamily: 'Ghanachocolate',
                fontSize: '40px',
                color: '#deb989',
                stroke: '#3E2723',
                strokeThickness: 4,
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setInteractive();

            continueBtn.on('pointerover', () => {
                continueBtn.setStyle({ color: '#a8875b' });
                continueBtn.setScale(1.1);
            });

            continueBtn.on('pointerout', () => {
                continueBtn.setStyle({ color: '#deb989' });
                continueBtn.setScale(1.0);
            });

            continueBtn.on('pointerdown', () => {
                console.log("Continue Clicked");
                this.scene.start('GameScene', { loadGame: true });
            });
        }
    }

    createCard(x, y, mapData) {
        const container = this.add.container(x, y);

        // Card Background
        const bg = this.add.graphics();
        bg.fillStyle(0x222222, 1);
        bg.lineStyle(2, 0x444444, 1);
        bg.fillRoundedRect(-175, -225, 350, 450, 15); // Adjusted for new size
        bg.strokeRoundedRect(-175, -225, 350, 450, 15);
        container.add(bg);

        // Preview Area Background
        const previewBg = this.add.graphics();
        previewBg.fillStyle(0x111111, 1);
        previewBg.fillRoundedRect(-175, -225, 350, 300, 15); // Adjusted
        container.add(previewBg);

        // Draw Mini Map Preview
        const preview = this.add.graphics();
        this.drawMapPreview(preview, mapData.type);
        container.add(preview);

        // Map Title
        const titleText = this.add.text(0, 120, mapData.title, {
            fontFamily: 'Ghanachocolate', fontSize: '36px', color: '#ffffff'
        }).setOrigin(0.5);
        container.add(titleText);

        // Start Button visual (fake button inside card)
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0xffffff, 0.1);
        btnBg.fillRoundedRect(-80, 160, 160, 40, 20);
        container.add(btnBg);

        const btnText = this.add.text(0, 180, 'START', {
            fontFamily: 'Ghanachocolate', fontSize: '20px', color: '#ffffff'
        }).setOrigin(0.5);
        container.add(btnText);

        // Interactivity
        const hitArea = new Phaser.Geom.Rectangle(-175, -225, 350, 450);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        container.on('pointerover', () => {
            this.tweens.add({
                targets: container,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100,
                ease: 'Sine.easeInOut'
            });
            bg.clear();
            bg.fillStyle(0x333333, 1); // Lighter BG
            bg.lineStyle(2, mapData.color, 1); // Colored Border
            bg.fillRoundedRect(-175, -225, 350, 450, 15);
            bg.strokeRoundedRect(-175, -225, 350, 450, 15);
        });

        container.on('pointerout', () => {
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 100,
                ease: 'Sine.easeInOut'
            });
            bg.clear();
            bg.fillStyle(0x222222, 1);
            bg.lineStyle(2, 0x444444, 1);
            bg.fillRoundedRect(-175, -225, 350, 450, 15);
            bg.strokeRoundedRect(-175, -225, 350, 450, 15);
        });

        container.on('pointerdown', () => {
            this.startGame(mapData.id);
        });
    }

    drawMapPreview(graphics, type) {
        const hexSize = 5; // Very small size for preview
        const w = Math.sqrt(3) * hexSize;
        const h = 2 * hexSize;
        const hDist = w;
        const vDist = h * 0.75;

        // Colors
        const tileColor = 0x555555;

        // Helper
        const drawHex = (q, r, color) => {
            const x = hDist * (q + r / 2);
            const y = vDist * r;

            graphics.fillStyle(color, 1);
            const points = [];
            for (let i = 0; i < 6; i++) {
                const angle = 2 * Math.PI / 6 * (i + 0.5);
                points.push({
                    x: x + hexSize * Math.cos(angle),
                    y: y + hexSize * Math.sin(angle)
                });
            }
            graphics.fillPoints(points, true);
        };

        // Offsets to center the maps in the preview window (approximate visual centers)
        let offsetX = 0;
        let offsetY = -50;

        graphics.save();

        if (type === 'KAIST') {
            // Map 1: KAIST (Exact Coordinates from HexGrid.js)
            const mapData = [
                { q: -9, r: 7 }, { q: -8, r: 7 }, { q: -7, r: 7 }, { q: -6, r: 7 }, { q: -5, r: 6 }, { q: -4, r: 6 }, { q: -3, r: 6 }, { q: -2, r: 6 }, { q: -1, r: 6 },
                { q: 0, r: 5 }, { q: 1, r: 5 }, { q: 3, r: 5 }, { q: 2, r: 5 }, { q: 4, r: 5 }, { q: 5, r: 5 }, { q: 5, r: 4 }, { q: 4, r: 4 }, { q: 3, r: 4 },
                { q: 2, r: 4 }, { q: 1, r: 4 }, { q: 0, r: 4 }, { q: -1, r: 5 }, { q: -2, r: 5 }, { q: -3, r: 5 }, { q: -4, r: 5 }, { q: -5, r: 5 }, { q: -6, r: 6 },
                { q: -7, r: 6 }, { q: -10, r: 8 }, { q: -10, r: 7 }, { q: -10, r: 6 }, { q: -9, r: 5 }, { q: -9, r: 4 }, { q: -9, r: 3 }, { q: -9, r: 2 }, { q: -8, r: 1 },
                { q: -7, r: 0 }, { q: -6, r: 0 }, { q: -5, r: 0 }, { q: -5, r: -1 }, { q: -4, r: -1 }, { q: -4, r: -2 }, { q: -3, r: -3 }, { q: -2, r: -4 }, { q: -1, r: -5 },
                { q: 0, r: -6 }, { q: 1, r: -6 }, { q: 1, r: -5 }, { q: 2, r: -5 }, { q: 2, r: -4 }, { q: 2, r: -3 }, { q: 3, r: -3 }, { q: 3, r: -2 }, { q: 4, r: -2 },
                { q: 4, r: -1 }, { q: 5, r: -2 }, { q: 5, r: -1 }, { q: 6, r: -1 }, { q: 6, r: 0 }, { q: 6, r: 1 }, { q: 5, r: 2 }, { q: 4, r: 3 }, { q: -8, r: 6 },
                { q: -9, r: 6 }, { q: -8, r: 5 }, { q: -7, r: 5 }, { q: -6, r: 5 }, { q: -7, r: 4 }, { q: -8, r: 4 }, { q: -8, r: 3 }, { q: -7, r: 3 }, { q: -8, r: 2 },
                { q: -7, r: 2 }, { q: -7, r: 1 }, { q: -6, r: 1 }, { q: -5, r: 1 }, { q: -6, r: 2 }, { q: -6, r: 3 }, { q: -6, r: 4 }, { q: -5, r: 4 }, { q: -4, r: 4 },
                { q: -3, r: 4 }, { q: -2, r: 4 }, { q: -1, r: 4 }, { q: 1, r: 3 }, { q: 2, r: 3 }, { q: 3, r: 3 }, { q: 4, r: 2 }, { q: 5, r: 1 }, { q: 5, r: 0 },
                { q: 0, r: 3 },
                { q: 0, r: -5 }, { q: -1, r: -4 }, { q: 0, r: -4 }, { q: 1, r: -4 }, { q: -2, r: -3 }, { q: -1, r: -3 }, { q: 0, r: -3 }, { q: 1, r: -3 }, { q: -3, r: -2 },
                { q: -2, r: -2 }, { q: -1, r: -2 }, { q: 0, r: -2 }, { q: 1, r: -2 }, { q: 2, r: -2 }, { q: -3, r: -1 }, { q: -2, r: -1 }, { q: -1, r: -1 }, { q: 0, r: -1 },
                { q: 0, r: 0 }, { q: 1, r: -1 }, { q: 1, r: 0 }, { q: 2, r: -1 }, { q: 2, r: 0 }, { q: 3, r: 0 }, { q: 3, r: -1 }, { q: 4, r: 0 }, { q: 4, r: 1 },
                { q: 3, r: 2 }, { q: 2, r: 2 }, { q: 1, r: 2 }, { q: 1, r: 1 }, { q: 2, r: 1 }, { q: 3, r: 1 }, { q: 0, r: 1 }, { q: -1, r: 2 }, { q: -2, r: 3 },
                { q: -3, r: 3 }, { q: -3, r: 2 }, { q: -2, r: 2 }, { q: 0, r: 2 }, { q: -1, r: 3 }, { q: -4, r: 2 }, { q: -4, r: 1 }, { q: -4, r: 0 }, { q: -5, r: 2 },
                { q: -5, r: 3 }, { q: -4, r: 3 }, { q: -3, r: 1 }, { q: -2, r: 0 }, { q: -1, r: 0 }, { q: -2, r: 1 }, { q: -1, r: 1 }, { q: -3, r: 0 }, { q: -5, r: 7 },
                { q: -4, r: 7 }, { q: -3, r: 7 }, { q: 0, r: 6 }, { q: 1, r: 6 }, { q: 2, r: 6 }, { q: -2, r: 7 }
            ];

            graphics.translateCanvas(offsetX + 25, offsetY - 30); // Adjust for map shape
            graphics.scaleCanvas(1.3, 1.3); // Fit card (Larger)
            mapData.forEach(t => drawHex(t.q, t.r, 0x3366ff));
        }
        else if (type === 'HEX') {
            // Map 2: Irregular Hexagon (Row Lengths)
            graphics.translateCanvas(offsetX, offsetY);
            const rowLengths = [3, 6, 9, 10, 11, 10, 11, 10, 11, 10, 9, 6, 3];
            const rStart = -6;

            for (let i = 0; i < rowLengths.length; i++) {
                const r = rStart + i;
                const count = rowLengths[i];
                const centerQ = -r / 2.0;
                const startQ = Math.ceil(centerQ - count / 2.0);

                for (let k = 0; k < count; k++) {
                    const q = startQ + k;
                    drawHex(q, r, 0xffcc00);
                }
            }
        }
        else if (type === 'BIG_HEX') {
            // Map 3: Radius 6 Regular Hexagon
            graphics.translateCanvas(offsetX, offsetY);
            graphics.scaleCanvas(0.9, 0.9);
            const radius = 6;
            for (let q = -radius; q <= radius; q++) {
                let r1 = Math.max(-radius, -q - radius);
                let r2 = Math.min(radius, -q + radius);
                for (let r = r1; r <= r2; r++) {
                    drawHex(q, r, 0xff3333);
                }
            }
        }

        graphics.restore();
    }

    startGame(mapId) {
        console.log(`Starting Game with Map ID: ${mapId}`);
        this.scene.start('GameScene', { mapId: mapId });
    }
}
