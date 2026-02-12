import HexGrid from '../objects/HexGrid.js';
import GameManager from '../objects/GameManager.js';
import AIController from '../objects/AIController.js';
import SaveManager from '../utils/SaveManager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.actionHistory = []; // Stack for Undo
    }

    init(data) {
        this.mapId = data.mapId || 1; // Default to 1
        this.loadGame = data.loadGame || false; // Check for Load Flag
        console.log(`Loading Map ID: ${this.mapId}, Load Save: ${this.loadGame}`);
    }

    create() {
        console.log("GameScene: create() started");
        // alert("GameScene: Entered Create"); // Debug - Active
        try {
            // Background - Phase 1 Initially
            this.bg = this.add.image(0, 0, 'bg_phase1').setOrigin(0, 0);
            // Scale to fit
            this.bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

            // Send to back so grid is on top
            this.bg.setDepth(-10);

            // Launch UI Scene in parallel
            console.log("GameScene: Launching UIScene");
            this.scene.launch('UIScene');

            // Initialize Grid
            // Reduced size for larger map (200 tiles) -> Updated to 42 (105% of 40)
            // Shifted further left to 0.30 to make room for UI
            // Position adjusted: +30px right, -35px up
            console.log("GameScene: Initialize Grid");
            this.grid = new HexGrid(this, this.cameras.main.width * 0.35 + 30, this.cameras.main.height / 2 - 35, 42, 15, this.mapId);

            // Initialize Managers
            console.log("GameScene: Initialize Managers");
            this.gameManager = new GameManager(this, this.grid);
            this.aiController = new AIController(this, this.grid);

            // Event Listeners
            this.events.on('aiTurnStart', () => {
                console.log("AI Turn Start");
                this.aiController.runTurn(() => {
                    this.gameManager.endTurn();
                });
            });

            this.events.on('part2Started', () => {
                // Switch Background
                this.bg.setTexture('bg_phase2');
                this.bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
            });

            // Start Game or Load Game
            if (this.loadGame) {
                console.log("GameScene: Loading Saved Game...");
                const success = SaveManager.load(this.gameManager);
                if (!success) {
                    console.log("Load failed, starting new game.");
                    SaveManager.clearSave(); // Clear corrupt save
                    this.gameManager.initGame();
                } else {
                    // mapId might be overwritten by save data, but we passed it in init too. 
                    // SaveManager.load overwrites GM props, so we should be good?
                    // Wait, HexGrid was initiated with this.mapId. If save has different mapId, we have a mismatch!
                    // Implementation Plan Detail: "If loadGame is true, call SaveSystem.load(...) instead of gameManager.initGame()."
                    // Ideally check mapId before creating grid? 
                    // But we are in Create... 
                    // Let's assume Map ID is consistent or saved data implies logic.
                    // For now, simplest approach.
                }
            } else {
                console.log("GameScene: Starting New Game");
                SaveManager.clearSave(); // Clear old save
                this.gameManager.initGame();
            }

        } catch (error) {
            console.error("GameScene Create Error:", error);
            alert(`Game Error: ${error.message}`);
        }

        // Input Handling for Actions
        this.input.on('gameobjectdown', (pointer, gameObject) => {
            if (gameObject instanceof Phaser.GameObjects.Container) // Check if tile
                this.handleInput(gameObject);
        });

        this.setupActionListeners();

        // Cleanup on Scene Shutdown
        this.events.on('shutdown', this.cleanup, this);
        this.events.on('destroy', this.cleanup, this);
    }

    cleanup() {
        // Destroy Managers
        if (this.gameManager) {
            this.gameManager.destroy();
            this.gameManager = null;
        }
        if (this.aiController) {
            this.aiController.destroy();
            this.aiController = null;
        }

        // Destroy Grid
        if (this.grid) {
            this.grid.destroy();
            this.grid = null;
        }

        // Remove ALL Listeners (Nuclear Option for Safety)
        this.events.removeAllListeners();

        // Remove Input Listeners
        this.input.off('gameobjectdown');

        console.log("GameScene cleanup complete.");
    }

    shutdown() {
        console.log("GameScene: shutdown() called");

        // Stop UIScene if it's running
        if (this.scene.isActive('UIScene')) {
            this.scene.stop('UIScene');
        }

        // Call cleanup
        this.cleanup();
    }



    selectTile(tile) {
        if (this.selectedTile) {
            this.selectedTile.deselect();
        }
        this.selectedTile = tile;
        this.selectedTile.select();
    }

    setupActionListeners() {
        this.events.on('actionRecruit', () => this.actionRecruit());
        this.events.on('actionFortify', () => this.actionFortify());
        this.events.on('actionExpand', () => this.actionExpand());
        this.events.on('actionPurify', () => this.actionPurify());
        this.events.on('actionUndo', () => this.actionUndo()); // UNDO Listener
        this.events.on('actionEndTurn', () => {
            this.gameManager.endTurn();
        });
        this.events.on('actionAdminAP', (data) => this.actionAdminAP(data));

        this.events.on('actionTogglePause', () => {
            this.gameManager.togglePause();
        });

        // Keyboard Shortcuts
        this.input.keyboard.on('keydown-Q', () => this.actionRecruit());
        this.input.keyboard.on('keydown-W', () => this.actionFortify());
        this.input.keyboard.on('keydown-E', () => this.actionExpand());
        this.input.keyboard.on('keydown-R', () => this.actionPurify());
        this.input.keyboard.on('keydown-A', () => this.actionUndo());
        this.input.keyboard.on('keydown-P', () => {
            this.gameManager.togglePause();
        });
        this.input.keyboard.on('keydown-SPACE', () => this.gameManager.endTurn());

        // Skill Event
        this.events.on('actionSkill', (idx) => this.actionSkill(idx));
    }

    actionSkill(skillIdx) {
        const team = this.gameManager.getCurrentTeam();
        if (!team) return;

        // 1. Check Cooldown (Disabled)

        // 2. Skill 6 (Index 5) Special Handling (Dice vs Vaccine)
        if (skillIdx === 5 && !this.gameManager.isPart2) {
            // Random Dice (Instant)
            const bonus = Phaser.Math.Between(5, 10);
            team.ap += bonus;
            console.log(`Skill: Random Dice -> +${bonus} AP`);

            // Push History
            this.pushAction({
                type: 'SKILL_DICE',
                amount: bonus
            });

            this.events.emit('showToast', `랜덤 다이스! (+${bonus} Pt)`);
            this.events.emit('updateUI');
            return;
        }

        // 3. Enter Target Mode
        this.purifyMode = false;
        this.expandMode = false;
        this.skillMode = { active: true, skillIdx: skillIdx };
        this.gameManager.setTimerPaused(true); // Pause Timer for Target Selection

        const skillNames = ['EMP 충격파', '퀀텀 점프', '방화벽', '장학금 탈취', '오버클럭', '백신 코드'];
        this.events.emit('showToast', `${skillNames[skillIdx]}: 대상을 선택하세요.`);
    }

    executeSkill(target, skillIdx) {
        const team = this.gameManager.getCurrentTeam();
        let success = false;

        switch (skillIdx) {
            case 0: // EMP Blast: Target + Radius 1 -> Power -2 (Min 1)
                const empTargets = [target, ...this.grid.getNeighbors(target)];
                const empChanges = [];

                empTargets.forEach(t => {
                    if (t.ownerID !== team.id && !t.isShielded && t.power > 1) { // Logic match below
                        empChanges.push({
                            tile: t,
                            prevPower: t.power,
                            prevShield: t.isShielded
                        });
                    }
                });

                if (empChanges.length > 0) {
                    empTargets.forEach(t => {
                        if (t.power > 1 && !t.isShielded && t.ownerID !== team.id) {
                            t.setPower(Math.max(1, t.power - 2));
                            t.draw();
                        }
                    });

                    this.pushAction({
                        type: 'SKILL',
                        skillIdx: 0,
                        changes: empChanges
                    });
                    success = true;
                } else {
                    this.events.emit('showToast', "효과를 받을 대상이 없습니다.");
                }
                break;

            case 1: // Quantum Jump: Empty (Gray) OR Weak Enemy (Power 1) -> Mine
                if ((target.ownerID === 0 || (target.ownerID !== team.id && target.power === 1)) && !target.isShielded) {
                    this.pushAction({
                        type: 'SKILL',
                        skillIdx: 1,
                        changes: [{
                            tile: target,
                            prevOwner: target.ownerID,
                            prevPower: target.power,
                            prevShield: target.isShielded
                        }]
                    });

                    target.setOwner(team.id);
                    target.setPower(1);
                    target.draw();
                    success = true;
                } else {
                    if (target.isShielded) {
                        this.events.emit('showToast', "보호막이 있는 땅은 점령할 수 없습니다.");
                    } else {
                        this.events.emit('showToast', "비어있거나 약한 적(전투력 1)의 땅만 가능합니다.");
                    }
                }
                break;

            case 2: // Firewall: Own + Neighbors(Own) -> Shield
                if (target.ownerID === team.id) {
                    const fwTargets = [target, ...this.grid.getNeighbors(target).filter(n => n.ownerID === team.id)];
                    const fwChanges = [];

                    fwTargets.forEach(t => {
                        if (!t.isShielded) { // Only record if it changes
                            fwChanges.push({
                                tile: t,
                                prevShield: t.isShielded
                            });
                        }
                        t.isShielded = true;
                        t.draw();
                    });

                    // Even if all shielded, we count as success? Or only if at least one applied?
                    // Let's assume always success for feedback, but save minimal state
                    // If no changes, undo does nothing, which is fine.
                    this.pushAction({
                        type: 'SKILL',
                        skillIdx: 2,
                        changes: fwChanges
                    });
                    success = true;
                } else {
                    this.events.emit('showToast', "내 땅을 선택해야 합니다.");
                }
                break;

            case 3: // Scholarship: Own -> Neighbors(Enemy & Power < Target) -> Mine
                if (target.ownerID === team.id) {
                    const neighbors = this.grid.getNeighbors(target);
                    let converted = false;
                    const schChanges = [];

                    neighbors.forEach(n => {
                        const isNeutral = n.ownerID === 0;
                        const canCapture = isNeutral ? (target.power >= 2) : (n.power < target.power);

                        if (n.ownerID !== team.id && !n.isShielded && canCapture) {
                            schChanges.push({
                                tile: n,
                                prevOwner: n.ownerID,
                                prevPower: n.power,
                                prevShield: n.isShielded
                            });

                            n.setOwner(team.id);
                            n.setPower(1);
                            n.draw();
                            converted = true;
                        }
                    });

                    if (converted) {
                        this.pushAction({
                            type: 'SKILL',
                            skillIdx: 3,
                            changes: schChanges
                        });
                        success = true;
                    }
                    else this.events.emit('showToast', "주변에 흡수할 수 있는 약한 적(보호막 X)이 없습니다.");
                } else {
                    this.events.emit('showToast', "내 땅을 선택해야 합니다.");
                }
                break;

            case 4: // Overclock: Own + Neighbors -> Power +3 (Max 5)
                if (target.ownerID === team.id) {
                    const ocChanges = [];

                    // Target
                    if (target.power < 5) {
                        ocChanges.push({ tile: target, prevPower: target.power });
                        target.setPower(Math.min(5, target.power + 3));
                        target.draw();
                    }

                    // Neighbors (Own Only)
                    const ocNeighbors = this.grid.getNeighbors(target);
                    ocNeighbors.forEach(n => {
                        if (n.ownerID === team.id && n.power < 5) {
                            ocChanges.push({ tile: n, prevPower: n.power });
                            n.setPower(Math.min(5, n.power + 3));
                            n.draw();
                        }
                    });

                    this.pushAction({
                        type: 'SKILL',
                        skillIdx: 4,
                        changes: ocChanges
                    });
                    success = true;
                } else {
                    this.events.emit('showToast', "내 땅을 선택해야 합니다.");
                }
                break;

            case 5: // Vaccine Code: Target -> Neighbors(Ponix) -> Neutral
                const vNeighbors = this.grid.getNeighbors(target);
                let cleaned = false;
                const vacChanges = [];

                // Helper to apply
                const applyVaccine = (t) => {
                    vacChanges.push({
                        tile: t,
                        prevOwner: t.ownerID,
                        prevPower: t.power,
                        prevShield: t.isShielded
                    });
                    t.setOwner(0);
                    t.setPower(1);
                    t.isShielded = false;
                    t.draw();
                };

                vNeighbors.forEach(n => {
                    if (n.ownerID === 9 && !n.isShielded) {
                        applyVaccine(n);
                        cleaned = true;
                    }
                });

                if (target.ownerID === 9 && !target.isShielded) {
                    applyVaccine(target);
                    cleaned = true;
                }

                if (cleaned) {
                    this.pushAction({
                        type: 'SKILL',
                        skillIdx: 5,
                        changes: vacChanges
                    });
                    success = true;
                }
                else this.events.emit('showToast', "주변에 정화할 수 있는 포닉스가 없습니다 (또는 보호막).");
                break;
        }

        if (success) {
            this.skillMode = null; // Exit mode
            this.gameManager.setTimerPaused(false); // Resume Timer
            this.events.emit('updateUI');
            this.gameManager.addTime(5); // Action time bonus
            this.events.emit('showToast', "스킬 사용 성공!");
        }
    }

    // --- UNDO SYSTEM ---
    pushAction(action) {
        this.actionHistory.push(action);
        // Auto-Save after every action
        SaveManager.save(this.gameManager);
    }

    actionUndo() {
        if (this.actionHistory.length === 0) {
            console.log("Nothing to undo");
            return;
        }

        const lastAction = this.actionHistory.pop();
        let team = this.gameManager.getCurrentTeam(); // Use let as team might change

        // Restore State
        switch (lastAction.type) {
            case 'RECRUIT':
            case 'FORTIFY':
                lastAction.tile.setPower(lastAction.prevPower);
                lastAction.tile.isShielded = lastAction.prevShield;
                lastAction.tile.draw();
                break;
            case 'EXPAND':
                lastAction.target.setOwner(0); // Restore to Neutral
                lastAction.target.setPower(0); // Neutral has 0 power
                lastAction.target.draw();
                break;
            case 'PURIFY':
                lastAction.target.setOwner(lastAction.prevOwner); // Restore Phonics
                lastAction.target.setPower(lastAction.prevPower);
                lastAction.target.isShielded = lastAction.prevShield; // Restore Shield
                lastAction.target.draw();

                // Fix: Decrement Purify Count
                if (team.purifyCount > 0) {
                    team.purifyCount--;
                }
                break;
            case 'ATTACK':
                lastAction.target.setOwner(lastAction.prevTargetOwner);
                lastAction.target.setPower(lastAction.prevTargetPower);
                lastAction.target.isShielded = lastAction.prevTargetShield;
                lastAction.target.draw();

                lastAction.source.setPower(lastAction.prevSourcePower);
                lastAction.source.setOwner(lastAction.prevSourceOwner);
                lastAction.source.draw();
                break;
            case 'TURN_CHANGE':
                console.log("Undoing Turn Change...");
                // 1. Revert Turn/Round
                this.gameManager.currentTurn = lastAction.prevTurn;
                this.gameManager.currentRound = lastAction.prevRound;

                // 2. Remove Income from the team that JUST started (lastAction.newTurn)
                const incomeReceiver = this.gameManager.teamData[lastAction.newTurn];
                if (incomeReceiver) {
                    incomeReceiver.ap -= lastAction.income;
                    console.log(`Removed ${lastAction.income} AP from Team ${incomeReceiver.id} (Undo Turn Start)`);
                    // Revert Expansion Bonus Flag
                    if (lastAction.expansionBonusGiven) {
                        incomeReceiver.expansionDone = false;
                    }
                }

                // 3. Refresh 'team' variable to point to CURRENT team (the one we reverted TO)
                team = this.gameManager.getCurrentTeam();

                // 4. Revert Tile Changes (Decay, Shield Expiry)
                if (lastAction.changes && lastAction.changes.length > 0) {
                    console.log(`Undoing ${lastAction.changes.length} tile changes (Decay/Shields)`);
                    lastAction.changes.forEach(change => {
                        change.tile.setPower(change.prevPower);
                        change.tile.isShielded = change.prevShield;
                        change.tile.draw();
                    });
                }

                // 5. Revert Special Events (Ponix Invasion)
                if (lastAction.specialEvent && lastAction.specialEvent.type === 'PONIX_SPAWN') {
                    console.log("Reverting Ponix Invasion...");
                    const event = lastAction.specialEvent;

                    // Revert Tiles (Remove Ponix, Restore Owner/Power/Shield)
                    event.changes.forEach(change => {
                        change.tile.setOwner(change.prevOwner);
                        change.tile.setPower(change.prevPower);
                        change.tile.isShielded = change.prevShield;
                        change.tile.isPermanentShield = change.prevPermShield;
                        change.tile.draw();
                    });

                    // Revert Compensation
                    event.compensatedTeams.forEach(comp => {
                        const teamData = this.gameManager.teamData[comp.teamId];
                        if (teamData) {
                            teamData.ap -= comp.amount;
                            console.log(`Reverted Compensation: ${teamData.name} lost ${comp.amount} AP`);
                        }
                    });

                    this.gameManager.isPart2 = false; // Reset Invasion Flag
                }

                this.gameManager.resetTurnTimer();
                this.events.emit('updateUI');
                console.log("Turn Change Undone");
                // Save after undo
                SaveManager.save(this.gameManager);
                return; // Early return as we handled AP/Update inside

            case 'ADMIN_AP_CHANGE':
                const targetTeam = this.gameManager.teamData[lastAction.teamId];
                if (targetTeam) {
                    targetTeam.ap -= lastAction.amount;
                    console.log(`Undo Admin AP: ${targetTeam.name} ${lastAction.amount > 0 ? '-' : '+'}${Math.abs(lastAction.amount)} AP`);
                }
                this.events.emit('updateUI');
                // Save after undo
                SaveManager.save(this.gameManager);
                return; // Early return

            case 'SKILL_DICE':
                if (team) {
                    team.ap -= lastAction.amount;
                    console.log(`Undo Skill Dice: -${lastAction.amount} AP`);
                }
                this.events.emit('updateUI');
                // Save after undo
                SaveManager.save(this.gameManager);
                return;

            case 'SKILL':
                console.log(`Undoing Skill ${lastAction.skillIdx}...`);
                if (lastAction.changes) {
                    lastAction.changes.forEach(change => {
                        if (change.prevOwner !== undefined) change.tile.setOwner(change.prevOwner);
                        if (change.prevPower !== undefined) change.tile.setPower(change.prevPower);
                        if (change.prevShield !== undefined) change.tile.isShielded = change.prevShield;
                        change.tile.draw();
                    });
                }
                // Save after undo
                SaveManager.save(this.gameManager);
                return;


        }

        // Refund AP (for normal actions)
        if (team) {
            team.ap += lastAction.cost;
        }
        this.events.emit('updateUI');
        console.log("Undo Successful");
        // Save after undo
        SaveManager.save(this.gameManager);
    }

    actionAdminAP(data) {
        // data: { teamId, amount }
        const team = this.gameManager.teamData[data.teamId];
        if (!team) return;

        team.ap += data.amount;
        console.log(`Admin AP Change: ${team.name} ${data.amount > 0 ? '+' : ''}${data.amount} AP`);

        // Push History
        this.pushAction({
            type: 'ADMIN_AP_CHANGE',
            teamId: data.teamId,
            amount: data.amount
        });

        this.events.emit('updateUI');
        this.events.emit('showToast', `${team.name}: ${data.amount > 0 ? '+' : ''}${data.amount} Pt 적용 완료`);
    }

    handleInput(tile) {
        if (!this.gameManager) return;

        // Setup Phase Logic
        if (this.gameManager.isSetupPhase) {
            this.gameManager.handleSetupClick(tile);
            // Auto-Save during Setup
            SaveManager.save(this.gameManager);
            return;
        }

        const team = this.gameManager.getCurrentTeam();
        if (!team) return;

        // Skill Mode Logic
        if (this.skillMode && this.skillMode.active) {
            this.executeSkill(tile, this.skillMode.skillIdx);
            return;
        }

        // Purify Mode Logic
        if (this.purifyMode) {
            // Check if Target is Ponix (Owner 9) OR if it's a Special Tile occupied by Ponix (checking owner should suffice, but being explicit)
            if (tile.ownerID === 9) {
                this.tryPurify(tile, team);
            } else {
                console.log(`Invalid Purify Target: Owner ${tile.ownerID}`);
                this.events.emit('showToast', "포닉스 타일을 선택하세요!");
            }
            // Turn off mode
            this.purifyMode = false;
            return;
        }

        // Expand Mode Logic
        if (this.expandMode) {
            if (tile.ownerID === 0) {
                this.tryExpand(tile, team);
            } else {
                this.events.emit('showToast', "확장할 회색 땅을 선택하세요!");
            }
            this.expandMode = false;
            return;
        }

        // Selection Logic
        if (tile.ownerID === team.id) {
            this.selectTile(tile);
            console.log("Selected Own Tile");
        } else {
            // If we have a selected tile, try to attack it
            if (this.selectedTile && this.selectedTile.ownerID === team.id) {
                this.tryAttack(tile, team);
            }
        }
    }

    actionPurify() {
        this.expandMode = false;
        this.skillMode = null;
        this.gameManager.setTimerPaused(false); // Resume if cancelled
        const team = this.gameManager.getCurrentTeam();

        if (team.ap < 1) { // Min check for UI feedback
            this.events.emit('showToast', "Pt가 부족합니다 (최소 1 필요)");
            return;
        }

        this.purifyMode = true;
        this.events.emit('showToast', "정화 모드: 비용은 대상의 전투력과 같습니다.");
    }

    tryPurify(target, team) {
        // Invincibility Check (Round 9)
        if (this.gameManager.currentRound === 9) {
            this.events.emit('showToast', "9라운드에는 포닉스가 무적입니다!");
            return;
        }



        // Cost Check (Variable: Target Power)
        const cost = target.power;

        if (team.ap < cost) {
            this.events.emit('showToast', `Pt가 부족합니다! (필요: ${cost})`);
            return;
        }

        // Push History
        this.pushAction({
            type: 'PURIFY',
            target: target,
            prevOwner: 9,
            prevPower: target.power,
            prevShield: target.isShielded,
            cost: cost
        });

        // Effect: Neutralize regardless of Power or Special Status
        console.log(`Purifying Tile: ${target.q},${target.r} (Power: ${target.power}, Cost: ${cost})`);

        target.setOwner(0); // Neutral
        target.setPower(1); // Weak
        target.isShielded = false; // Remove Shield if any
        target.draw(); // Force Redraw

        team.ap -= cost;
        team.purifyCount = (team.purifyCount || 0) + 1; // Increment Count

        this.events.emit('showToast', "정화 성공!");
        this.events.emit('updateUI');
        this.gameManager.addTime(5);
    }

    actionExpand() {
        this.purifyMode = false;
        this.skillMode = null;
        this.gameManager.setTimerPaused(false); // Resume if cancelled
        const team = this.gameManager.getCurrentTeam();

        if (team.ap < 3) {
            this.events.emit('showToast', "Pt가 부족합니다 (필요: 3)");
            return;
        }

        this.expandMode = true;
        this.events.emit('showToast', "확장 모드: 인접한 중립 땅을 클릭하세요.");
    }

    tryExpand(target, team) {
        // Needs an adjacent OWNED tile.
        // We iterate through neighbors of the target to see if ANY belong to the team.
        const neighbors = this.grid.getNeighbors(target);
        let hasAdjacentOwn = false;
        for (let n of neighbors) {
            if (n.ownerID === team.id) {
                hasAdjacentOwn = true;
                break;
            }
        }

        if (!hasAdjacentOwn) {
            this.events.emit('showToast', "인접한 아군 영토가 있어야 합니다!");
            return;
        }

        // Cost Check (Double check)
        if (team.ap < 3) return;

        // Push History
        this.pushAction({
            type: 'EXPAND',
            target: target,
            cost: 3
        });

        console.log(`Expanding to Tile: ${target.q},${target.r}`);

        target.setOwner(team.id);
        target.setPower(1); // Specified in request
        target.draw();

        team.ap -= 3;
        this.events.emit('updateUI');
        this.gameManager.addTime(5);
    }

    actionRecruit() {
        this.purifyMode = false; // Reset modes
        this.expandMode = false;
        this.skillMode = null;
        this.gameManager.setTimerPaused(false); // Resume if cancelled
        const team = this.gameManager.getCurrentTeam();
        if (!this.selectedTile || this.selectedTile.ownerID !== team.id) {
            console.log("No valid tile selected.");
            return;
        }
        if (team.ap < 1) {
            console.log("Not enough AP");
            return;
        }
        if (this.selectedTile.power >= 5) {
            console.log("Max Power Reached");
            return;
        }

        // Push History
        this.pushAction({
            type: 'RECRUIT',
            tile: this.selectedTile,
            prevPower: this.selectedTile.power,
            prevShield: this.selectedTile.isShielded,
            cost: 1
        });

        this.selectedTile.setPower(this.selectedTile.power + 1);
        this.selectedTile.draw();
        team.ap -= 1;
        this.events.emit('updateUI');
        this.gameManager.addTime(5);
    }

    actionFortify() {
        this.purifyMode = false; // Reset modes
        this.expandMode = false;
        this.skillMode = null;
        this.gameManager.setTimerPaused(false); // Resume if cancelled
        const team = this.gameManager.getCurrentTeam();
        if (!this.selectedTile || this.selectedTile.ownerID !== team.id) return;

        // Prevent fortifying if already shielded
        if (this.selectedTile.isShielded) {
            this.events.emit('showToast', "이미 보호막이 있습니다!");
            return;
        }

        if (team.ap < 2) return;

        // Push History
        this.pushAction({
            type: 'FORTIFY',
            tile: this.selectedTile,
            prevPower: this.selectedTile.power,
            prevShield: false,
            cost: 2
        });

        this.selectedTile.isShielded = true;
        this.selectedTile.draw();
        team.ap -= 2;
        this.events.emit('updateUI');
        this.gameManager.addTime(5);
    }

    tryAttack(target, team) {
        // Check if Ponix and Round 9
        if (target.ownerID === 9 && this.gameManager.currentRound === 9) {
            this.events.emit('showToast', "9라운드에는 포닉스가 무적입니다!");
            return;
        }

        const source = this.selectedTile;
        if (!source || source.ownerID !== team.id) return; // Logic check

        const distance = this.grid.getDistance(source, target);
        if (distance !== 1) {
            console.log("Too far");
            this.events.emit('showToast', "거리가 너무 멉니다.");
            return;
        }

        // 2. Costs 2 AP
        if (team.ap < 2) {
            console.log("Not enough AP");
            this.events.emit('showToast', "Pt가 부족합니다 (필요: 2)"); // Optional feedback
            return;
        }

        // Push History (Save BEFORE changing)
        this.pushAction({
            type: 'ATTACK',
            source: source,
            target: target,
            prevSourcePower: source.power,
            prevSourceOwner: source.ownerID,
            prevTargetPower: target.power,
            prevTargetOwner: target.ownerID,
            prevTargetShield: target.isShielded,
            cost: 2
        });

        // 3. Power Logic
        // Neutral Tile Logic
        if (target.ownerID === 0) {
            if (source.power >= 2) { // Explicitly >= 2
                target.setOwner(team.id);
                target.setPower(source.power - 1);
                source.setPower(1);
                target.draw();
                source.draw();
                team.ap -= 2;
            } else {
                console.log("Not enough power to conquer Neutral (Need >= 2)");
                this.events.emit('showToast', "중립 정복엔 전투력 2 이상 필요!");
                this.actionHistory.pop(); // Remove failed action
                return;
            }
        }
        // Enemy Logic
        else if (source.power > target.power && !target.isShielded) {
            // Victory
            target.setOwner(team.id);
            target.setPower(Math.max(1, source.power - target.power));
            source.setPower(1);
            target.draw();
            source.draw();
            team.ap -= 2;
        } else {
            console.log("Attack Failed: Weak or Shielded");
            this.events.emit('showToast', "공격 실패! (상대가 너무 강하거나 보호막)");
            this.actionHistory.pop(); // Remove failed action
            return;
        }

        this.events.emit('updateUI');
        this.gameManager.addTime(5);
    }

    update() {
        // Game loop
    }
}
