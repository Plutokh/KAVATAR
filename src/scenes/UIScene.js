export default class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
    }

    create() {
        this.gameScene = this.scene.get('GameScene');

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // --- RIGHT SIDE PANEL LAYOUT ---
        // 1. Turn Timer (Top Right)
        this.timerText = this.add.text(width - 50, 60, '60', {
            fontFamily: 'Black Han Sans', fontSize: '90px', fill: '#ffeb3b',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(1, 0.5); // Right Aligned

        this.add.text(width - 50, 110, 'SECONDS LEFT', {
            fontFamily: 'Do Hyeon', fontSize: '20px', fill: '#ffffff'
        }).setOrigin(1, 0.5);


        // 2. Round & Status (Below Timer)
        this.roundText = this.add.text(width - 50, 170, 'ROUND 1', {
            fontFamily: 'Do Hyeon', fontSize: '48px', fill: '#ffffff'
        }).setOrigin(1, 0.5);

        this.statusText = this.add.text(width - 50, 220, 'Team Name', {
            fontFamily: 'Do Hyeon', fontSize: '38px', fill: '#aaaaaa'
        }).setOrigin(1, 0.5);


        // 3. Scoreboard & AP Board (Table Style)
        // Header
        const startY = 280;
        const gapY = 55; // Increased Gap

        // Shifted left significantly to prevent overlap
        // Team | Land | AP | Purify
        const col1 = width - 550; // Team Name (Moved further left)
        const col2 = width - 390; // Land
        const col3 = width - 240; // AP
        const col4 = width - 100; // Purify (Now has margin from edge)

        this.add.text(col1, startY, 'TEAM', { font: '28px Do Hyeon', fill: '#888888' });
        this.add.text(col2, startY, 'LAND', { font: '28px Do Hyeon', fill: '#888888' });
        this.add.text(col3, startY, 'Pt (+INC)', { font: '28px Do Hyeon', fill: '#888888' });
        // Store Header to toggle visibility
        this.purifyHeader = this.add.text(col4, startY, 'PURIFY', { font: '24px Do Hyeon', fill: '#888888' }).setVisible(false);

        const teamNames = [
            '', // 0
            '주황 넙죽이', // 1
            '노랑 넙죽이', // 2
            '초록 넙죽이', // 3
            '파랑 넙죽이', // 4
            '보라 넙죽이', // 5
            '갈색 넙죽이'  // 6
        ];

        this.teamInfoTexts = [];
        // Create rows for max 6 teams + Phonics? (Phonics usually doesn't have AP/Land score relevant for players but good to show)
        // Let's do Team 1-6
        for (let i = 1; i <= 6; i++) {
            const y = startY + 40 + (i * gapY);

            // Name (Color Name)
            const tName = this.add.text(col1, y, teamNames[i] || `Team ${i}`, { font: '32px Do Hyeon', fill: '#ffffff' });
            // Land
            const tLand = this.add.text(col2 + 30, y, '0', { font: '32px Do Hyeon', fill: '#ffffff' }).setOrigin(0.5, 0);
            // AP
            const tAP = this.add.text(col3 + 50, y, '0 (+0)', { font: '32px Do Hyeon', fill: '#ffffff' }).setOrigin(0.5, 0);
            // Purify Count (Initially Hidden)
            const tPurify = this.add.text(col4 + 30, y, '0', { font: '32px Do Hyeon', fill: '#00ffff' }).setOrigin(0.5, 0).setVisible(false);

            this.teamInfoTexts[i] = { name: tName, land: tLand, ap: tAP, purify: tPurify };
        }

        // HIDDEN Phonics Row (Team 9)
        const pY = startY + 40 + (7 * gapY); // Below Team 6
        this.phonicsInfo = {
            name: this.add.text(col1, pY, 'PONIX', { font: '32px Do Hyeon', fill: '#ff0000' }).setVisible(false),
            land: this.add.text(col2 + 30, pY, '0', { font: '32px Do Hyeon', fill: '#ff0000' }).setOrigin(0.5, 0).setVisible(false)
        };


        // 4. Action Buttons (Moved Bottom Right but higher to fit)
        // Or keep them at bottom right, maybe slightly adjusted
        const panelX = width - 220;
        const panelY = height - 350;

        // HOME Button (Top Left now? Or keep Top Right but moved left?)
        // Let's put Home Button Top Left for safety
        const homeBtn = this.createButton(80, 40, 'HOME', () => {
            window.location.reload();
        });
        homeBtn.setScale(0.7);


        // Action Panel
        const actionX = width - 110;
        const actionStartY = height - 300;
        const actionGap = 55;

        this.recruitBtn = this.createButton(actionX, actionStartY, '징집 (Q) 1Pt', () => this.gameScene.events.emit('actionRecruit'));
        this.fortifyBtn = this.createButton(actionX, actionStartY + actionGap, '요새화 (W) 2Pt', () => this.gameScene.events.emit('actionFortify'));
        this.expandBtn = this.createButton(actionX, actionStartY + actionGap * 2, '확장 (E) 3Pt', () => this.gameScene.events.emit('actionExpand'));
        this.purifyBtn = this.createButton(actionX, actionStartY + actionGap * 3, '정화 (R) ?', () => this.gameScene.events.emit('actionPurify'));
        this.purifyBtn.setVisible(false);

        // --- MANUAL AP CONTROL PANEL (Admin) ---
        // Left of Action Panel
        const adminX = actionX - 250; // Moved slightly more left for larger UI
        const adminY = actionStartY + 50;

        // 1. Team Selector (Text Button)
        this.adminTargetId = 1;
        const adminTeamNames = ['', '주황', '노랑', '초록', '파랑', '보라', '갈색'];

        this.adminTeamText = this.add.text(adminX, adminY - 60, `대상: ${adminTeamNames[1]}`, {
            fontFamily: 'Do Hyeon', fontSize: '30px', color: '#ffffff', backgroundColor: '#333333',
            padding: { x: 15, y: 10 },
            fixedWidth: 200, align: 'center'
        }).setOrigin(0.5).setInteractive()
            .on('pointerdown', () => {
                this.adminTargetId++;
                if (this.adminTargetId > 6) this.adminTargetId = 1; // Cycle 1-6
                this.adminTeamText.setText(`대상: ${adminTeamNames[this.adminTargetId]}`);
                this.adminTeamText.setColor(this.getColorString(this.adminTargetId)); // Match team color
            });
        this.adminTeamText.setStroke('#000000', 4);
        this.adminTeamText.setColor(this.getColorString(1)); // Initial Color

        // 2. Input Field (DOM)
        // Styled to match the game UI (Dark background, White text, Border)
        // Do Hyeon font family
        const inputStyle = `
            width: 140px; 
            height: 50px; 
            font-size: 32px; 
            text-align: center; 
            font-family: 'Do Hyeon', sans-serif;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            border: 2px solid white;
            border-radius: 5px;
            outline: none;
        `;
        this.adminApInput = this.add.dom(adminX, adminY + 10).createFromHTML(`<input type="number" id="adminApInput" style="${inputStyle}" value="0">`);

        // Add listener for Enter key
        this.adminApInput.addListener('keydown');
        this.adminApInput.on('keydown', (event) => {
            if (event.code === 'Enter' || event.key === 'Enter') {
                const inputEl = document.getElementById('adminApInput');
                if (inputEl) {
                    const amount = parseInt(inputEl.value) || 0;
                    if (amount !== 0) {
                        this.gameScene.events.emit('actionAdminAP', { teamId: this.adminTargetId, amount: amount });
                        inputEl.value = "0"; // Auto clear
                    }
                }
            }
        });

        // 3. Apply Button
        // Increased size and visual weight
        this.createButton(adminX, adminY + 80, 'Pt 적용', () => {
            const inputEl = document.getElementById('adminApInput');
            if (inputEl) {
                const amount = parseInt(inputEl.value) || 0;
                if (amount !== 0) {
                    this.gameScene.events.emit('actionAdminAP', { teamId: this.adminTargetId, amount: amount });
                    inputEl.value = "0"; // Auto clear for better UX
                }
            }
        }).setScale(1.0); // Reset scale to normal (was 0.8)

        // Manual AP Control End ---
        // Undo / End Turn separate (Now Stacked Vertically Below Purify)
        this.pauseBtn = this.createButton(actionX, actionStartY + actionGap * 4, '일시정지 (P)', () => this.gameScene.events.emit('actionTogglePause'));
        this.undoBtn = this.createButton(actionX, actionStartY + actionGap * 5, '되돌리기 (A)', () => this.gameScene.events.emit('actionUndo'));
        this.endTurnBtn = this.createButton(actionX, actionStartY + actionGap * 6, '턴 종료 (SPC)', () => this.gameScene.events.emit('actionEndTurn'));


        // Listen to updates - SAVE HANDLERS for cleanup
        this.updateUIHandler = () => this.updateUI();
        this.showToastHandler = (msg) => this.showToast(msg);

        this.gameScene.events.on('updateUI', this.updateUIHandler);
        this.gameScene.events.on('showToast', this.showToastHandler);

        // Initial update
        this.time.delayedCall(100, () => this.updateUI());

        // Cleanup when UIScene shuts down
        this.events.on('shutdown', () => {
            if (this.gameScene) {
                this.gameScene.events.off('updateUI', this.updateUIHandler);
                this.gameScene.events.off('showToast', this.showToastHandler);
            }
        });
    }

    createButton(x, y, text, callback) {
        const btn = this.add.text(x, y, text, {
            fontFamily: 'Do Hyeon', fontSize: '32px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 4,
            padding: { x: 10, y: 5 }
        })
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerdown', callback)
            .on('pointerover', () => {
                btn.setStyle({ fill: '#3366ff' }); // Blue visual feedback
                btn.setScale(1.1); // Slight pop
            })
            .on('pointerout', () => {
                btn.setStyle({ fill: '#ffffff' });
                btn.setScale(1.0);
            });
        return btn;
    }

    updateUI() {
        if (!this.gameScene || !this.gameScene.gameManager) return;
        const gm = this.gameScene.gameManager;

        // 1. Timer
        const time = gm.timeLeft || 0;
        this.timerText.setText(time);

        // Timer color: Match Team Color, OR Red if low time
        if (time <= 10) {
            this.timerText.setColor('#ff0000'); // Warning Red
        } else {
            const currentTeam = gm.getCurrentTeam();
            if (currentTeam) {
                this.timerText.setColor(this.getColorString(currentTeam.id));
            } else {
                this.timerText.setColor('#ffeb3b'); // Default Yellow
            }
        }

        // 2. Round & Status
        this.roundText.setText(`ROUND ${gm.currentRound}`);
        const currentTeam = gm.getCurrentTeam();
        if (currentTeam) {
            this.statusText.setText(`${currentTeam.name} Turn`);
            this.statusText.setColor(this.getColorString(currentTeam.id));
        } else {
            this.statusText.setText('AI Processing...');
            this.statusText.setColor('#ff0000');
        }

        // 3. Scoreboard & AP Update
        // Calculate Land Counts
        const counts = {};
        gm.grid.getAllTiles().forEach(t => {
            counts[t.ownerID] = (counts[t.ownerID] || 0) + 1;
        });

        // Update Rows
        for (let i = 1; i <= 6; i++) {
            const team = gm.teamData[i];
            const ui = this.teamInfoTexts[i];
            if (!team || !ui) {
                // Hide if team doesn't exist (e.g. Map 1 only 5 teams)
                if (ui) {
                    ui.name.setVisible(false);
                    ui.land.setVisible(false);
                    ui.ap.setVisible(false);
                }
                continue;
            }

            ui.name.setVisible(true);
            ui.land.setVisible(true);
            ui.ap.setVisible(true);

            // Update Name color
            ui.name.setColor(this.getColorString(i));

            // Land Count
            const land = counts[i] || 0;
            ui.land.setText(land);

            // AP + Income
            const income = gm.calculateIncome(i);
            ui.ap.setText(`${team.ap} (+${income})`);

            // Purify Count
            ui.purify.setText(team.purifyCount || 0);

            // Highlight current team
            if (gm.currentTurn === i) {
                ui.name.setStroke('#ffffff', 2);
            } else {
                ui.name.setStroke('#000000', 0);
            }
        }

        // Update Phonics (Team 9) Row AND Purify Column if Part 2 (Round > 15)
        const isPart2 = gm.currentRound > 15 || gm.isPart2;

        // Toggle Header
        if (this.purifyHeader) this.purifyHeader.setVisible(isPart2);

        if (isPart2) {
            const phonicsLand = counts[9] || 0;
            this.phonicsInfo.name.setVisible(true);
            this.phonicsInfo.land.setVisible(true);
            this.phonicsInfo.land.setText(phonicsLand);
        } else {
            this.phonicsInfo.name.setVisible(false);
            this.phonicsInfo.land.setVisible(false);
        }

        // Toggle Purify Columns
        for (let i = 1; i <= 6; i++) {
            const ui = this.teamInfoTexts[i];
            if (ui && ui.purify) {
                ui.purify.setVisible(isPart2);
            }
        }

        // 4. Buttons
        if (gm.isPart2 && !this.purifyBtn.visible) {
            this.purifyBtn.setVisible(true);
        }

        if (this.pauseBtn) {
            this.pauseBtn.setText(gm.isPaused ? '재개 (P)' : '일시정지 (P)');
            this.pauseBtn.setStyle({ fill: gm.isPaused ? '#ffff00' : '#ffffff' });
        }
    }

    showToast(message) {
        // (Keep existing toast logic if possible, or simplified version)
        if (this.currentToast) this.currentToast.destroy();
        const x = this.cameras.main.width / 2;
        const y = this.cameras.main.height - 100;
        const container = this.add.container(x, y);
        const text = this.add.text(0, 0, message, {
            fontFamily: 'Do Hyeon', fontSize: '24px', color: '#ffffff',
            backgroundColor: '#000000', padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        container.add(text);
        container.setDepth(100);
        this.tweens.add({
            targets: container, alpha: 0, duration: 1000, delay: 1000,
            onComplete: () => { container.destroy(); if (this.currentToast === container) this.currentToast = null; }
        });
        this.currentToast = container;
    }

    getColorString(id) {
        const colors = [
            '#888888', // 0 Neutral
            '#FFA500', // 1 Orange
            '#FFFF00', // 2 Yellow
            '#00FF00', // 3 Green
            '#3399FF', // 4 Blue (Brightened from #0000FF)
            '#CC66FF', // 5 Purple (Brightened from #800080)
            '#D2B48C', // 6 Brown (Tan/Light Brown - Brightened from #8b4513)
            '#888888',
            '#888888',
            '#FF0000'  // 9 Phonics
        ];
        return colors[id] || '#ffffff';
    }
}
