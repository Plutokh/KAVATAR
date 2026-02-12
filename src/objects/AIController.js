export default class AIController {
    constructor(scene, grid) {
        this.scene = scene;
        this.grid = grid;
        this.timers = [];
        this.activeTweens = [];

        // Graphics object pool for infection visuals
        this._graphicsPool = [];
    }

    // Get a Graphics object from pool or create a new one
    _getGraphics() {
        for (let i = 0; i < this._graphicsPool.length; i++) {
            const g = this._graphicsPool[i];
            if (!g._inUse) {
                g._inUse = true;
                g.clear();
                g.setAlpha(1);
                g.setVisible(true);
                return g;
            }
        }
        // Pool exhausted — create new
        const g = this.scene.add.graphics();
        g._inUse = true;
        this._graphicsPool.push(g);
        return g;
    }

    // Return a Graphics object to the pool
    _releaseGraphics(g) {
        g._inUse = false;
        g.setVisible(false);
    }

    runTurn(callback) {
        console.log(`AIController.runTurn Start: Round ${this.scene.gameManager.currentRound}`);

        if (!this.scene || !this.grid) {
            console.error("AIController: Scene or Grid missing!");
            return;
        }

        try {
            this.growPhase();

            this.forceTimer(500, () => {
                if (!this.scene) return;

                try {
                    const duration = this.infectPhase();

                    this.forceTimer(duration + 500, () => {
                        if (!this.scene) return;
                        console.log("AI Turn Complete. Calling callback.");
                        callback();
                    });
                } catch (err) {
                    console.error("Error in AI Infect Phase:", err);
                    callback();
                }
            });
        } catch (err) {
            console.error("Error in AI Grow Phase:", err);
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
        const claimedTargets = new Set();

        for (let tile of validSources) {
            const neighbors = this.grid.getNeighbors(tile);
            if (!neighbors) continue;

            let candidates = [];
            let minPower = Infinity;

            for (let n of neighbors) {
                if (n && n.ownerID !== 9 && n.power < tile.power && !n.isShielded && !claimedTargets.has(n)) {
                    if (n.power < minPower) {
                        minPower = n.power;
                        candidates = [n];
                    } else if (n.power === minPower) {
                        candidates.push(n);
                    }
                }
            }

            // Priority: Neutral (Gray)
            const neutralCandidates = candidates.filter(c => c.ownerID === 0);
            if (neutralCandidates.length > 0) {
                candidates = neutralCandidates;
            }

            if (candidates.length > 0) {
                const bestTarget = candidates[Math.floor(Math.random() * candidates.length)];
                toInfect.push({ source: tile, target: bestTarget });
                claimedTargets.add(bestTarget);
            }
        }

        // 4. Apply Infection with Visuals (using pooled Graphics)
        if (toInfect.length === 0) return 0;

        toInfect.forEach((action, index) => {
            this.forceTimer(index * 100, () => {
                if (!this.scene) return;
                try {
                    const { source, target } = action;
                    if (!source || !target) return;

                    // Visual Line — reuse pooled Graphics
                    const graphics = this._getGraphics();
                    graphics.lineStyle(4, 0xff0000, 1);
                    graphics.lineBetween(source.x, source.y, target.x, target.y);

                    // Fade out then return to pool
                    const tween = this.scene.tweens.add({
                        targets: graphics,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => {
                            this._releaseGraphics(graphics);
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
