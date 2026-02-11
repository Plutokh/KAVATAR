export default class AIController {
    constructor(scene, grid) {
        this.scene = scene;
        this.grid = grid;
        this.timers = [];
        this.activeTweens = [];
    }

    runTurn(callback) {
        // AI Turn Logic
        console.log(`AIController.runTurn Start: Round ${this.scene.gameManager.currentRound}`);

        // Safety: If scene is invalid, stop
        if (!this.scene || !this.grid) {
            console.error("AIController: Scene or Grid missing!");
            return;
        }

        try {
            // Coroutine-like behavior
            // 1. Grow
            this.growPhase();

            this.forceTimer(500, () => {
                if (!this.scene) return;

                try {
                    // 2. Infect
                    const duration = this.infectPhase(); // Get duration

                    // Wait for infections to finish + buffer
                    this.forceTimer(duration + 500, () => {
                        if (!this.scene) return;
                        console.log("AI Turn Complete. Calling callback.");
                        callback(); // End AI Turn
                    });
                } catch (err) {
                    console.error("Error in AI Infect Phase:", err);
                    // Force End Turn to prevent Softlock
                    callback();
                }
            });
        } catch (err) {
            console.error("Error in AI Grow Phase:", err);
            // Force End Turn
            callback();
        }
    }

    growPhase() {
        for (let tile of this.grid.getAllTiles()) {
            if (tile.ownerID === 9) {
                if (tile.power < 5) {
                    tile.setPower(tile.power + 1);
                    tile.draw();
                }
            }
        }
    }

    infectPhase() {
        const toInfect = [];
        const tiles = this.grid.getAllTiles();
        const validSources = [];

        // 1. Gather Valid Ponix Sources
        for (let tile of tiles) {
            if (tile.ownerID === 9 && tile.power >= 4) {
                validSources.push(tile);
            }
        }

        // 2. Sort Sources by Index (Ascending) for Deterministic Order
        validSources.sort((a, b) => a.index - b.index);

        // 3. Select Targets (Prevention of Overlap)
        const claimedTargets = new Set(); // Track tiles targeted in this turn

        for (let tile of validSources) {
            const neighbors = this.grid.getNeighbors(tile);
            if (!neighbors) continue;

            let candidates = [];
            let minPower = Infinity;

            // Find min power among valid neighbors
            for (let n of neighbors) {
                // Check: Valid neighbor, Not Ponix, Weaker, Not Shielded, AND Not already claimed
                if (n && n.ownerID !== 9 && n.power < tile.power && !n.isShielded && !claimedTargets.has(n)) {
                    if (n.power < minPower) {
                        minPower = n.power;
                        candidates = [n]; // Reset with new min
                    } else if (n.power === minPower) {
                        candidates.push(n); // Add to tie
                    }
                }
            }

            // Priority: Neutral (Gray)
            const neutralCandidates = candidates.filter(c => c.ownerID === 0);
            if (neutralCandidates.length > 0) {
                candidates = neutralCandidates;
            }

            // Select Target
            if (candidates.length > 0) {
                // Random selection from best candidates
                const bestTarget = candidates[Math.floor(Math.random() * candidates.length)];

                toInfect.push({ source: tile, target: bestTarget });
                claimedTargets.add(bestTarget); // Mark as claimed for subsequent units
            }
        }

        // 4. Apply Infection with Visuals
        if (toInfect.length === 0) return 0;

        toInfect.forEach((action, index) => {
            // Speed up: 0.1s (100ms) interval
            this.forceTimer(index * 100, () => {
                if (!this.scene) return;
                try {
                    const { source, target } = action;
                    if (!source || !target) return;

                    // Double check (redundant but safe): Ensure target wasn't converted by a FASTER event in edge cases
                    // But since we are sequential, it should be fine.

                    // Visual Line
                    const graphics = this.scene.add.graphics();
                    graphics.lineStyle(4, 0xff0000, 1);
                    graphics.lineBetween(source.x, source.y, target.x, target.y);

                    // Fade out
                    const tween = this.scene.tweens.add({
                        targets: graphics,
                        alpha: 0,
                        duration: 300, // Faster fade
                        onComplete: () => {
                            graphics.destroy();
                        }
                    });
                    this.activeTweens.push(tween);

                    // Logic Change
                    target.setOwner(9);
                    target.setPower(3);
                    target.draw();
                } catch (e) {
                    console.error("Error executing infection action:", e);
                }
            });
        });

        // Return total duration: (count * 100) + buffer
        return (toInfect.length * 100);
    }

    forceTimer(delay, callback) {
        if (!this.scene) return;
        const timer = this.scene.time.delayedCall(delay, callback);
        this.timers.push(timer);
    }

    spawnInitialPonix() {
        // Deprecated: Logic moved to GameManager.triggerPart2 to target Landmarks.
        // Keeping empty method if called from elsewhere to prevent crash, or removing listener.
    }

    destroy() {
        console.log("AIController Destroying...");
        // Clear Timers
        if (this.timers) {
            this.timers.forEach(t => t.remove());
            this.timers = [];
        }
        // Clear Tweens
        if (this.activeTweens) {
            this.activeTweens.forEach(t => t.remove());
            this.activeTweens = [];
        }
        this.scene = null;
        this.grid = null;
    }
}
