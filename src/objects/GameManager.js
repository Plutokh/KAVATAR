export default class GameManager {
    constructor(scene, grid) {
        this.scene = scene;
        this.grid = grid;

        // Settings
        this.teams = 5;
        this.currentRound = 1;
        this.currentTurn = 1; // 1-5 = Teams, 9 = AI
        this.isPart2 = false;

        // Team Data (0 is neutral placeholder)
        this.teamData = [
            null,
            { id: 1, color: 'Orange', ap: 0, name: '주황 넙죽이' }, // North -> Orange
            { id: 2, color: 'Yellow', ap: 0, name: '노란 넙죽이' }, // East -> Yellow
            { id: 3, color: 'Green', ap: 0, name: '초록 넙죽이' },  // West -> Green
            { id: 4, color: 'Blue', ap: 0, name: '파란 넙죽이' },    // South -> Blue
            { id: 5, color: 'Purple', ap: 0, name: '보라 넙죽이' }  // Center -> Purple
        ];

        this.eventListeners = {
            onTurnStart: [],
            onTurnEnd: []
        };
    }

    initGame() {
        this.currentRound = 1;
        this.currentTurn = 1;
        this.spreadHQ();
        this.startTurn();
    }

    spreadHQ() {
        // Fixed Starting Positions defined by User
        const startingPositions = [
            { q: -3, r: -2, id: 1 }, // Orange (North)
            { q: 5, r: -1, id: 2 },  // Yellow (East)
            { q: -9, r: 7, id: 3 },  // Green (West)
            { q: 1, r: 5, id: 4 },   // Blue (South, Moved to 1,5)
            { q: -2, r: 1, id: 5 }   // Purple (Center)
        ];

        startingPositions.forEach(pos => {
            const tile = this.grid.getTile(pos.q, pos.r);
            if (tile) {
                tile.setOwner(pos.id);
                tile.setPower(1);
            } else {
                console.warn(`HQ Position not found: ${pos.q}, ${pos.r}`);
            }
        });
    }

    startTurn() {
        if (this.currentTurn === 9) {
            // AI Turn (handled by AIController called from Scene)
            this.scene.events.emit('aiTurnStart');
        } else {
            // Team Turn
            this.calcAP(this.currentTurn);
            console.log(`Turn Start: Team ${this.currentTurn}`);

            // New Logic: Clear Shields for THIS team (Duration = 1 Round)
            // Shields applied last turn protect until NOW.
            // Also: Power Decay (Power decreases by 1 each round, min 1)
            for (let tile of this.grid.getAllTiles()) {
                if (tile.ownerID === this.currentTurn) {
                    let changed = false;

                    // 1. Clear Shield
                    if (tile.isShielded) {
                        tile.isShielded = false;
                        changed = true;
                    }

                    // 2. Power Decay
                    if (tile.power > 1) {
                        tile.power -= 1;
                        changed = true;
                    }

                    if (changed) tile.draw();
                }
            }
            // Clear history for new turn
            if (this.scene) this.scene.actionHistory = [];
            this.scene.events.emit('updateUI'); // Notify UI to update
        }
    }

    calcAP(teamId) {
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
        const territoryBonus = Math.floor(tileCount / 5);

        // Accumulate AP (Income = 3 + Bonuses)
        const income = 3 + territoryBonus + specialBonus;
        this.teamData[teamId].ap += income;
        console.log(`Team ${teamId} gained ${income} AP. Total: ${this.teamData[teamId].ap}`);
    }

    endTurn() {
        // Next turn
        if (this.currentTurn < 5) {
            this.currentTurn++;
        } else if (this.currentTurn === 5) {
            // After team 5
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
        if (this.currentRound === 16 && !this.isPart2) {
            this.triggerPart2();
        }

        this.checkVictory();

        this.startTurn();
    }

    checkVictory() {
        if (!this.isPart2 && this.currentRound > 15) {
            this.triggerPart2();
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

            // Condition A: Phonics eliminated (AFTER Round 16)
            // Round 16 is spawn/invincible round, so don't win immediately if count is 0 (shouldn't be though)
            if (this.currentRound > 16 && phonicsCount === 0) {
                alert("VICTORY! Phonics eliminated!");
                this.scene.scene.pause();
                return;
            }

            // Condition B: Phonics > 50%
            if (phonicsCount / totalTiles >= 0.5) {
                alert("DEFEAT! Phonics took over 50% of the map!");
                this.scene.scene.pause();
                return;
            }
        }
    }

    endRound() {
        console.log(`Round ${this.currentRound} Ended`);

        // Trigger Invasion Check BEFORE incrementing if we want it to start AT round 16
        // If currentRound is 15, we are ending 15. Next is 16.
        if (!this.isPart2 && this.currentRound === 15) {
            this.triggerPart2();
        }

        this.currentRound++;
        this.scene.events.emit('updateUI');
    }

    triggerPart2() {
        this.isPart2 = true;
        this.scene.events.emit('part2Started'); // UI Popup if needed
        alert("WARNING: Phonics Invasion Started! (Landmarks Infested)");

        // Spawn Phonics at Landmarks
        const tiles = this.grid.getAllTiles();
        tiles.forEach(tile => {
            if (tile.isSpecial) {
                tile.setOwner(9); // Phonics
                tile.setPower(5); // Strong initial presence
            }
        });

        // Round 16 is Invincible Round
        // This logic is checked in AIController and tryAttack
    }

    getCurrentTeam() {
        if (this.currentTurn === 9) return null;
        return this.teamData[this.currentTurn];
    }
}
