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
                if (tile.power < 6) {
                    tile.setPower(tile.power + 1);
                }
            }
        }
    }

    infectPhase() {
        const toInfect = [];
        const tiles = this.grid.getAllTiles();

        // Snapshot logic
        for (let tile of tiles) {
            if (tile.ownerID === 9 && tile.power >= 4) {
                const neighbors = this.grid.getNeighbors(tile);
                if (!neighbors) continue; // Safety check

                let candidates = [];
                let minPower = 999;

                // 1. Find min power
                for (let n of neighbors) {
                    if (n && n.ownerID !== 9 && n.power < tile.power) { // Verify n exists
                        if (n.power < minPower) {
                            minPower = n.power;
                            candidates = [n]; // Reset with new min
                        } else if (n.power === minPower) {
                            candidates.push(n); // Add to tie
                        }
                    }
                }

                // PRIORITY FIX: If any candidate is Gray (Neutral, ownerID === 0), prioritize them!
                const neutralCandidates = candidates.filter(c => c.ownerID === 0);
                if (neutralCandidates.length > 0) {
                    candidates = neutralCandidates;
                }

                // 2. Random Selection from candidates
                if (candidates.length > 0) {
                    const bestTarget = candidates[Math.floor(Math.random() * candidates.length)];
                    toInfect.push({ source: tile, target: bestTarget });
                }
            }
        }

        // Apply Infection with Visuals
        if (toInfect.length === 0) return 0; // No infections, 0 duration

        toInfect.forEach((action, index) => {
            // Stagger animations slightly
            this.forceTimer(index * 200, () => {
                if (!this.scene) return;
                try {
                    const { source, target } = action;
                    if (!source || !target) return; // Paranoia check

                    // Visual Line
                    const graphics = this.scene.add.graphics();
                    graphics.lineStyle(4, 0xff0000, 1);
                    graphics.lineBetween(source.x, source.y, target.x, target.y);

                    // Tweet/Fade effect
                    const tween = this.scene.tweens.add({
                        targets: graphics,
                        alpha: 0,
                        duration: 500,
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

        // Return total duration: (last index * 200) + basic buffer
        return (toInfect.length * 200);
    }

    forceTimer(delay, callback) {
        if (!this.scene) return;
        const timer = this.scene.time.delayedCall(delay, callback);
        this.timers.push(timer);
    }

    spawnInitialPhonics() {
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
