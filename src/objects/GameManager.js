export default class GameManager {
    constructor(scene, grid) {
        this.scene = scene;
        this.grid = grid;

        // Settings
        this.mapId = this.scene.mapId || 1;
        this.teams = 6; // Enable 6 Teams for ALL maps (including KAIST)
        this.currentRound = 1;
        this.currentTurn = 1; // 1-6 = Teams, 9 = AI
        this.isPart2 = false;

        // Team Data (0 is neutral placeholder)
        this.teamData = [
            null,
            { id: 1, color: 'Orange', ap: 0, name: '주황 넙죽이' }, // North
            { id: 2, color: 'Yellow', ap: 0, name: '노랑 넙죽이' }, // East
            { id: 3, color: 'Green', ap: 0, name: '초록 넙죽이' },  // West
            { id: 4, color: 'Blue', ap: 0, name: '파랑 넙죽이' },    // South
            { id: 5, color: 'Purple', ap: 0, name: '보라 넙죽이' },  // Center
            { id: 6, color: 'Pink', ap: 0, name: '분홍 넙죽이' }   // Map 2 & 3 Special -> Now Map 1 too
        ];

        // Allowed Start Indices
        this.startIndices = [14, 38, 61, 98, 116, 121];

        this.eventListeners = {
            onTurnStart: [],
            onTurnEnd: []
        };
    }

    initGame() {
        this.currentRound = 1;
        this.currentTurn = 1;

        // Pre-set Initial AP for all teams (Round 1)
        for (let i = 1; i < this.teamData.length; i++) {
            if (!this.teamData[i]) continue;
            this.teamData[i].purifyCount = 0; // Initialize Purify Count
            this.teamData[i].expansionDone = false; // Initialize Bonus Flag
            this.teamData[i].cooldowns = [0, 0, 0, 0, 0, 0]; // Initialize Cooldowns
            if (i <= 2) this.teamData[i].ap = 9;
            else if (i <= 4) this.teamData[i].ap = 10;
            else this.teamData[i].ap = 11;
        }

        // Skill Roulette Counters (Indices: 0-5)
        this.skillRouletteCounts = [0, 0, 0, 0, 0, 0];

        // Initialize Setup Phase
        this.isSetupPhase = true;
        this.setupTurn = 1;
        this.currentTurn = 1; // Sync for UI

        // Initial UI Update
        this.scene.events.emit('updateUI');
        this.scene.events.emit('showToast', `${this.teamData[1].name}: 시작 위치를 선택하세요.`);

        // Highlight Allowed Start Positions
        this.highlightStartPositions();
    }

    highlightStartPositions() {
        const tiles = this.grid.getAllTiles();
        tiles.forEach(tile => {
            if (this.startIndices.includes(tile.index)) {
                tile.isStartCandidate = true;
                tile.draw();
            }
        });

    }

    handleSetupClick(tile) {
        if (!this.isSetupPhase) return;

        // 1. Check if occupied
        if (tile.ownerID !== 0) {
            this.scene.events.emit('showToast', "이미 점령된 타일입니다.");
            return;
        }

        // 1.5. Check if Allowed Start Position
        if (!this.startIndices.includes(tile.index)) {
            this.scene.events.emit('showToast', "지정된 시작 위치만 선택 가능합니다 (초록색 타일).");
            return;
        }

        // 2. Check Distance from ANY Special Tile (>= 2)
        // Distance < 2 means: 0 (itself) or 1 (adjacent)
        const allTiles = this.grid.getAllTiles();
        for (const t of allTiles) {
            if (t.isSpecial) {
                const dist = this.grid.getDistance(tile, t);
                if (dist < 2) {
                    this.scene.events.emit('showToast', "특수 타일과 인접할 수 없습니다 (2칸 이상 거리 필요).");
                    return;
                }
            }
        }

        // 3. Confirm Selection
        const teamId = this.setupTurn;
        tile.setOwner(teamId);
        tile.setPower(1);
        tile.isPermanentShield = true;
        tile.isShielded = true;
        tile.draw();

        console.log(`Team ${teamId} chose Start: ${tile.q},${tile.r}`);

        // 4. Next Team or Start Game
        this.setupTurn++;
        console.log(`Setup Turn Advancing. Next: ${this.setupTurn} / ${this.teams}`);

        if (this.setupTurn > this.teams) {
            console.log("Setup Phase Complete. Starting Game...");
            this.isSetupPhase = false;
            this.scene.events.emit('showToast', "게임 시작!");

            // Clear Start Highlights
            const tiles = this.grid.getAllTiles();
            tiles.forEach(tile => {
                tile.isStartCandidate = false;
                tile.draw();
            });

            this.currentTurn = 1; // Reset to Team 1
            this.startTurn();
        } else {
            this.currentTurn = this.setupTurn; // Update for UI
            this.scene.events.emit('updateUI');
            this.scene.events.emit('showToast', `${this.teamData[this.setupTurn].name}: 시작 위치를 선택하세요.`);
        }
    }



    togglePause() {
        this.isPaused = !this.isPaused;
        console.log(`Game Paused: ${this.isPaused}`);
        this.scene.events.emit('updateUI'); // Update UI to show Paused state

        if (this.isPaused) {
            if (this.timerEvent) this.timerEvent.paused = true;
        } else {
            if (this.timerEvent) this.timerEvent.paused = false;
        }
    }

    setTimerPaused(isPaused) {
        if (this.isPaused === isPaused) return; // No change
        this.isPaused = isPaused;
        console.log(`Game Timer Paused: ${this.isPaused}`);
        this.scene.events.emit('updateUI');

        if (this.isPaused) {
            if (this.timerEvent) this.timerEvent.paused = true;
        } else {
            if (this.timerEvent) this.timerEvent.paused = false;
        }
    }

    resetTurnTimer() {
        // Base time is 50 seconds for ALL rounds as requested
        this.timeLeft = 50;


        this.isPaused = false; // Reset pause on new turn
        if (this.timerEvent) {
            console.log("GameManager: Existing timer removed.");
            this.timerEvent.remove();
        }

        this.timerEvent = this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.isPaused) {
                    return;
                }
                this.timeLeft--;

                this.scene.events.emit('updateUI');
                if (this.timeLeft <= 0) {
                    this.scene.events.emit('showToast', "시간 초과! 턴이 강제 종료됩니다.");
                    this.endTurn();
                }
            },
            loop: true

        });
        console.log("GameManager: New timerEvent created.");
        this.scene.events.emit('updateUI');
    }

    addTime(seconds) {
        this.timeLeft += seconds;
        if (this.timeLeft > 60) {
            this.timeLeft = 60;
        }

        this.scene.events.emit('updateUI');
        this.scene.events.emit('showToast', `시간 추가! (+${seconds}초)`);
    }

    startTurn(prevTurn = null, prevRound = null, specialEvent = null) {
        if (this.currentTurn === 9) {
            // AI Turn
            // Ponix Maintenance: Clear Shields (if any)
            for (let tile of this.grid.getAllTiles()) {
                if (tile.ownerID === 9 && tile.isShielded && !tile.isPermanentShield) {
                    tile.isShielded = false;
                    tile.draw();
                }
            }
            this.scene.events.emit('aiTurnStart');
        } else {
            // Team Turn
            console.log("GameManager: startTurn executed for Team " + this.currentTurn);
            const income = this.calcAP(this.currentTurn);
            let expansionBonus = 0;
            console.log(`Turn Start: Team ${this.currentTurn}`);

            // Expansion Complete Bonus Check
            const currentTeam = this.teamData[this.currentTurn];
            if (currentTeam && !currentTeam.expansionDone) {
                if (this.checkExpansionComplete(this.currentTurn)) {
                    expansionBonus = 10;
                    currentTeam.expansionDone = true;
                    currentTeam.ap += 10;
                    console.log(`Bonus: Team ${this.currentTurn} Expansion Complete (+10 AP)`);
                    this.scene.events.emit('showToast', "확장 완료 보너스! (+10 Pt)");
                }
            }

            // 0. RESET TIMER
            this.resetTurnTimer();

            // Track changes for Undo
            // We consolidate ALL tile changes (shield expiry, decay) into one list
            const changes = [];

            // Shields applied last turn protect until NOW (one full round).
            // Also: Power Decay (Power decreases by 1 each round, min 1)
            for (let tile of this.grid.getAllTiles()) {
                if (tile.ownerID === this.currentTurn) {
                    let changed = false;
                    const prevPower = tile.power;
                    const prevShield = tile.isShielded;

                    // 1. Clear Shield (Unless Permanent HQ)
                    if (tile.isShielded && !tile.isPermanentShield) {
                        tile.isShielded = false;
                        changed = true;
                        // console.log(`Shield Expired on Tile ${tile.index}`);
                    }

                    // 2. Power Decay
                    if (tile.power > 1) {
                        tile.power -= 1;
                        changed = true;
                    }

                    if (changed) {
                        changes.push({
                            tile: tile,
                            prevPower: prevPower,
                            prevShield: prevShield
                        });
                        tile.draw();
                    }
                }
            }

            // Record Turn Change for Undo
            // We only record if we came from a previous turn (not game start) matches normal flow
            if (prevTurn && this.scene) {
                this.scene.pushAction({
                    type: 'TURN_CHANGE',
                    prevTurn: prevTurn,
                    prevRound: prevRound,
                    newTurn: this.currentTurn,
                    income: income + expansionBonus, // Store TOTAL income to deduct on undo
                    expansionBonusGiven: (expansionBonus > 0), // Flag to revert status
                    changes: changes, // Unified changes array
                    specialEvent: specialEvent // Store Special Event (like Ponix Spawn)
                });
            }

            this.scene.events.emit('updateUI'); // Notify UI to update
        }
    }

    calculateIncome(teamId) {
        // Base 3 + Bonus (1 per 5 tiles) + Special Bonus
        let tileCount = 0;
        let specialBonus = 0;

        for (let tile of this.grid.getAllTiles()) {
            if (tile.ownerID === teamId) {
                tileCount++;
                if (tile.isSpecial) {
                    if (tile.specialName === '창의학습관') {
                        specialBonus += 4; // +4 AP for Creative Learning Center
                    } else {
                        specialBonus += 2; // +2 AP for other Landmarks
                    }
                }
            }
        }
        const territoryBonus = Math.floor(tileCount / 4);
        return 4 + territoryBonus + specialBonus;
    }

    checkCooldown(teamId, skillIdx) {
        // Cooldowns Disabled
        return true;
    }

    startCooldown(teamId, skillIdx) {
        // Cooldowns Disabled
    }

    calcAP(teamId) {
        // Round 1: AP already set in initGame. Do not add income.
        if (this.currentRound === 1) {
            console.log(`Round 1: Team ${teamId} uses initial AP.`);
            return 0;
        }

        const income = this.calculateIncome(teamId);
        this.teamData[teamId].ap += income;
        console.log(`Team ${teamId} gained ${income} AP. Total: ${this.teamData[teamId].ap}`);
        return income;
    }

    checkExpansionComplete(teamId) {
        // Condition: No adjacent neutral (0) tiles to ANY of the team's tiles
        const myTiles = this.grid.getAllTiles().filter(t => t.ownerID === teamId);
        if (myTiles.length === 0) return false;

        for (const tile of myTiles) {
            const neighbors = this.grid.getNeighbors(tile);
            for (const n of neighbors) {
                if (n.ownerID === 0) {
                    return false; // Found a neutral neighbor, bonus not ready
                }
            }
        }
        return true; // No neutral neighbors found
    }

    endTurn() {
        if (this.timerEvent) {
            this.timerEvent.remove();
            this.timerEvent = null;
        }

        const prevTurn = this.currentTurn;
        const prevRound = this.currentRound;
        let specialEvent = null;

        // Next turn
        if (this.currentTurn < this.teams) {
            this.currentTurn++;
        } else if (this.currentTurn === this.teams) {
            // After last team (Team 6)
            if (this.isPart2) {
                this.currentTurn = 9; // Go to AI
            } else {
                this.endRound();
                this.currentTurn = 1;
            }
        } else if (this.currentTurn === 9) {
            // After AI Turn -> End Round
            this.endRound();
            this.currentTurn = 1;
        }

        // Check Ponix event
        if (this.currentRound === 9 && !this.isPart2) {
            specialEvent = this.triggerPart2();
        }

        this.checkVictory();

        // Pass previous state to startTurn to record history
        this.startTurn(prevTurn, prevRound, specialEvent);
    }

    checkVictory() {
        if (!this.isPart2 && this.currentRound > 8) {
            this.triggerPart2(); // No special event return here as unlikely to be undone from arbitrary logic trigger
            return;
        }

        // Part 2 Win/Loss
        if (this.isPart2) {
            let ponixCount = 0;
            let totalTiles = 0;
            const counts = {}; // Track land counts for players

            const tiles = this.grid.getAllTiles();
            for (let tile of tiles) {
                totalTiles++;
                if (tile.ownerID === 9) {
                    ponixCount++;
                } else if (tile.ownerID >= 1 && tile.ownerID <= 6) {
                    counts[tile.ownerID] = (counts[tile.ownerID] || 0) + 1;
                }
            }

            // Condition A: Ponix eliminated (AFTER Round 9)
            if (this.currentRound > 9 && ponixCount === 0) {
                // Find MVP (Most Tiles)
                let maxTiles = -1;
                let winnerId = 1;
                for (let id = 1; id <= 6; id++) {
                    const c = counts[id] || 0;
                    if (c > maxTiles) {
                        maxTiles = c;
                        winnerId = id;
                    }
                }
                const winningTeam = this.teamData[winnerId].name;

                this.scene.events.emit('gameOver', {
                    winner: 'Player',
                    winningTeam: winningTeam
                });
                return;
            }

            // Condition B: Ponix > 50%
            if (ponixCount / totalTiles >= 0.5) {
                this.scene.events.emit('gameOver', {
                    winner: 'Ponix',
                    winningTeam: '포닉스'
                });
                return;
            }
        }
    }

    endRound() {
        console.log(`Round ${this.currentRound} Ended`);

        // Trigger Invasion Check BEFORE incrementing if we want it to start AT round 16
        // If currentRound is 15, we are ending 15. Next is 16.
        // Note: triggerPart2 is also called in endTurn logic.
        // This backup check might duplicate.
        // Since endTurn logic handles it, removing this to avoid double trigger?
        // Or better, let endTurn handle it.
        // Keeping it for safety but effectively it runs in endTurn mostly.

        this.currentRound++;
        this.scene.events.emit('updateUI');
    }

    triggerPart2() {
        this.isPart2 = true;
        this.scene.events.emit('part2Started'); // UI Popup if needed
        this.scene.events.emit('showToast', "경고: 포닉스의 침공이 시작되었습니다! (주요 건물 감염)");

        // Spawn Ponix at Landmarks
        const tiles = this.grid.getAllTiles();
        let compensationGiven = false;

        // Data for Undo
        const changes = [];
        const compensatedTeams = [];

        tiles.forEach(tile => {
            if (tile.isSpecial) {
                const prevOwner = tile.ownerID;
                const prevPower = tile.power;
                const prevShield = tile.isShielded;
                const prevPermShield = tile.isPermanentShield;

                // Compensation Logic: If owned by a player, give 2 AP
                if (tile.ownerID >= 1 && tile.ownerID <= 6) {
                    const team = this.teamData[tile.ownerID];
                    if (team) {
                        team.ap += 2;
                        console.log(`Compensation: ${team.name} gained 2 AP (Landmark Lost)`);
                        compensationGiven = true;
                        compensatedTeams.push({ teamId: tile.ownerID, amount: 2 });
                    }
                }

                // Record Change
                changes.push({
                    tile: tile,
                    prevOwner: prevOwner,
                    prevPower: prevPower,
                    prevShield: prevShield,
                    prevPermShield: prevPermShield
                });

                tile.setOwner(9); // Ponix
                tile.setPower(3); // Reduced from 6 to 3
                tile.isShielded = true; // Initial Shield Restored
                tile.isPermanentShield = false; // Ensure it expires
                tile.draw();
            }
        });

        if (compensationGiven) {
            this.scene.events.emit('showToast', "감염된 지역의 플레이어들에게 보상금(2Pt)이 지급되었습니다.");
            this.scene.events.emit('updateUI');
        }

        return {
            type: 'PONIX_SPAWN',
            changes: changes,
            compensatedTeams: compensatedTeams
        };
    }

    getCurrentTeam() {
        if (this.currentTurn === 9) return null;
        return this.teamData[this.currentTurn];
    }

    destroy() {
        if (this.timerEvent) {
            this.timerEvent.remove();
            this.timerEvent = null;
        }
        this.eventListeners = { onTurnStart: [], onTurnEnd: [] };
        this.scene = null;
        this.grid = null;
        this.teamData = [];
        console.log("GameManager Destroyed");
    }
}
