export default class HexTile extends Phaser.GameObjects.Container {
    constructor(scene, q, r, x, y, size, index) {
        super(scene, x, y);
        scene.add.existing(this);

        this.q = q;
        this.r = r;
        this.size = size;
        this.index = index;

        // Make Container Interactive (Hexagon Hit Area)
        // Pointy Top Hexagon Points
        const hitPoints = [];
        for (let i = 0; i < 6; i++) {
            const angle_deg = 60 * i - 30;
            const angle_rad = Math.PI / 180 * angle_deg;
            hitPoints.push({
                x: size * Math.cos(angle_rad),
                y: size * Math.sin(angle_rad)
            });
        }
        this.setInteractive(new Phaser.Geom.Polygon(hitPoints), Phaser.Geom.Polygon.Contains);

        // Game Data
        this.ownerID = 0; // 0: Neutral, 1:Orange, 2:Yellow, 3:Green, 4:Blue, 5:Purple, 6:Pink, 9:PONIX
        this.power = 0;
        this.isShielded = false;
        this.isPermanentShield = false; // "Kingdom" status
        this.isSelected = false;
        this.isSpecial = false;
        this.specialName = '';

        // 1. Base Sprite (The Tile)
        this.baseSprite = scene.add.sprite(0, 0, 'field_brown');
        // Scale adjustment if needed. 
        // Request: "Hexagon size: 68x78 px". The images are likely already this size or close.
        // Let's assume 1:1 for now, or check scale.
        // If grid spacing is different, we might need to scale. 
        // Previous code used `size` (radius) for drawing.
        // If size=42, width ~ 72, height ~ 84.
        // User said images are 68x78.
        // For now, let's just use the image size.
        this.add(this.baseSprite);

        // 2. Overlay Objects
        // Crown (Special / Landmark) using 'crown_gold'
        this.crownSprite = scene.add.sprite(0, 0, 'crown_gold').setVisible(false);
        this.add(this.crownSprite);

        // Dice (Power) using 'dice_1' to 'dice_5'
        this.diceSprite = scene.add.sprite(0, 0, 'dice_1').setVisible(false);
        this.add(this.diceSprite);

        // Special Tile Border (semi-transparent overlay for captured special tiles)
        this.specialBorder = scene.add.graphics();
        this.add(this.specialBorder);

        // Team Highlight Border (e.g., for Purple Team)
        this.teamBorder = scene.add.graphics();
        this.add(this.teamBorder);

        // Coordinate Label (Debug or Small) - Keeping minimal or removing?
        // User request didn't mention it, but usually good for debug.
        // Making it very subtle or hidden.
        this.coordText = scene.add.text(0, -30, `${q},${r}`, {
            fontFamily: 'Arial', fontSize: '10px', color: '#000000'
        }).setOrigin(0.5).setVisible(false); // Default Hidden
        this.add(this.coordText);

        // Index Label (Visible tile number)
        this.indexText = scene.add.text(0, 28, `${index}`, {
            fontFamily: 'Arial', fontSize: '21px', color: '#FFFFFF',
            stroke: '#000000', strokeThickness: 3, fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add(this.indexText);

        this.updateVisuals();

        // Interaction
        // Polygon for hit area (Images are hexagonalish)
        // 68x78.
        // Let's define a rough hexagon based on 68x78.
        const points = [
            { x: 0, y: -39 },
            { x: 34, y: -20 },
            { x: 34, y: 20 },
            { x: 0, y: 39 },
            { x: -34, y: 20 },
            { x: -34, y: -20 }
        ];
        this.setInteractive(new Phaser.Geom.Polygon(points), Phaser.Geom.Polygon.Contains);
    }

    updateVisuals() {
        let textureKey = '';

        // Determine Base Texture
        if (this.ownerID === 0) {
            // Neutrals
            if (this.isSpecial) {
                if (this.specialName === '창의학습관') {
                    textureKey = this.isSelected ? 'field_gold_selected' : 'field_gold';
                } else {
                    textureKey = this.isSelected ? 'field_silver_selected' : 'field_silver';
                }
            } else {
                textureKey = this.isSelected ? 'field_brown_selected' : 'field_brown';
            }
        } else {
            // Teams
            const colorMap = {
                1: 'orange', 2: 'yellow', 3: 'green', 4: 'blue', 5: 'purple', 6: 'pink', 9: 'ponix'
            };
            const color = colorMap[this.ownerID] || 'brown';

            // Suffix construction
            let suffix = '';

            // Priority: Kingdom (Perm Shield) > Shield > Normal
            if (this.isPermanentShield && color !== 'ponix') {
                suffix = '_kingdom';
            } else if (this.isShielded) {
                suffix = '_shield';
            }

            if (this.isSelected) {
                suffix += '_selected';
            }

            textureKey = `land_${color}${suffix}`;
        }

        // Fallback check?
        // this.baseSprite.setTexture(textureKey);
        // Note: SetTexture might fail if key doesn't exist (loading error?). 
        // Assuming keys exist.
        if (this.scene.textures.exists(textureKey)) {
            this.baseSprite.setTexture(textureKey);
        } else {
            // Fallback for missing combinations (e.g. maybe kingdom_shield_selected doesn't exist perfectly)
            // Try removing selected
            if (textureKey.includes('_selected')) {
                const fallback = textureKey.replace('_selected', '');
                if (this.scene.textures.exists(fallback)) {
                    this.baseSprite.setTexture(fallback);
                }
            }
        }

        // Crown
        // Show if Special Land (Landmark)
        // User said: "특수 칸은 칸 위에 왕관 모양을 얹고"
        if (this.isSpecial) {
            this.crownSprite.setVisible(true);
            // Gold crown for Creative Learning Center, Silver for others
            if (this.specialName === '창의학습관') {
                this.crownSprite.setTexture('crown_gold');
            } else {
                this.crownSprite.setTexture('crown_silver');
            }
            this.crownSprite.setDepth(1); // Above base
        } else {
            this.crownSprite.setVisible(false);
        }

        // Dice (Power)
        if (this.ownerID !== 0 && this.power > 0) {
            this.diceSprite.setVisible(true);
            const p = Math.min(5, Math.max(1, this.power));
            this.diceSprite.setTexture(`dice_${p}`);
            this.diceSprite.setDepth(2); // Above crown?
        } else {
            this.diceSprite.setVisible(false);
        }

<<<<<<< HEAD

=======
        // Special Tile Border (REMOVED as per user request)
        this.specialBorder.clear();

        // Team Highlight Border (Purple Team - ID 5)
        this.teamBorder.clear();
        if (this.ownerID === 5) {
            // Darken Tint
            // If Kingdom or Shielded, use Lighter Tint for visibility (User Request)
            if (this.isPermanentShield || this.isShielded) {
                this.baseSprite.setTint(0xCCCCCC); // Lighter for Castle/Shield
            } else {
                this.baseSprite.setTint(0x888888); // Darker tint for normal land
            }

            // Draw Bright Border
            // Using same points as specialBorder/hitArea
            const points = [
                { x: 0, y: -39 },
                { x: 34, y: -20 },
                { x: 34, y: 20 },
                { x: 0, y: 39 },
                { x: -34, y: 20 },
                { x: -34, y: -20 }
            ];

            this.teamBorder.lineStyle(2, 0xD080FF, 1.0); // Bright Purple Stroke
            this.teamBorder.beginPath();
            this.teamBorder.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                this.teamBorder.lineTo(points[i].x, points[i].y);
            }
            this.teamBorder.closePath();
            this.teamBorder.strokePath();
            this.teamBorder.setDepth(1.6); // Above special border?

        } else {
            this.baseSprite.clearTint();
        }
>>>>>>> dfe1812 (Refactor: Improve visual clarity and fix undo logic)
    }

    // Proxy methods to trigger update
    draw() {
        this.updateVisuals();
    }

    setSpecial(name) {
        this.isSpecial = true;
        this.specialName = name;
        this.updateVisuals();
    }

    setOwner(id) {
        this.ownerID = id;
        this.updateVisuals();
    }

    setPower(val) {
        this.power = val;
        this.updateVisuals();
    }

    select() {
        this.isSelected = true;
        this.updateVisuals();
    }

    deselect() {
        this.isSelected = false;
        this.updateVisuals();
    }
}
