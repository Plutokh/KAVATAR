import SaveManager from '../utils/SaveManager.js';

export default class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
        this.miniGames = [
            '주사위블랙잭',
            '단어리듬게임',
            '인물퀴즈',
            '마주치는 눈빛이~',
            '청개구리 가위바위보',
            '병뚜껑게임',
            '캐치마인드',
            '박수소리 크게내기',
            '이모지게임',
            '타이머 10초 맞추기',
            '퐁당퐁당'
        ];
        this.specialActions = [
            '📡 EMP 충격파',
            '🚀 퀀텀 점프',
            '🛡️ 방화벽',
            '💰 장학금 탈취',
            '⚡ 오버클럭',
            '🎲 랜덤 다이스'
        ];
        this.rouletteMode = 'MINIGAME'; // 'MINIGAME' or 'SPECIAL'
    }

    create() {
        this.gameScene = this.scene.get('GameScene');

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // --- LOGO (Map Top Center) ---
        const mapCenterX = width * 0.35;
        this.logoMain = this.add.text(mapCenterX, 40, 'KAVATAR', {
            fontFamily: 'Black Han Sans', fontSize: '60px', fill: '#00F0FF',
            stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5);

        this.logoSub = this.add.text(mapCenterX, 90, '', {
            fontFamily: 'Do Hyeon', fontSize: '30px', fill: '#00F0FF',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

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
        // Create rows for max 6 teams + Ponix? (Ponix usually doesn't have AP/Land score relevant for players but good to show)
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

        // HIDDEN Ponix Row (Team 9)
        const pY = startY + 40 + (7 * gapY); // Below Team 6
        this.ponixInfo = {
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
        // 3. Apply Button
        // Increased size and visual weight
        this.createButton(adminX, adminY + 65, 'Pt 적용', () => { // Moved UP (80 -> 65) to avoid overlap below
            const inputEl = document.getElementById('adminApInput');
            if (inputEl) {
                const amount = parseInt(inputEl.value) || 0;
                if (amount !== 0) {
                    this.gameScene.events.emit('actionAdminAP', { teamId: this.adminTargetId, amount: amount });
                    inputEl.value = "0"; // Auto clear for better UX
                }
            }
        }).setScale(1.0); // Reset scale to normal (was 0.8)

        // --- SPECIAL SKILLS TAB (Modal) ---
        // --- SPECIAL SKILLS TAB (Modal) ---
        const skillBtnY = adminY + 120; // Moved DOWN (90 -> 120) to clear Apply Button

        // 1. Open Button
        this.createButton(adminX, skillBtnY, '★ 특수 스킬 ★', () => {
            this.specialSkillsPanel.setVisible(true);
            if (this.adminApInput) this.adminApInput.setVisible(false); // Hide Input
        }).setScale(0.9);

        // ... (Modal Setup omitted, reused) ...

        // --- MINI-GAME ROULETTE (Below Skill 6) ---
        this.createButton(adminX, skillBtnY + 50, '★ 미니게임 룰렛 ★', () => { // 55 -> 50
            this.openRoulette('MINIGAME');
        }).setScale(0.9);

        // --- SPECIAL SKILL ROULETTE (Below Mini-game) ---
        this.createButton(adminX, skillBtnY + 100, '★ 특수 스킬 룰렛 ★', () => { // 110 -> 100
            this.openRoulette('SPECIAL');
        }).setScale(0.9);

        // 2. Modal Container (Centered)
        this.specialSkillsPanel = this.add.container(width / 2, height / 2).setVisible(false);
        this.specialSkillsPanel.setDepth(200); // Ensure on top

        // Background
        const panelBg = this.add.rectangle(0, 0, 700, 500, 0x000000, 0.95)
            .setStrokeStyle(4, 0x00F0FF);
        this.specialSkillsPanel.add(panelBg);

        // Title
        const panelTitle = this.add.text(0, -200, '특수 스킬 선택', {
            fontFamily: 'Black Han Sans', fontSize: '48px', fill: '#ffffff'
        }).setOrigin(0.5);
        this.specialSkillsPanel.add(panelTitle);

        // Close Button (Top Right)
        const closeBtn = this.add.text(320, -220, 'X', {
            fontFamily: 'Arial', fontSize: '40px', fill: '#ff0000', fontStyle: 'bold'
        })
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerdown', () => {
                this.specialSkillsPanel.setVisible(false);
                if (this.adminApInput) this.adminApInput.setVisible(true); // Show Input
            });
        this.specialSkillsPanel.add(closeBtn);

        // 6 Skills (Grid 3x2)
        this.skillButtons = [];
        const skillData = [
            { name: '📡 EMP 충격파', desc: '지정 위치 및 주변 반경 1칸 반경 전투력 -2' },
            { name: '🚀 퀀텀 점프', desc: '비어있거나 약한 적(전투력 1) 땅 즉시 점령' },
            { name: '🛡️ 방화벽', desc: '지정 내 땅+인접 아군 1라운드 보호막' },
            { name: '💰 장학금 탈취', desc: '내 땅 인접 약한 적 땅 모두 흡수' },
            { name: '⚡ 오버클럭', desc: '선택 및 인접 아군 땅 전투력 +3' },
            { name: '🎲 랜덤 다이스', desc: '즉시 AP +5~10 획득' }
        ];

        skillData.forEach((data, idx) => {
            const col = idx % 3;
            const row = Math.floor(idx / 3);
            const sx = (col - 1) * 220;
            const sy = (row - 0.5) * 180 + 20;

            const btnContainer = this.add.container(sx, sy);

            // Background
            const bg = this.add.rectangle(0, 0, 210, 160, 0x333333)
                .setStrokeStyle(2, 0x888888)
                .setInteractive()
                .on('pointerover', function () { this.fillColor = 0x555555; })
                .on('pointerout', function () { this.fillColor = 0x333333; })
                .on('pointerdown', () => {
                    this.gameScene.events.emit('actionSkill', idx);
                    this.specialSkillsPanel.setVisible(false);
                    if (this.adminApInput) this.adminApInput.setVisible(true); // Show Input
                });
            btnContainer.add(bg);

            // Name
            const nameText = this.add.text(0, -50, data.name, {
                fontFamily: 'Do Hyeon', fontSize: '28px', fill: '#ffffff'
            }).setOrigin(0.5);
            btnContainer.add(nameText);

            // Desc
            const descText = this.add.text(0, 10, data.desc, {
                fontFamily: 'Do Hyeon', fontSize: '18px', fill: '#aaaaaa',
                align: 'center', wordWrap: { width: 190 }
            }).setOrigin(0.5);
            btnContainer.add(descText);

            // Cooldown Text (Hidden by default)
            const cdText = this.add.text(0, 50, '', {
                fontFamily: "Black Han Sans", fontSize: "32px", fill: "#ff0000"
            }).setOrigin(0.5);
            btnContainer.add(cdText);

            this.specialSkillsPanel.add(btnContainer);

            // Store ref for updates
            this.skillButtons.push({
                bg: bg,
                name: nameText,
                desc: descText,
                cd: cdText,
                baseName: data.name,
                baseDesc: data.desc
            });
        });

        // (Buttons moved up)

        this.createRoulettePanel(width, height);

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
        this.gameScene.events.on('gameOver', (data) => this.createGameOverScreen(data));

        // Initial update
        this.time.delayedCall(100, () => this.updateUI());

        // --- DEBUG / SAVE LOAD CONTROLS ---
        // Below Home Button
        const dbBtnY = 100;
        this.createButton(80, dbBtnY, 'SAVE', () => {
            if (!this.gameScene || !this.gameScene.gameManager) return;
            const json = SaveManager.save(this.gameScene.gameManager);
            if (json) {
                localStorage.setItem('kavatar_save_debug', json);
                navigator.clipboard.writeText(json).then(() => {
                    this.showToast("상태 저장 완료 (클립보드 복사됨)");
                });
            }
        }).setScale(0.6);

        this.createButton(80, dbBtnY + 40, 'LOAD', () => {
            if (!this.gameScene || !this.gameScene.gameManager) return;
            const json = localStorage.getItem('kavatar_save_debug');
            if (json) {
                if (SaveManager.load(this.gameScene.gameManager, json)) {
                    this.showToast("상태 불러오기 완료");
                    this.gameScene.events.emit('updateUI');
                }
            } else {
                this.showToast("저장된 상태가 없습니다.");
            }
        }).setScale(0.6);

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

        // Update Ponix (Team 9) Row AND Purify Column if Part 2 (Round > 15)
        const isPart2 = gm.currentRound > 15 || gm.isPart2;

        // Toggle Header
        if (this.purifyHeader) this.purifyHeader.setVisible(isPart2);

        if (isPart2) {
            const ponixLand = counts[9] || 0;
            this.ponixInfo.name.setVisible(true);
            this.ponixInfo.land.setVisible(true);
            this.ponixInfo.land.setText(ponixLand);
        } else {
            this.ponixInfo.name.setVisible(false);
            this.ponixInfo.land.setVisible(false);
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

        // 5. Logo Update
        const isSetup = gm.isSetupPhase;
        const colorBlue = '#00F0FF';
        const colorRed = '#FF2222';

        if (gm.isPart2) {
            this.logoMain.setColor(colorRed);
            this.logoSub.setColor(colorRed);
            this.logoSub.setText('포닉스와 재');
        } else {
            this.logoMain.setColor(colorBlue);
            this.logoSub.setColor(colorBlue);
            if (isSetup) {
                this.logoSub.setText('');
                this.logoSub.setText('넙죽이의 길');
            }
        }

        // 6. Skill Buttons Update
        if (this.skillButtons && gm.getCurrentTeam()) {
            const team = gm.getCurrentTeam();
            this.skillButtons.forEach((btn, idx) => {
                // Dynamic Content (Skill 6)
                if (idx === 5) {
                    if (gm.isPart2) {
                        btn.name.setText('💉 백신 코드');
                        btn.desc.setText('주변 포닉스 정화');
                    } else {
                        btn.name.setText(btn.baseName);
                        btn.desc.setText(btn.baseDesc);
                    }
                }

                // Cooldowns (Disabled)
                btn.bg.setFillStyle(0x333333); // Normal
                if (btn.bg.input) btn.bg.input.enabled = true;
                btn.cd.setVisible(false);
                btn.name.setAlpha(1);
                btn.desc.setAlpha(1);
            });
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

    createGameOverScreen(data) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Background Overlay
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9)
            .setInteractive(); // Block input

        // 2. Messages based on Winner
        let mainMsg = "";
        let subMsg = "";
        let mainColor = "#ffffff";

        if (data.winner === 'Player') {
            mainMsg = `${data.winningTeam} 승리!`;
            subMsg = "포닉스를 몰아내고 넙죽이의 왕좌에 앉았습니다!";
            mainColor = "#00F0FF"; // Player Blue
        } else {
            mainMsg = "포닉스 승리!";
            subMsg = "아쉽지만 카이스트는 점령당했습니다!";
            mainColor = "#FF2222"; // Ponix Red
        }

        // 3. Display Text
        this.add.text(width / 2, height / 2 - 50, mainMsg, {
            fontFamily: 'Black Han Sans', fontSize: '80px', fill: mainColor,
            stroke: '#ffffff', strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 30, subMsg, {
            fontFamily: 'Do Hyeon', fontSize: '40px', fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // 4. Restart Button
        const restartBtn = this.add.text(width / 2, height / 2 + 120, '메인 메뉴로 돌아가기', {
            fontFamily: 'Do Hyeon', fontSize: '32px', fill: '#ffffff',
            backgroundColor: '#333333', padding: { x: 20, y: 10 }
        })
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerover', () => restartBtn.setStyle({ fill: '#ffff00' }))
            .on('pointerout', () => restartBtn.setStyle({ fill: '#ffffff' }))
            .on('pointerdown', () => {
                window.location.reload();
            });

        // Pause Game Engine (Optional but good for stopping timers)
        this.gameScene.scene.pause();
    }

    createRoulettePanel(width, height) {
        this.roulettePanel = this.add.container(width / 2, height / 2).setVisible(false);
        this.roulettePanel.setDepth(300);

        // Background Modal (Larger: 90% of screen)
        const panelW = width * 0.9;
        const panelH = height * 0.9;
        const bg = this.add.rectangle(0, 0, panelW, panelH, 0x000000, 0.95)
            .setStrokeStyle(4, 0xff00ff);
        this.roulettePanel.add(bg);

        // Title
        this.rouletteTitle = this.add.text(0, -panelH / 2 + 50, '미니게임 룰렛', {
            fontFamily: 'Black Han Sans', fontSize: '48px', fill: '#ffff00'
        }).setOrigin(0.5);
        this.roulettePanel.add(this.rouletteTitle);

        // Skill Counts Text (Top Left)
        this.skillCountsText = this.add.text(-panelW / 2 + 30, -panelH / 2 + 30, '', {
            fontFamily: 'Do Hyeon', fontSize: '24px', fill: '#ffffff',
            align: 'left', lineSpacing: 10
        }).setOrigin(0, 0);
        this.roulettePanel.add(this.skillCountsText);

        // Wheel Container
        this.wheelContainer = this.add.container(0, 0);
        this.roulettePanel.add(this.wheelContainer);

        // Indicator (Arrow pointing DOWN into the wheel)
        // Vertices relative to (0, -Radius - 20)
        // Tip should be at (0, -Radius + 10) to overlap slightly?
        // Let's place it at Top.
        // Triangle pointing DOWN: (0, 0) is Tip. (-20, -40), (20, -40) are Base.
        // Position: (0, -Radius)
        const radius = Math.min(panelW, panelH) * 0.35; // Dynamic Radius
        this.wheelRadius = radius; // Store for valid drawing

        const arrowY = -radius - 10;
        const arrow = this.add.triangle(18, arrowY, 0, 10, 20, -30, -20, -30, 0xffffff)
            .setStrokeStyle(2, 0x000000);
        this.roulettePanel.add(arrow);

        // Spin Button (Bottom)
        this.spinBtn = this.add.text(0, panelH / 2 - 80, 'SPIN', {
            fontFamily: 'Black Han Sans', fontSize: '60px', fill: '#ffffff', backgroundColor: '#333333',
            padding: { x: 50, y: 20 }
        })
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerdown', () => this.spinRoulette())
            .on('pointerover', function () { this.setStyle({ fill: '#00ff00' }); })
            .on('pointerout', function () { this.setStyle({ fill: '#ffffff' }); });
        this.roulettePanel.add(this.spinBtn);

        // Close Button (Top Right corner of panel)
        const closeX = panelW / 2 - 40;
        const closeY = -panelH / 2 + 40;
        const closeBtn = this.add.text(closeX, closeY, 'X', {
            fontFamily: 'Arial', fontSize: '40px', fill: '#ff0000', fontStyle: 'bold'
        })
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerdown', () => this.closeRoulette());
        this.roulettePanel.add(closeBtn);
    }

    drawWheel() {
        this.wheelContainer.removeAll(true);

        let games;
        if (this.rouletteMode === 'SPECIAL') {
            // map objects to names for display
            games = this.activeSpecialSkills.map(s => s.name);
        } else {
            games = this.miniGames;
        }

        if (games.length === 0) {
            const noGameText = this.add.text(0, 0, "No Games Left", {
                fontFamily: 'Do Hyeon', fontSize: '32px', fill: '#888888'
            }).setOrigin(0.5);
            this.wheelContainer.add(noGameText);
            return;
        }

        const radius = this.wheelRadius || 250;
        const sliceAngle = 360 / games.length;
        const colors = [0xFF0000, 0xFF7F00, 0xFFFF00, 0x00FF00, 0x0000FF, 0x4B0082, 0x9400D3];

        games.forEach((game, idx) => {
            const startAngle = Phaser.Math.DegToRad(idx * sliceAngle);
            const endAngle = Phaser.Math.DegToRad((idx + 1) * sliceAngle);
            const color = colors[idx % colors.length];

            // Slice
            const slice = this.add.graphics();
            slice.fillStyle(color, 1);
            slice.lineStyle(2, 0x000000, 1);
            slice.beginPath();
            slice.moveTo(0, 0);
            slice.arc(0, 0, radius, startAngle, endAngle);
            slice.closePath();
            slice.fillPath();
            slice.strokePath();
            this.wheelContainer.add(slice);

            // Text Label (Radial)
            const midAngle = startAngle + (endAngle - startAngle) / 2;
            const textRadius = radius * 0.6; // Slightly closer to center
            const tx = Math.cos(midAngle) * textRadius;
            const ty = Math.sin(midAngle) * textRadius;

            const label = this.add.text(tx, ty, game, {
                fontFamily: 'Do Hyeon', fontSize: '30px', fill: '#ffffff', stroke: '#000000', strokeThickness: 3
            }).setOrigin(0.5);

            // Rotate text to radiate outward
            // At 0 (Right), rotation should be 0.
            // At 90 (Bottom), rotation should be 90.
            // So rotation = midAngle.
            label.setRotation(midAngle);

            // Adjust origin?
            // If origin is 0.5, 0.5 (Center), it rotates around its center.
            // If we want it to read "Outward", we might want the text BASELINE to be perpendicular to radius? No, user said "Center to Outward".
            // Left-to-Right reading means: 'Start' at Center side, 'End' at Outer side.
            // So we want the text to be aligned with the radius line.
            // Set Origin to (0.5, 0.5) should be fine if positioned correctly.
            // But 'reading direction' matters.
            // At 180 (Left), rotation is PI. Text is upside down?
            // Yes. To fix readabilty:
            // if (midAngle > Math.PI/2 && midAngle < 3*Math.PI/2) { label.setRotation(midAngle + Math.PI); }
            // But user specifically said "Center to Outward", implying uniform direction regardless of upside-down-ness?
            // "중심으로부터 바깥으로 적어나가는 방향".
            // This usually means the 'start' of the string is closer to center.
            // So standard rotation = midAngle is correct. Upside down on left side is expected in this style.

            this.wheelContainer.add(label);
        });
    }

    updateRouletteCounts() {
        if (!this.gameScene || !this.gameScene.gameManager) return;
        const gm = this.gameScene.gameManager;
        const counts = gm.skillRouletteCounts || [0, 0, 0, 0, 0, 0];

        // Only show for Special Roulette
        if (this.rouletteMode === 'SPECIAL') {
            let text = "스킬 등장 횟수 (Max 5):\n";
            this.specialActions.forEach((name, idx) => {
                const count = counts[idx];
                const color = count >= 5 ? '#ff0000' : '#ffffff';
                // Clean name (remove emoji for list?) -> Keep it
                // Maybe shorten?
                text += `${name}: ${count}/5\n`;
            });
            this.skillCountsText.setText(text);
            this.skillCountsText.setVisible(true);
        } else {
            this.skillCountsText.setVisible(false);
        }
    }

    openRoulette(mode) {
        this.rouletteMode = mode || 'MINIGAME';
        this.roulettePanel.setVisible(true);

        // Dynamic Content for Special Skills
        if (this.rouletteMode === 'SPECIAL') {
            const isPart2 = (this.gameScene && this.gameScene.gameManager &&
                (this.gameScene.gameManager.isPart2 ||
                    this.gameScene.gameManager.currentRound > 15));

            if (isPart2) {
                this.specialActions[5] = '💉 백신 코드';
            } else {
                this.specialActions[5] = '🎲 랜덤 다이스';
            }

            // Filter Skills based on Counts
            const gm = this.gameScene.gameManager;
            const counts = gm.skillRouletteCounts || [0, 0, 0, 0, 0, 0];

            this.activeSpecialSkills = [];
            this.specialActions.forEach((name, idx) => {
                if (counts[idx] < 5) {
                    this.activeSpecialSkills.push({ name: name, originalIndex: idx });
                }
            });
        }

        this.updateRouletteCounts();

        const games = (this.rouletteMode === 'SPECIAL')
            ? this.activeSpecialSkills.map(s => s.name)
            : this.miniGames;

        this.rouletteTitle.setText(this.rouletteMode === 'SPECIAL' ? '특수 스킬 룰렛' : '미니게임 룰렛');

        this.spinBtn.setVisible(games.length > 0);
        this.spinBtn.setText("SPIN");
        this.drawWheel();
        this.wheelContainer.setAngle(0);

        if (this.adminApInput) this.adminApInput.setVisible(false); // Hide Input

        // Pause Game
        if (this.gameScene && this.gameScene.gameManager) {
            this.gameScene.gameManager.setTimerPaused(true);
        }
    }

    closeRoulette() {
        this.roulettePanel.setVisible(false);
        if (this.adminApInput) this.adminApInput.setVisible(true); // Show Input

        // Resume Game
        if (this.gameScene && this.gameScene.gameManager) {
            this.gameScene.gameManager.setTimerPaused(false);
        }
    }

    spinRoulette() {
        const games = (this.rouletteMode === 'SPECIAL')
            ? this.activeSpecialSkills
            : this.miniGames;
        if (games.length === 0) return;

        this.spinBtn.setVisible(false);

        // Spin rounds
        const rounds = 5;
        const randomAngle = Phaser.Math.Between(0, 360);
        // Spin COUNTER-CLOCKWISE to emulate "Wheel goes Left, Pointer fixed"?
        // Usually wheel spins one way. Let's stick to Clockwise (angle increases).
        // Wait, Arrow is at Top (-90 deg visually).
        // If wheel spins clockwise, the "Winner" is the slice that stops at -90.
        // Let's use negative angle for clockwise visual spin? Or positive?
        // Positive angle = Clockwise rotation of container.

        const totalAngle = 360 * rounds + randomAngle;

        this.tweens.add({
            targets: this.wheelContainer,
            angle: totalAngle,
            duration: 4000, // Longer spin for larger wheel
            ease: 'Cubic.easeOut',
            onComplete: () => {
                this.finalizeRoulette(totalAngle % 360);
            }
        });
    }

    finalizeRoulette(finalAngle) {
        // Calculate Winner
        // Wheel rotated Clockwise. 
        // Indicator is at -90 degrees (Top center).
        // Since we rotated the CONTAINER, the visual top is actually -finalAngle relative to the data.
        // Wait, Phaser angle 0 is Right (3 o'clock).
        // Indicator is at Top (-180 in y? No, angle -90).
        // Let's simplify: 
        // An angle of 0 puts Slice 0 at Right [0, sliceAngle].
        // Arrow is at Top (-90 degrees).
        // To find which slice is at -90:
        // Current Rotation = finalAngle (e.g., 720 + 30 = 30).
        // The slice at -90 is the one that WAS at (-90 - Rotation).
        // Normalized Angle = (-90 - finalAngle) % 360.
        // If negative, add 360.

        // Let's debug this logic mentally:
        // If I rotate 90 deg clockwise. 0 moves to 90 (Bottom).
        // The slice at Top (-90) is the one that was at -180 (Left).
        // -90 - 90 = -180. Correct.

        let targetAngle = -90 - finalAngle;
        targetAngle = targetAngle % 360;
        if (targetAngle < 0) targetAngle += 360;

        // Convert to Index
        // Index 0 starts at 0 rad. Index N is ...
        // Angles are increasing clockwise in Phaser? Yes.
        // Note: arc drawing uses radians. idx*slice to (idx+1)*slice.
        // DegToRad(0) is Right.

        // So we just check which [start, end] interval contains targetAngle.
        // targetAngle is in degrees (0-360).
        const games = (this.rouletteMode === 'SPECIAL')
            ? this.activeSpecialSkills
            : this.miniGames;
        const sliceAngle = 360 / games.length;
        const winIdx = Math.floor(targetAngle / sliceAngle);

        // safe clamp
        const safeIdx = Phaser.Math.Clamp(winIdx, 0, games.length - 1);

        let winnerName = "";
        let winnerObj = null;

        if (this.rouletteMode === 'SPECIAL') {
            winnerObj = games[safeIdx]; // { name, originalIndex }
            winnerName = winnerObj.name;

            // Increment Count
            if (this.gameScene && this.gameScene.gameManager) {
                this.gameScene.gameManager.skillRouletteCounts[winnerObj.originalIndex]++;
                this.updateRouletteCounts(); // Refresh UI
            }
        } else {
            winnerName = games[safeIdx]; // Verification
        }

        // Do we remove it?
        // Special: If count >= 5, it will be removed on NEXT open, or we can remove it now?
        // User asked "Appear max 5 times". 
        // Logic in openRoulette handles the construction of the list.
        // If we want to remove it strictly from THIS list if it hit 5 after this spin:
        // But the requirement is "Appear max 5 times". It doesn't mean remove immediately after win unless it was the 5th time.
        // And even then, removing from the CURRENT wheel is tricky visually immediately.
        // It's cleaner to remove it on next spin or reload.
        // However, Minigame logic removed it immediately.
        // Let's stick to update counts and let openRoulette handle exclusion next time?
        // OR: If it hit 5, remove from this.activeSpecialSkills?

        // Actually, for better UX, if it hits 5, we should probably remove it from the active list for the NEXT spin if we implemented "Spin Again" without closing.
        // But spinRoulette re-grabs the list. 
        // So we should update filtered list.

        if (this.rouletteMode === 'SPECIAL') {
            const gm = this.gameScene.gameManager;
            const count = gm.skillRouletteCounts[winnerObj.originalIndex];
            if (count >= 5) {
                // Remove from active list for subsequent spins in this session
                this.activeSpecialSkills.splice(safeIdx, 1);
            }
        }

        const winText = this.add.text(0, 0, winnerName, {
            fontFamily: 'Do Hyeon', fontSize: '40px', fill: '#ffffff', backgroundColor: '#000000',
            stroke: '#ff0000', strokeThickness: 4, padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        this.wheelContainer.add(winText);
        winText.setAngle(-finalAngle); // Counter-rotate to keep text upright

        if (this.rouletteMode === 'MINIGAME') {
            this.miniGames.splice(safeIdx, 1);
        }

        this.time.delayedCall(2000, () => {
            this.drawWheel(); // Redraw (removed item)
            this.wheelContainer.setAngle(0); // Reset

            this.drawWheel(); // Redraw (removed item)
            this.wheelContainer.setAngle(0); // Reset

            const nextGames = (this.rouletteMode === 'SPECIAL')
                ? this.activeSpecialSkills
                : this.miniGames;

            if (nextGames.length > 0) {
                this.spinBtn.setVisible(true);
                this.spinBtn.setText("SPIN AGAIN");
            } else {
                this.spinBtn.setVisible(false);
            }
        });
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
            '#FF0000'  // 9 Ponix
        ];
        return colors[id] || '#ffffff';
    }
}
