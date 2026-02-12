import SaveManager from '../utils/SaveManager.js';

export default class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
        this.miniGames = [
            '주사위블랙잭',
            '인물퀴즈',
            '마주치는 눈빛이~',
            '청개구리 가위바위보',
            '병뚜껑게임',
            '캐치마인드',
            '박수소리 크게내기',
            '이모지게임',
            '타이머 10초 맞추기'
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

        // Listen for UI Updates from GameScene/GameManager
        this.gameScene.events.on('updateUI', () => {
            this.updateUI();
        });

        // Listen for Toast Messages
        this.gameScene.events.on('showToast', (message) => {
            this.showToast(message);
        });

        // --- LOGO (Removed) ---

        // --- RIGHT SIDE PANEL LAYOUT ---
        const rightPanelCenter = 1660; // Shifted Left ~65px from 1725

        // 1. Turn Timer (Top Right)
        // Previous rel X = -150. New X = 1510.
        // User requested +90px shift from 1510 -> 1600.
        // Then requested 15px Left -> 1585.
        const timerX = 1585;

        this.timerText = this.add.text(timerX, 130, '60', {
            fontFamily: 'Ghanachocolate', fontSize: '100px', fill: '#3E2723', // Reduced 100->90
            stroke: '#00000000', strokeThickness: 0
        }).setOrigin(0.5);
        this.timerText.setStroke('#000000', 0);

        // 2. Round Info (Below Timer)
        // User: 1655 (-10px from 1665), 300 (+20px), 55px (reduced 20px from 75px)
        this.roundText = this.add.text(1650, 320, 'Round 1', {
            fontFamily: 'Ghanachocolate', fontSize: '54px', fill: '#deb989',
            stroke: '#3E272300', strokeThickness: 4
        }).setOrigin(0.5);

        // Turn Status
        // User: 1665 (-5px), 350 (Preserved Y?), Remove "Turn" text
        this.statusText = this.add.text(1650, 380, '주황 넙죽이', {
            fontFamily: 'Ghanachocolate', fontSize: '36px', fill: '#ff8400',
            stroke: '#00000000', strokeThickness: 3
        }).setOrigin(0.5);

        // Turn AP Info (New)
        // User: 1655 (-10px from 1665), Below Turn Status, 40px.
        this.turnApText = this.add.text(1650, 420, '0 Pt', {
            fontFamily: 'Ghanachocolate', fontSize: '24px', fill: '#deb989',
            stroke: '#00000000', strokeThickness: 3
        }).setOrigin(0.5);

        // 3. Scoreboard
        // User: Start Y = 470, Row Gap = 35
        const startY = 565; // 470 + 100 (moved down 100px)
        const gapY = 40;

        // Cols - Adjusted to align with background table
        // Team Name: 1420 (Left Align) - 1425 - 5
        // Land: 1615 (Center) - 1610 + 5
        // Points: 1790 (Center) - no change
        // P (Purify): 1850 (Center) - no change
        const col1 = 1415;
        const col2 = 1615;
        const col3 = 1780;
        const col4 = 1850;

        // Headers (Hidden)
        this.purifyHeader = this.add.text(col4, startY, 'P', { fontFamily: 'Ghanachocolate', fontSize: '20px', fill: '#D7CCC8' }).setOrigin(0.5, 0).setVisible(false);

        const teamNames = ['', '주황 넙죽이', '노랑 넙죽이', '초록 넙죽이', '파랑 넙죽이', '보라 넙죽이', '분홍 넙죽이'];
        this.teamInfoTexts = [];

        for (let i = 1; i <= 6; i++) {
            const y = startY + ((i - 1) * gapY);

            // Font Size: 24px (20% increase from 20px), letter-spacing: 1px
            const tName = this.add.text(col1, y, teamNames[i], { fontFamily: 'Ghanachocolate', fontSize: '24px', fill: '#deb989', letterSpacing: 1 }).setOrigin(0, 0.5); // Left Align
            const tLand = this.add.text(col2, y, '0', { fontFamily: 'Ghanachocolate', fontSize: '24px', fill: '#deb989', letterSpacing: 1 }).setOrigin(0.5, 0.5); // Center
            const tAP = this.add.text(col3, y, '0', { fontFamily: 'Ghanachocolate', fontSize: '24px', fill: '#deb989', letterSpacing: 1 }).setOrigin(0.5, 0.5); // Center
            const tPurify = this.add.text(col4, y, '0', { fontFamily: 'Ghanachocolate', fontSize: '24px', fill: '#deb989', letterSpacing: 1 }).setOrigin(0.5, 0.5).setVisible(false);
            this.teamInfoTexts[i] = { name: tName, land: tLand, ap: tAP, purify: tPurify };
        }

        const pY = startY + (6 * gapY);
        this.ponixInfo = {
            name: this.add.text(col1, pY, 'PONIX', { fontFamily: 'Ghanachocolate', fontSize: '24px', fill: '#ff2764', letterSpacing: 1 }).setOrigin(0, 0.5).setVisible(false),
            land: this.add.text(col2, pY, '0', { fontFamily: 'Ghanachocolate', fontSize: '24px', fill: '#ff2764', letterSpacing: 1 }).setOrigin(0.5, 0.5).setVisible(false)
        };





        // 3. Scoreboard (Unchanged lines omitted if possible, but might need context)
        // ... (Skipping Scoreboard logic in this replace block if possible, but they are adjacent)

        // Let's target the Round Text block specifically first for the color change.
        // Actually, user wants Command Panel moved too. I can do it in chunks.

        // --- REPLACEMENT FOR ROUND TEXT BLOCK ---
        // see StartLine/EndLine

        // --- REPLACEMENT FOR COMMAND PANEL BLOCK ---
        // 4. Buttons / Command Panel - Compressed spacing, pushed lower
        const panelStartY = 850; // Starting Y for command panel (moved down from 760)
        const btnX_Left = 1570;
        const btnX_Right = 1770;

        // Command Title
        this.commandTitle = this.add.text(1660, panelStartY, '- Commands -', {
            fontFamily: 'Ghanachocolate', fontSize: '20px', fill: '#aa885c'
        }).setOrigin(0.5);

        // Admin Panel (below title, +30px)
        const adminY = panelStartY + 35; // 880

        this.adminTargetId = 1;
        this.adminTeamText = this.add.text(1530, adminY, '주황', {
            fontFamily: 'Ghanachocolate', fontSize: '18px', color: '#ff8400', backgroundColor: '#4E342E',
            padding: { x: 8, y: 3 }, borderRadius: '4px'
        }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
            this.adminTargetId = (this.adminTargetId % 6) + 1;
            const names = ['', '주황', '노랑', '초록', '파랑', '보라', '분홍'];
            this.adminTeamText.setText(names[this.adminTargetId]);
            this.adminTeamText.setColor(this.getColorString(this.adminTargetId));
        });

        this.add.text(1580, adminY, '에게', { fontFamily: 'Ghanachocolate', fontSize: '18px', fill: '#aa885c' }).setOrigin(0.5);

        const inputStyle = `width: 50px; height: 24px; font-size: 16px; text-align: center; font-family: 'Ghanachocolate'; background: #4E342E; color: #deb989; border: 1px solid #8D6E63; border-radius: 4px; outline: none;`;
        this.adminApInput = this.add.dom(1640, adminY).createFromHTML(`<input type="number" id="adminApInput" style="${inputStyle}" value="0">`);
        this.adminApInput.addListener('keydown');
        this.adminApInput.on('keydown', (e) => {
            if (e.key === 'Enter') {
                const el = document.getElementById('adminApInput');
                if (el) {
                    const val = parseInt(el.value) || 0;
                    if (val !== 0) {
                        this.gameScene.events.emit('actionAdminAP', { teamId: this.adminTargetId, amount: val });
                        el.value = "0";
                    }
                }
            }
        });

        this.add.text(1690, adminY, 'Pt', { fontFamily: 'Ghanachocolate', fontSize: '18px', fill: '#aa885c' }).setOrigin(0.5);
        this.createButton(1760, adminY, '<적용하기>', () => {
            const el = document.getElementById('adminApInput');
            if (el) {
                const val = parseInt(el.value) || 0;
                if (val !== 0) {
                    this.gameScene.events.emit('actionAdminAP', { teamId: this.adminTargetId, amount: val });
                    el.value = "0";
                }
            }
        }).setScale(1.0);


        // Action Buttons Start (below admin, +35px)
        const btnYStart = adminY + 35; // 915
        const btnGap = 30; // Tighter gap

        // Left Column: Core Actions
        // Row 1: Recruit, Pause
        this.recruitBtn = this.createButton(btnX_Left, btnYStart, '< 징집 (Q) 1Pt >', () => this.gameScene.events.emit('actionRecruit'));
        this.createButton(btnX_Right, btnYStart, '< 특수 스킬 사용 >', () => {
            this.specialSkillsPanel.setVisible(true);
            if (this.adminApInput) this.adminApInput.setVisible(false);
        });

        // Row 2: Fortify, Special Skills Use
        this.fortifyBtn = this.createButton(btnX_Left, btnYStart + btnGap, '< 요새화 (W) 2Pt >', () => this.gameScene.events.emit('actionFortify'));
        this.createButton(btnX_Right, btnYStart + btnGap, '< 특수 스킬 룰렛 >', () => this.openRoulette('SPECIAL'));

        // Row 3: Expand, Skill Roulette
        this.expandBtn = this.createButton(btnX_Left, btnYStart + btnGap * 2, '< 확장 (E) 3Pt >', () => this.gameScene.events.emit('actionExpand'));
        this.createButton(btnX_Right, btnYStart + btnGap * 2, '< 미니게임 룰렛 >', () => this.openRoulette('MINIGAME'));

        // Row 4: Purify (Part 2 only), Mini-Game Roulette
        this.purifyBtn = this.createButton(btnX_Left, btnYStart + btnGap * 3, '< 정화 (R) >', () => this.gameScene.events.emit('actionPurify'));
        this.purifyBtn.setVisible(false); // No color override - uses default beige

        this.pauseBtn = this.createButton(btnX_Right, btnYStart + btnGap * 3, '< 일시정지 (P) >', () => this.gameScene.events.emit('actionTogglePause'));

        // Undo Button (below grid, left aligned)
        this.undoBtn = this.createButton(btnX_Left, btnYStart + btnGap * 4 + 5, '< 되돌리기 (A) >', () => this.gameScene.events.emit('actionUndo'));

        // End Turn Button (right aligned, below grid)
        this.endTurnBtn = this.createButton(btnX_Right, btnYStart + btnGap * 4 + 5, '< 턴 종료 (SPC) >', () => this.gameScene.events.emit('actionEndTurn'));
        // Using default beige color (#deb989)

        // ...

        // ... Then createButton method update ...

        // I will try to use multi_replace for this to separate the Round change and the Command change.



        // --- Init Overlays ---
        this.specialSkillsPanel = this.add.container(width / 2, height / 2).setVisible(false).setDepth(200);
        const panelBg = this.add.rectangle(0, 0, 800, 600, 0x3E2723, 0.95).setStrokeStyle(4, 0x8D6E63); // Darker Brown
        this.specialSkillsPanel.add(panelBg);
        this.specialSkillsPanel.add(this.add.text(0, -220, '특수 스킬 선택', { fontFamily: 'Ghanachocolate', fontSize: '50px', fill: '#deb989' }).setOrigin(0.5));

        const closeBtn = this.add.text(360, -260, 'X', { fontFamily: 'Arial', fontSize: '40px', fill: '#7e5f41' })
            .setInteractive().setOrigin(0.5)
            .on('pointerdown', () => {
                this.specialSkillsPanel.setVisible(false);
                if (this.adminApInput) this.adminApInput.setVisible(true);
            });
        this.specialSkillsPanel.add(closeBtn);

        const skillData = [
            { name: '📡 EMP 충격파', desc: '지정 위치 및 주변 반경 1칸 반경 전투력 -2' },
            { name: '🚀 퀀텀 점프', desc: '비어있거나 약한 적(전투력 1) 땅 즉시 점령' },
            { name: '🛡️ 방화벽', desc: '지정 내 땅+인접 아군 1라운드 보호막' },
            { name: '💰 장학금 탈취', desc: '내 땅 인접 약한 적 땅 모두 흡수' },
            { name: '⚡ 오버클럭', desc: '선택 및 인접 아군 땅 전투력 +3' },
            { name: '🎲 랜덤 다이스', desc: '즉시 AP +5~10 획득' }
        ];
        this.skillButtons = [];
        skillData.forEach((d, idx) => {
            const c = idx % 3; const r = Math.floor(idx / 3);
            const sx = (c - 1) * 240; const sy = (r - 0.5) * 200 + 40;
            const btn = this.add.container(sx, sy);

            const b = this.add.rectangle(0, 0, 230, 180, 0x5D4037).setStrokeStyle(2, 0xA1887F).setInteractive()
                .on('pointerdown', () => { this.gameScene.events.emit('actionSkill', idx); this.specialSkillsPanel.setVisible(false); if (this.adminApInput) this.adminApInput.setVisible(true); })
                .on('pointerover', function () { this.fillColor = 0x6D4C41; })
                .on('pointerout', function () { this.fillColor = 0x5D4037; });
            btn.add(b);

            btn.add(this.add.text(0, -45, d.name, { fontFamily: 'Ghanachocolate', fontSize: '28px', fill: '#FFCC80' }).setOrigin(0.5));
            btn.add(this.add.text(0, 20, d.desc, { fontFamily: 'Ghanachocolate', fontSize: '20px', fill: '#FFE0B2', align: 'center', wordWrap: { width: 210 } }).setOrigin(0.5));
            const cd = this.add.text(0, 60, '', { fontFamily: 'Ghanachocolate', fontSize: '32px', fill: '#deb989' }).setOrigin(0.5).setVisible(false);
            btn.add(cd);

            this.specialSkillsPanel.add(btn);
            this.skillButtons.push({ bg: b, name: btn.list[1], desc: btn.list[2], cd, baseName: d.name, baseDesc: d.desc });
        });

        this.createRoulettePanel(width, height);

        // Debug Buttons (Removed)

        // ... existing code ...
        this.time.delayedCall(100, () => this.updateUI());


    }

    createButton(x, y, text, callback) {
        const btn = this.add.text(x, y, text, {
            fontFamily: 'Ghanachocolate', fontSize: '18px', color: '#deb989', // User Requested 15px
            stroke: '#00000000', strokeThickness: 4,
            padding: { x: 10, y: 5 }
        })
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerdown', callback)
            .on('pointerover', () => {
                btn.setStyle({ fill: '#a8875b' }); // Blue visual feedback
                btn.setScale(1.0); // Slight pop -> remove
            })
            .on('pointerout', () => {
                btn.setStyle({ fill: '#deb989' });
                btn.setScale(1.0);
            });
        return btn;
    }

    updateUI() {
        if (!this.gameScene || !this.gameScene.gameManager) return;
        const gm = this.gameScene.gameManager;

        // 1. Timer
        let time = gm.timeLeft;

        if (gm.isSetupPhase) {
            // User requested to show numbers instead of "SETUP" text
            // Show default "60" or generic text if preferred, but user specifically asked for numbers back.
            this.timerText.setText("60");
            this.timerText.setColor('#3E2723'); // Regular Dark Brown
            this.timerText.setFontSize('100px');
        } else {
            if (time === undefined) time = 60;
            this.timerText.setText(time);
            this.timerText.setFontSize('100px');

            if (time <= 10) {
                this.timerText.setColor('#af2a13');
            } else {
                this.timerText.setColor('#3E2723');
            }
        }

        // 2. Round & Status
        this.roundText.setText(`Round ${gm.currentRound}`);
        const currentTeam = gm.getCurrentTeam();
        if (currentTeam) {
            this.statusText.setText(`${currentTeam.name}`); // Removed " Turn"
            this.statusText.setColor(this.getColorString(currentTeam.id));

            // Update AP Text
            this.turnApText.setVisible(true);
            this.turnApText.setText(`${currentTeam.ap} Pt`);
            // Optional: Color match?
            // this.turnApText.setColor(this.getColorString(currentTeam.id));
        } else {
            this.statusText.setText('AI Processing...');
            this.statusText.setColor('#af2a13');
            this.turnApText.setVisible(false);
        }

        // 3. Scoreboard (Using cached tile stats — only recomputes when tiles change)
        const stats = gm.getTileStats();
        const counts = stats.counts;
        const specialBonuses = stats.specialBonuses;

        for (let i = 1; i <= 6; i++) {
            const team = gm.teamData[i];
            const ui = this.teamInfoTexts[i];
            if (!team || !ui) {
                if (ui) { ui.name.setVisible(false); ui.land.setVisible(false); ui.ap.setVisible(false); }
                continue;
            }

            ui.name.setVisible(true); ui.land.setVisible(true); ui.ap.setVisible(true);
            ui.name.setColor(this.getColorString(i));

            // Show land count with purify count in parentheses (Part 2 only)
            const landCount = counts[i] || 0;
            const purifyCount = team.purifyCount || 0;
            const isPart2 = gm.currentRound > 15 || gm.isPart2;

            if (isPart2) {
                ui.land.setText(`${landCount} (${purifyCount})`);
            } else {
                ui.land.setText(landCount);
            }

            const territoryBonus = Math.floor(landCount / 4);
            const income = 4 + territoryBonus + (specialBonuses[i] || 0);
            ui.ap.setText(`${team.ap} (+${income})`);
            ui.name.setStroke('#00000000', 0);
        }

        // Part 2 Check - Hide purify column completely (now shown in parentheses)
        const isPart2 = gm.currentRound > 15 || gm.isPart2;
        if (this.purifyHeader) this.purifyHeader.setVisible(false); // Always hidden

        if (isPart2) {
            const ponixLand = counts[9] || 0;
            this.ponixInfo.name.setVisible(true);
            this.ponixInfo.land.setVisible(true);
            this.ponixInfo.land.setText(ponixLand);
        } else {
            this.ponixInfo.name.setVisible(false);
            this.ponixInfo.land.setVisible(false);
        }

        // Hide separate purify column (no longer used)
        for (let i = 1; i <= 6; i++) {
            const ui = this.teamInfoTexts[i];
            if (ui && ui.purify) ui.purify.setVisible(false);
        }

        // 4. Buttons
        if (gm.isPart2 && !this.purifyBtn.visible) this.purifyBtn.setVisible(true);

        if (this.pauseBtn) {
            this.pauseBtn.setText(gm.isPaused ? '< 재개 (P) >' : '< 일시정지 (P) >');
            this.pauseBtn.setStyle({ fill: '#deb989' });
        }

        // 6. Skill Buttons Update
        if (this.skillButtons && gm.getCurrentTeam()) {
            this.skillButtons.forEach((btn, idx) => {
                if (idx === 5) {
                    if (gm.isPart2) {
                        btn.name.setText('💉 백신 코드');
                        btn.desc.setText('주변 포닉스 정화');
                    } else {
                        btn.name.setText(btn.baseName);
                        btn.desc.setText(btn.baseDesc);
                    }
                }
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
            fontFamily: 'Ghanachocolate', fontSize: '24px', color: '#7e5f41',
            backgroundColor: '#20100690', padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        container.add(text);
        container.setDepth(100);
        this.tweens.add({
            targets: container, alpha: 0, duration: 1000, delay: 1000, // Display for 1s, fade for 1s = 2s total
            onComplete: () => { container.destroy(); if (this.currentToast === container) this.currentToast = null; }
        });
        this.currentToast = container;
    }

    createGameOverScreen(data) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Background Over - Dark Brown Theme
        this.add.rectangle(width / 2, height / 2, width, height, 0x2b1d0e, 0.95)
            .setDepth(2000)
            .setInteractive(); // Block input

        // 2. Messages based on Winner
        let mainMsg = "";
        let subMsg = "";
        let mainColor = "#deb989"; // Default Gold

        if (data.winner === 'Player') {
            mainMsg = `${data.winningTeam} 승리!`;
            subMsg = "포닉스를 몰아내고 넙죽이의 왕좌에 앉았습니다!";
            mainColor = "#deb989"; // Gold
        } else {
            mainMsg = "포닉스 승리";
            subMsg = "카이스트는 포닉스에게 결국 점령당했습니다...";
            mainColor = "#ff2764"; // Ponix Red
        }

        // 3. Display Text
        this.add.text(width / 2, height / 2 - 50, mainMsg, {
            fontFamily: 'Ghanachocolate', fontSize: '80px', fill: mainColor,
            stroke: '#4a3020', strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(2001);

        this.add.text(width / 2, height / 2 + 30, subMsg, {
            fontFamily: 'Ghanachocolate', fontSize: '40px', fill: '#e0c0a0',
            align: 'center'
        }).setOrigin(0.5).setDepth(2001);

        // 4. Buttons
        // Return to Map Button (Restart current map)
        const returnMapBtn = this.add.text(width / 2, height / 2 + 100, '맵으로 돌아가기', {
            fontFamily: 'Ghanachocolate', fontSize: '32px', fill: '#deb989',
            backgroundColor: '#4a3020', padding: { x: 20, y: 10 }
        })
            .setInteractive()
            .setOrigin(0.5)
            .setDepth(2001)
            .on('pointerover', () => returnMapBtn.setStyle({ fill: '#deb989' })) // Already gold, maybe lighter? Or keep.
            .on('pointerout', () => returnMapBtn.setStyle({ fill: '#deb989' }))
            .on('pointerdown', () => {
                // Let GameScene.shutdown() handle UIScene cleanup
                const mapId = this.gameScene.mapId;
                this.gameScene.scene.restart({ mapId: mapId });
            });

        // Return to Main Menu Button
        const restartBtn = this.add.text(width / 2, height / 2 + 160, '메인 메뉴로 돌아가기', {
            fontFamily: 'Ghanachocolate', fontSize: '32px', fill: '#deb989',
            backgroundColor: '#333333', padding: { x: 20, y: 10 }
        })
            .setInteractive()
            .setOrigin(0.5)
            .setDepth(2001)
            .on('pointerover', () => restartBtn.setStyle({ fill: '#a8875b' }))
            .on('pointerout', () => restartBtn.setStyle({ fill: '#deb989' }))
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
        const bg = this.add.rectangle(0, 0, panelW, panelH, 0x2b1d0e, 0.95)
            .setStrokeStyle(4, 0xdeb989);
        this.roulettePanel.add(bg);

        // Title
        this.rouletteTitle = this.add.text(0, -panelH / 2 + 50, '미니게임 룰렛', {
            fontFamily: 'Ghanachocolate', fontSize: '48px', fill: '#deb989'
        }).setOrigin(0.5);
        this.roulettePanel.add(this.rouletteTitle);

        // Skill Counts Text (Top Left)
        this.skillCountsText = this.add.text(-panelW / 2 + 30, -panelH / 2 + 30, '', {
            fontFamily: 'Ghanachocolate', fontSize: '24px', fill: '#e0c0a0',
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

        const arrowY = -radius - 5;
        const arrow = this.add.triangle(18, arrowY, 0, 10, 15, -25, -15, -25, 0xdeb989);
        this.roulettePanel.add(arrow);

        // Spin Button (Bottom)
        this.spinBtn = this.add.text(0, panelH / 2 - 80, 'SPIN', {
            fontFamily: 'Ghanachocolate', fontSize: '42px', fill: '#deb989', backgroundColor: '#4a3020',
            padding: { x: 30, y: 10 }
        })
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerdown', () => this.spinRoulette())
            .on('pointerover', function () { this.setStyle({ fill: '#a8875b' }); })
            .on('pointerout', function () { this.setStyle({ fill: '#deb989' }); });
        this.roulettePanel.add(this.spinBtn);

        // Close Button (Top Right corner of panel)
        const closeX = panelW / 2 - 40;
        const closeY = -panelH / 2 + 40;
        const closeBtn = this.add.text(closeX, closeY, 'X', {
            fontFamily: 'Arial', fontSize: '40px', fill: '#7e5f41', fontStyle: 'bold'
        })
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerdown', () => this.closeRoulette());
        this.roulettePanel.add(closeBtn);
    }

    drawWheel() {
        this.wheelContainer.removeAll(true);

        // Optimization: Use RenderTexture to cache the wheel drawing
        const radius = this.wheelRadius || 250;
        const width = radius * 2;
        const height = radius * 2;

        if (!this.wheelRT) {
            this.wheelRT = this.add.renderTexture(0, 0, width, height);
        } else {
            this.wheelRT.resize(width, height);
            this.wheelRT.clear();
        }

        // Add RT to container (centered)
        this.wheelRT.setOrigin(0.5);
        this.wheelContainer.add(this.wheelRT);

        let games;
        if (this.rouletteMode === 'SPECIAL') {
            // map objects to names for display
            games = this.activeSpecialSkills.map(s => s.name);
        } else {
            games = this.miniGames;
        }

        if (games.length === 0) {
            const noGameText = this.add.text(0, 0, "No Games Left", {
                fontFamily: 'Ghanachocolate', fontSize: '32px', fill: '#888888'
            }).setOrigin(0.5);
            this.wheelContainer.add(noGameText);

            // Also clear RT if no games
            this.wheelRT.clear();
            return;
        }

        const sliceAngle = 360 / games.length;
        const colors = [0x8B4513, 0xA0522D, 0xD2691E, 0xCD853F, 0xDEB887, 0xF4A460, 0xD2B48C]; // Brown shades

        games.forEach((game, idx) => {
            const startAngle = Phaser.Math.DegToRad(idx * sliceAngle);
            const endAngle = Phaser.Math.DegToRad((idx + 1) * sliceAngle);
            const color = colors[idx % colors.length];

            // Slice Graphics
            const slice = this.make.graphics({ x: 0, y: 0, add: false });
            slice.fillStyle(color, 1);
            slice.lineStyle(2, 0x000000, 1);
            slice.beginPath();
            slice.moveTo(0, 0);
            slice.arc(0, 0, radius, startAngle, endAngle);
            slice.closePath();
            slice.fillPath();
            slice.strokePath();

            // Draw slice to RT at center (radius, radius)
            this.wheelRT.draw(slice, radius, radius);
            slice.destroy();

            // Text Label
            const midAngle = startAngle + (endAngle - startAngle) / 2;
            const textRadius = radius * 0.6;
            const tx = Math.cos(midAngle) * textRadius;
            const ty = Math.sin(midAngle) * textRadius;

            // Coordinates in RT space: (radius + tx, radius + ty)
            const label = this.make.text({
                x: radius + tx,
                y: radius + ty,
                text: game,
                style: {
                    fontFamily: 'Ghanachocolate', fontSize: '30px', fill: '#ffffff', stroke: '#201006', strokeThickness: 3
                },
                add: false
            }).setOrigin(0.5);

            label.setRotation(midAngle);
            this.wheelRT.draw(label);
            label.destroy();
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
                const color = count >= 5 ? '#ff0000' : '#deb989';
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
            fontFamily: 'Ghanachocolate', fontSize: '40px', fill: '#edd4b3', backgroundColor: '#201006B0',
            stroke: '#00000000', strokeThickness: 4, padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        this.wheelContainer.add(winText);
        winText.setAngle(-finalAngle); // Counter-rotate to keep text upright

        if (this.rouletteMode === 'MINIGAME') {
            this.miniGames.splice(safeIdx, 1);
        }

        this.time.delayedCall(2000, () => {
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
            '#ff8400', // 1 Orange
            '#f4cd18', // 2 Yellow
            '#86eb03', // 3 Green
            '#3fbaee', // 4 Blue (Brightened from #0000FF)
            '#af87ff', // 5 Purple (Brightened from #800080)
            '#ff86de', // 6 Pink (Updated from Brown)
            '#888888',
            '#888888',
            '#ff2764'  // 9 Ponix
        ];
        return colors[id] || '#deb989';
    }
}
