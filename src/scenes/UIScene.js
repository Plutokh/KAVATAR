export default class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
    }

    create() {
        this.gameScene = this.scene.get('GameScene');

        // Styles
        const style = { font: '32px Do Hyeon', fill: '#ffffff' }; // Increased from 24
        const buttonStyle = { font: '28px Do Hyeon', fill: '#000000', backgroundColor: '#eeeeee', padding: 10 }; // Increased from 20

        // 1. Status Bar (Top)
        this.statusText = this.add.text(this.cameras.main.width / 2, 70, 'Waiting...', { font: '30px Do Hyeon', fill: '#ffffff' }).setOrigin(0.5); // Moved down (30->70), Larger
        this.roundText = this.add.text(50, 30, 'ROUND 1', { font: '40px Do Hyeon', fill: '#ffffff' }); // Increased 32->40
        this.apText = this.add.text(this.cameras.main.width - 250, 30, 'AP: 0', style); // Adjusted X, Larger

        // 2. Tile Count Info (Below Round)
        this.tileCountText = this.add.text(50, 90, '', { font: '24px Do Hyeon', fill: '#cccccc' }); // Moved down slightly, Increased 18->24

        // 3. Action Panel (Bottom Right)
        const panelX = this.cameras.main.width - 220;
        const panelY = this.cameras.main.height - 350;

        this.recruitBtn = this.createButton(panelX, panelY, '징집 (1 AP)', () => this.gameScene.events.emit('actionRecruit'));
        this.fortifyBtn = this.createButton(panelX, panelY + 60, '요새화 (2 AP)', () => this.gameScene.events.emit('actionFortify'));
        this.purifyBtn = this.createButton(panelX, panelY + 120, '정화 (2 AP)', () => this.gameScene.events.emit('actionPurify'));
        this.purifyBtn.setVisible(false); // Hidden by default

        this.undoBtn = this.createButton(panelX, panelY + 180, '되돌리기', () => this.gameScene.events.emit('actionUndo'));
        this.endTurnBtn = this.createButton(panelX, panelY + 240, '턴 종료', () => this.gameScene.events.emit('actionEndTurn'));

        // Attack Cost Info (Interactive + Hover Text)
        const infoBg = this.add.rectangle(panelX + 110, panelY + 315, 220, 50, 0xeeeeee)
            .setInteractive()
            .setOrigin(0.5);

        const infoText = this.add.text(panelX + 25, panelY + 300, '공격/점령 (2 AP)', {
            fontFamily: 'Do Hyeon', fontSize: '28px', color: '#000000'
        });

        // Hover Effect on Text
        infoBg.on('pointerdown', () => console.log('Attack Info Clicked'))
            .on('pointerover', () => infoText.setStyle({ fill: '#0000ff' })) // Text turns Blue
            .on('pointerout', () => infoText.setStyle({ fill: '#000000' })); // Restore Black

        // Listen to updates
        this.gameScene.events.on('updateUI', () => this.updateUI());
        // Initial update
        this.time.delayedCall(100, () => this.updateUI());
    }

    createButton(x, y, text, callback) {
        const btn = this.add.text(x, y, text, {
            fontFamily: 'Do Hyeon', fontSize: '28px', color: '#000000', backgroundColor: '#eeeeee',
            padding: { x: 15, y: 15 }
        })
            .setInteractive()
            .on('pointerdown', callback)
            .on('pointerover', () => btn.setStyle({ fill: '#0000ff' }))
            .on('pointerout', () => btn.setStyle({ fill: '#000000' }));
        return btn;
    }

    updateUI() {
        if (!this.gameScene || !this.gameScene.gameManager) return;
        const gm = this.gameScene.gameManager;

        // Toggle Purify Button visibility
        if (gm.isPart2 && !this.purifyBtn.visible) {
            this.purifyBtn.setVisible(true);
        }

        const team = gm.getCurrentTeam();

        // Update Round
        this.roundText.setText(`ROUND ${gm.currentRound}`);

        // Update Status
        if (team) {
            this.statusText.setText(`현재 차례: ${team.name}`);
            this.statusText.setColor(this.getColorString(team.id));
            this.apText.setText(`AP: ${team.ap}`);
        } else {
            this.statusText.setText('AI Turn / Processing...');
            this.statusText.setColor('#ff0000'); // Phonics Red
        }

        // Update Tile Counts
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 9: 0, 0: 0 };
        let total = 0;
        gm.grid.getAllTiles().forEach(t => {
            counts[t.ownerID] = (counts[t.ownerID] || 0) + 1;
            total++;
        });

        let infoStr = `전체 칸: ${total}\n`;
        infoStr += `주황: ${counts[1]}\n`;
        infoStr += `노랑: ${counts[2]}\n`;
        infoStr += `초록: ${counts[3]}\n`;
        infoStr += `파랑: ${counts[4]}\n`;
        infoStr += `보라: ${counts[5]}\n`;
        if (counts[9] > 0) infoStr += `포닉스: ${counts[9]}\n`;

        this.tileCountText.setText(infoStr);
    }

    getColorString(id) {
        // Updated colors
        const colors = [
            '#888888', // 0 Neutral
            '#FFA500', // 1 Orange
            '#FFFF00', // 2 Yellow
            '#00FF00', // 3 Green
            '#0000FF', // 4 Blue
            '#800080', // 5 Purple
            '#888888', // 6
            '#888888', // 7
            '#888888', // 8
            '#FF0000'  // 9 Phonics (Red)
        ];
        return colors[id] || '#ffffff';
    }
}
