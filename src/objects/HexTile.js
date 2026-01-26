export default class HexTile extends Phaser.GameObjects.Container {
    constructor(scene, q, r, x, y, size, index) {
        super(scene, x, y);
        scene.add.existing(this);

        this.q = q;
        this.r = r;
        this.size = size;
        this.index = index; // Sequential ID

        // Game Data
        this.ownerID = 0; // 0: Neutral, 1-5: Teams, 9: PONIX
        this.power = 0;
        this.isShielded = false;
        this.isSelected = false;
        this.isSpecial = false;
        this.specialName = '';

        // Visuals
        this.graphics = scene.add.graphics();
        this.add(this.graphics);

        this.text = scene.add.text(0, 5, '', { // Shifted down
            fontFamily: 'Black Han Sans',
            fontSize: `${size}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        this.add(this.text);

        this.label = scene.add.text(0, 25, '', { // Shifted down
            fontFamily: 'Do Hyeon',
            fontSize: '12px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.add(this.label);

        // Coordinate Label (Small, Top) -> Now Sequential Index
        this.coordLabel = scene.add.text(0, -25, `${index}`, { // Moved inside
            fontFamily: 'Black Han Sans', // Bold Font
            fontSize: '21px', // Reduced to 80% of 26px
            color: '#ffffff', // White
            stroke: '#000000', // Strong Black outline
            strokeThickness: 4
        }).setOrigin(0.5);
        this.add(this.coordLabel);

        this.draw();

        // Interaction
        this.setInteractive(new Phaser.Geom.Polygon(this.getHexPoints()), Phaser.Geom.Polygon.Contains);
    }

    getHexPoints() {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle_deg = 60 * i - 30;
            const angle_rad = Math.PI / 180 * angle_deg;
            points.push({
                x: this.size * Math.cos(angle_rad),
                y: this.size * Math.sin(angle_rad)
            });
        }
        return points;
    }

    draw() {
        const points = this.getHexPoints();

        this.graphics.clear();

        // Color based on owner
        let color = 0x888888; // Neutral
        if (this.ownerID === 1) color = 0xff8c00; // Orange (Darker)
        else if (this.ownerID === 2) color = 0xffd700; // Yellow (Gold)
        else if (this.ownerID === 3) color = 0x00c853; // Green (Vivid)
        else if (this.ownerID === 4) color = 0x3399FF; // Blue (Brightened)
        else if (this.ownerID === 5) color = 0xCC66FF; // Purple (Brightened)
        else if (this.ownerID === 6) color = 0xD2B48C; // Brown (Tan/Light Brown)
        else if (this.ownerID === 9) color = 0xff0000; // Phonics (Bright Red)

        // Settings for Transparency
        let alpha = 0.8; // High visibility
        if (this.ownerID === 0) alpha = 0.2; // Neutrals more transparent
        if (this.ownerID === 9) alpha = 0.7; // Phonics darker

        // Fill
        this.graphics.fillStyle(color, alpha);
        this.graphics.fillPoints(points, true);

        // Stroke
        this.graphics.lineStyle(2, 0xffffff, 1);
        if (this.ownerID === 9) this.graphics.lineStyle(4, 0xff0000, 1); // Phonics glow

        // Special Tile Gold Border
        if (this.isSpecial) this.graphics.lineStyle(4, 0xffd700, 1); // Gold

        this.graphics.strokePoints(points, true);

        if (this.isShielded) {
            this.graphics.lineStyle(5, 0x00ffff, 1);
            this.graphics.strokePoints(points, true);
        }

        // Highlight Selection (Thick White Border)
        if (this.isSelected) {
            this.graphics.lineStyle(6, 0xffffff, 1);
            this.graphics.strokePoints(points, true);
        }

        // Text
        if (this.power > 0 && this.ownerID !== 0) { // Hide power for Neutral
            this.text.setText(this.power.toString());
        } else {
            this.text.setText('');
        }

        // Label
        if (this.isSpecial) {
            this.label.setText(this.specialName);
        }
    }

    setSpecial(name) {
        this.isSpecial = true;
        this.specialName = name;
        this.draw();
    }

    setOwner(id) {
        this.ownerID = id;
        this.draw();
    }

    setPower(val) {
        this.power = val;
        this.draw();
    }

    select() {
        this.isSelected = true;
        this.draw();
    }

    deselect() {
        this.isSelected = false;
        this.draw();
    }
}
