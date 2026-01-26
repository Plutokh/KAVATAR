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
            { id: 2, color: 'Yellow', ap: 0, name: '노란 넙죽이' }, // East
            { id: 3, color: 'Green', ap: 0, name: '초록 넙죽이' },  // West
            { id: 4, color: 'Blue', ap: 0, name: '파란 넙죽이' },    // South
            { id: 5, color: 'Purple', ap: 0, name: '보라 넙죽이' },  // Center
            { id: 6, color: 'Brown', ap: 0, name: '갈색 넙죽이' }   // Map 2 & 3 Special -> Now Map 1 too
        ];

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
            if (i <= 2) this.teamData[i].ap = 9;
            else if (i <= 4) this.teamData[i].ap = 10;
            else this.teamData[i].ap = 11;
        }

        this.spreadHQ();
        // Initial UI Update to show all APs before turn starts
        this.scene.events.emit('updateUI');

        this.startTurn();
    }

    spreadHQ() {
        if (this.mapId === 2) {
            // Map 2: Specific Indices for HQs
            const hqIndices = [2, 28, 91, 108, 82, 19]; // Teams 1-6
            const allTiles = this.grid.getAllTiles();

            hqIndices.forEach((idx, i) => {
                const tile = allTiles.find(t => t.index === idx);
                if (tile) {
                    tile.setOwner(i + 1); // Team ID 1-6
                    tile.setPower(1);
                    tile.isPermanentShield = true;
                    tile.isShielded = true;
                    tile.draw();
                } else {
                    console.warn(`HQ Index ${idx} not found for Map 2`);
                }
            });
            return; // Done for Map 2
        }

        let startingPositions = [];

        if (this.mapId === 3) {
            // Map 3: Hexagon Corners (Radius 6)
            startingPositions = [
                { q: 0, r: -6, id: 1 },
                { q: 6, r: -6, id: 2 },
                { q: 6, r: 0, id: 3 },
                { q: 0, r: 6, id: 4 },
                { q: -6, r: 6, id: 5 },
                { q: -6, r: 0, id: 6 }
            ];
        } else {
            // Map 1: Original + Team 6 at Index 17
            startingPositions = [
                { q: -3, r: -2, id: 1 }, // Orange (NW)
                { q: 5, r: -1, id: 2 },  // Yellow (E)
                { q: 1, r: 5, id: 3 },   // Green (Now SE) -> Was Blue
                { q: -9, r: 7, id: 4 },  // Blue (Now SW) -> Was Green
                { q: -2, r: 1, id: 5 }   // Purple (Center/West)
            ];

            // Manually add Team 6 at Index 17 for Map 1
            const allTiles = this.grid.getAllTiles();
            const tile17 = allTiles.find(t => t.index === 17);
            if (tile17) {
                // Determine Q, R for consistency or just set directly
                startingPositions.push({ q: tile17.q, r: tile17.r, id: 6 });
            }
        }

        startingPositions.forEach(pos => {
            const tile = this.grid.getTile(pos.q, pos.r);
            if (tile) {
                tile.setOwner(pos.id);
                tile.setPower(1);

                // Permanent Shield for HQs
                tile.isPermanentShield = true;
                tile.isShielded = true;
                tile.draw(); // Visual update
            } else {
                console.warn(`HQ Position not found: ${pos.q}, ${pos.r}`);
            }
        });
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

    resetTurnTimer() {
        // Base time depends on Round
        if (this.currentRound <= 3) {
            this.timeLeft = 30;
        } else if (this.currentRound <= 6) {
            this.timeLeft = 40;
        } else if (this.currentRound <= 9) {
            this.timeLeft = 50;
        } else {
            this.timeLeft = 60;
        }

        this.isPaused = false; // Reset pause on new turn
        if (this.timerEvent) this.timerEvent.remove();

        this.timerEvent = this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.isPaused) return; // redundant if paused works, but safe
                this.timeLeft--;
                this.scene.events.emit('updateUI');
                if (this.timeLeft <= 0) {
                    this.scene.events.emit('showToast', "시간 초과! 턴이 강제 종료됩니다.");
                    this.endTurn();
                }
            },
            loop: true
        });
        this.scene.events.emit('updateUI');
    }

    addTime(seconds) {
        this.timeLeft += seconds;
        console.log(`Time Added: +${seconds}s. New Time: ${this.timeLeft}s`);
        this.scene.events.emit('updateUI');
        this.scene.events.emit('showToast', `시간 추가! (+${seconds}초)`);
    }

    startTurn(prevTurn = null, prevRound = null, specialEvent = null) {
        if (this.currentTurn === 9) {
            // AI Turn
            this.scene.events.emit('aiTurnStart');
        } else {
            // Team Turn
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
                    specialEvent: specialEvent // Store Special Event (like Phonics Spawn)
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
                    specialBonus += 2; // +2 AP for Landmark
                }
            }
        }
        const territoryBonus = Math.floor(tileCount / 4);
        return 4 + territoryBonus + specialBonus;
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

        // Check Phonics event
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
            let phonicsCount = 0;
            let totalTiles = 0;
            const tiles = this.grid.getAllTiles();
            for (let tile of tiles) {
                totalTiles++;
                if (tile.ownerID === 9) phonicsCount++;
            }

            // Condition A: Phonics eliminated (AFTER Round 9)
            // Round 9 is spawn/invincible round, so don't win immediately if count is 0 (shouldn't be though)
            if (this.currentRound > 9 && phonicsCount === 0) {
                this.scene.events.emit('showToast', "승리! 포닉스를 모두 물리쳤습니다!");
                this.scene.scene.pause();
                return;
            }

            // Condition B: Phonics > 50%
            if (phonicsCount / totalTiles >= 0.5) {
                this.scene.events.emit('showToast', "패배! 포닉스가 맵의 50% 이상을 점령했습니다!");
                this.scene.scene.pause();
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

        // Spawn Phonics at Landmarks
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

                tile.setOwner(9); // Phonics
                tile.setPower(3); // Reduced from 6 to 3
                tile.isShielded = true; // Initial Shield
                tile.isPermanentShield = false; // Ensure it expires
                tile.draw();
            }
        });

        if (compensationGiven) {
            this.scene.events.emit('showToast', "감염된 지역의 플레이어들에게 보상금(2Pt)이 지급되었습니다.");
            this.scene.events.emit('updateUI');
        }

        return {
            type: 'PHONICS_SPAWN',
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
