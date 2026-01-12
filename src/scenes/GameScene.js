import HexGrid from '../objects/HexGrid.js';
import GameManager from '../objects/GameManager.js';
import AIController from '../objects/AIController.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.actionHistory = []; // Stack for Undo
    }

    create() {
        this.cameras.main.setBackgroundColor('#222222');

        // Define Grayscale Pipeline
        const GrayscalePipeline = new Phaser.Class({
            Extends: Phaser.Renderer.WebGL.Pipelines.SinglePipeline,
            initialize: function GrayscalePipeline(game) {
                Phaser.Renderer.WebGL.Pipelines.SinglePipeline.call(this, {
                    game: game,
                    fragShader: `
                        precision mediump float;
                        uniform sampler2D uMainSampler;
                        varying vec2 outTexCoord;
                        void main(void) {
                            vec4 color = texture2D(uMainSampler, outTexCoord);
                            float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                            gl_FragColor = vec4(vec3(gray), color.a);
                        }
                    `
                });
            }
        });

        // Register Pipeline (if not exists)
        if (!this.renderer.pipelines.get('Gray')) {
            this.renderer.pipelines.add('Gray', new GrayscalePipeline(this.game));
        }

        // Background Map
        const bg = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'bg_map');

        // Apply Grayscale
        bg.setPipeline('Gray');

        // Scale to fit nicely (cover most of screen)
        const scaleX = this.cameras.main.width / bg.width;
        const scaleY = this.cameras.main.height / bg.height;
        const scale = Math.min(scaleX, scaleY) * 0.95; // 95% fit
        bg.setScale(scale);
        bg.setAlpha(0.4); // Dim background for visibility

        // Cover-up Boxes (Hide Text overlapping UI)
        const bgLeft = bg.x - bg.displayWidth / 2;
        const bgTop = bg.y - bg.displayHeight / 2;

        // 1. Cover "KAIST CAMPUS MAP" (Top-Left)
        const coverTitle = this.add.rectangle(
            bgLeft, bgTop,
            bg.displayWidth * 0.5, bg.displayHeight * 0.15,
            0xffffff // White
        ).setOrigin(0, 0);

        // 2. Cover Mini-map (Top-Right) - Extended slightly to the left
        const coverLegend = this.add.rectangle(
            bgLeft + bg.displayWidth * 0.7, bgTop, // Start at 0.7 instead of 0.75
            bg.displayWidth * 0.3, bg.displayHeight * 0.25, // Wider coverage
            0xffffff // White
        ).setOrigin(0, 0);

        // Initialize Grid
        // Reduced size for larger map (200 tiles) -> Updated to 40
        this.grid = new HexGrid(this, this.cameras.main.width / 2, this.cameras.main.height / 2, 40, 15);

        // Initialize Managers
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
            // Handled by GameManager
        });

        // Start Game
        this.gameManager.initGame();

        // Input Handling for Actions
        this.input.on('gameobjectdown', (pointer, gameObject) => {
            if (gameObject instanceof Phaser.GameObjects.Container) // Check if tile
                this.handleInput(gameObject);
        });

        this.setupActionListeners();
    }

    handleInput(tile) {
        if (!this.gameManager) return;
        const team = this.gameManager.getCurrentTeam();
        if (!team) return;

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

    selectTile(tile) {
        // TODO: Add visual highlight
        if (this.selectedTile) {
            this.selectedTile.graphics.clear();
            this.selectedTile.draw();
        }
        this.selectedTile = tile;
        // Draw highlight (simple hack for now)
        tile.graphics.lineStyle(4, 0xffffff, 1);
        tile.graphics.strokePoints(tile.getHexPoints(), true);
    }

    setupActionListeners() {
        this.events.on('actionRecruit', () => this.actionRecruit());
        this.events.on('actionFortify', () => this.actionFortify());
        this.events.on('actionPurify', () => this.actionPurify());
        this.events.on('actionUndo', () => this.actionUndo()); // UNDO Listener
        this.events.on('actionEndTurn', () => {
            this.gameManager.endTurn();
        });
    }

    // --- UNDO SYSTEM ---
    pushAction(action) {
        this.actionHistory.push(action);
    }

    actionUndo() {
        if (this.actionHistory.length === 0) {
            console.log("Nothing to undo");
            return;
        }

        const lastAction = this.actionHistory.pop();
        const team = this.gameManager.getCurrentTeam();

        // Restore State
        switch (lastAction.type) {
            case 'RECRUIT':
            case 'FORTIFY':
                lastAction.tile.setPower(lastAction.prevPower);
                lastAction.tile.isShielded = lastAction.prevShield;
                lastAction.tile.draw();
                break;
            case 'PURIFY':
                lastAction.target.setOwner(lastAction.prevOwner); // Restore Phonics
                lastAction.target.setPower(lastAction.prevPower);
                lastAction.target.isShielded = lastAction.prevShield; // Restore Shield
                lastAction.target.draw();
                break;
            case 'ATTACK':
                lastAction.target.setOwner(lastAction.prevTargetOwner);
                lastAction.target.setPower(lastAction.prevTargetPower);
                lastAction.target.isShielded = lastAction.prevTargetShield;

                lastAction.source.setPower(lastAction.prevSourcePower);
                lastAction.source.setOwner(lastAction.prevSourceOwner); // Should be same team usually
                break;
        }

        // Refund AP
        team.ap += lastAction.cost;
        this.events.emit('updateUI');
        console.log("Undo Successful");
    }

    handleInput(tile) {
        if (!this.gameManager) return;
        const team = this.gameManager.getCurrentTeam();
        if (!team) return;

        // Purify Mode Logic
        if (this.purifyMode) {
            // Check if Target is Phonics (Owner 9) OR if it's a Special Tile occupied by Phonics (checking owner should suffice, but being explicit)
            if (tile.ownerID === 9) {
                this.tryPurify(tile, team);
            } else {
                console.log(`Invalid Purify Target: Owner ${tile.ownerID}`);
                alert("Select a Phonics tile to Purify!");
            }
            // Turn off mode
            this.purifyMode = false;
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
        const team = this.gameManager.getCurrentTeam();
        if (!this.selectedTile || this.selectedTile.ownerID !== team.id) {
            alert("Select your tile first!");
            return;
        }
        if (team.ap < 2) {
            alert("Not enough AP for Purify (2 AP)");
            return;
        }

        this.purifyMode = true;
        alert("Purify Mode ON: Click an adjacent Phonics tile to neutralize it.");
    }

    tryPurify(target, team) {
        const source = this.selectedTile;
        if (!source) return;

        const distance = this.grid.getDistance(source, target);
        if (distance !== 1) {
            alert("Too far! Must be adjacent.");
            return;
        }

        // Cost Check
        if (team.ap < 2) {
            alert("Not enough AP!");
            return;
        }

        // Push History
        this.pushAction({
            type: 'PURIFY',
            target: target,
            prevOwner: 9,
            prevPower: target.power,
            prevShield: target.isShielded,
            cost: 2
        });

        // Effect: Neutralize regardless of Power or Special Status
        console.log(`Purifying Tile: ${target.q},${target.r} (Power: ${target.power}, Special: ${target.isSpecial})`);

        target.setOwner(0); // Neutral
        target.setPower(1); // Weak
        target.isShielded = false; // Remove Shield if any
        target.draw(); // Force Redraw

        team.ap -= 2;
        alert("Purification Successful!");
        this.events.emit('updateUI');
    }

    actionRecruit() {
        this.purifyMode = false; // Reset modes
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
        team.ap -= 1;
        this.events.emit('updateUI');
    }

    actionFortify() {
        this.purifyMode = false; // Reset modes
        const team = this.gameManager.getCurrentTeam();
        if (!this.selectedTile || this.selectedTile.ownerID !== team.id) return;
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
    }

    tryAttack(target, team) {
        const source = this.selectedTile;
        if (!source || source.ownerID !== team.id) return; // Logic check

        // Phonics Invincibility Check
        if (target.ownerID === 9 && this.gameManager.currentRound === 16) {
            alert("Phonics are INVINCIBLE this round!");
            return;
        }

        const distance = this.grid.getDistance(source, target);
        if (distance !== 1) {
            console.log("Too far");
            return;
        }

        // 2. Costs 2 AP
        if (team.ap < 2) {
            console.log("Not enough AP");
            alert("Not enough AP (Need 2)"); // Optional feedback
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
                team.ap -= 2;
            } else {
                console.log("Not enough power to conquer Neutral (Need >= 2)");
                alert("Need Power 2+ to capture neutral!");
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
            team.ap -= 2;
        } else {
            console.log("Attack Failed: Weak or Shielded");
            alert("Attack Failed: Target too strong or shielded!");
            this.actionHistory.pop(); // Remove failed action
            return;
        }

        this.events.emit('updateUI');
    }

    update() {
        // Game loop
    }
}
