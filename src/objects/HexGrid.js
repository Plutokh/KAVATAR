import HexTile from './HexTile.js';

export default class HexGrid {
    constructor(scene, centerX, centerY, size, radius, mapId) {
        this.scene = scene;
        this.centerX = centerX;
        this.centerY = centerY;
        this.hexSize = size;
        this.mapRadius = radius;
        this.mapId = mapId;
        this.tiles = new Map(); // key: "q,r", value: HexTile
        this._tilesCache = null; // Cached array of tiles

        // Cache mathematical constants for performance
        this.SQRT3 = Math.sqrt(3);
        this.HALF_SQRT3 = this.SQRT3 / 2;
        this.HEX_HEIGHT_MULTIPLIER = 1.5;

        this.generateMap();
    }

    generateMap() {
        if (this.mapId === 1) {
            this.generateMap1();
        } else if (this.mapId === 2) {
            this.generateMap2();
        } else if (this.mapId === 3) {
            this.generateMap3();
        }
    }

    generateMap2() {
        // Map 2: Custom Row Lengths
        // Rows: 3, 6, 9, 10, 11, 10, 11, 10, 11, 10, 9, 6, 3
        // Total 13 rows -> r from -6 to 6
        const rowLengths = [3, 6, 9, 10, 11, 10, 11, 10, 11, 10, 9, 6, 3];
        const rStart = -6;

        for (let i = 0; i < rowLengths.length; i++) {
            const r = rStart + i;
            const count = rowLengths[i];

            // To center the row, we need to find the starting q
            // Standard Hex Logic: q + r + s = 0
            // For r=-6 (Top), q usually starts at 0 or near it depending on shape
            // Let's assume Axial symmetry where (0,0) is center.
            // Row Center Q ~= -r/2.
            // Start Q = Math.round(-r/2 - (count-1)/2)

            const centerQ = -r / 2.0;
            const startQ = Math.ceil(centerQ - count / 2.0);

            for (let k = 0; k < count; k++) {
                const q = startQ + k;
                this.createTile(q, r);
            }
        }

        // Feature: Map 2 Specials
        // 1. Center (0,0)
        const center = this.getTile(0, 0);
        if (center) { center.setSpecial('중앙 타워'); center.draw(); }

        // 2. Radius 3 Hexagon Vertices
        const rad3Verts = [
            { q: 0, r: -3 }, { q: 3, r: -3 }, { q: 3, r: 0 },
            { q: 0, r: 3 }, { q: -3, r: 3 }, { q: -3, r: 0 }
        ];

        rad3Verts.forEach(v => {
            const t = this.getTile(v.q, v.r);
            if (t) { t.setSpecial('위성 타워'); t.draw(); }
        });

        console.log(`Generated Map 2 (Custom Layout) with ${this.tiles.size} tiles.`);
    }

    generateMap3() {
        // Map 3: Radius 6 Hexagon
        // HQs at Radius 6 Corners (in GameManager)
        this.addHexGroup(0, 0, 6);

        // Specials: Specific Indices provided by User + Center Tile (0,0)
        const specialIndices = [85, 108, 37, 20, 43, 91];

        this.tiles.forEach(tile => {
            if (specialIndices.includes(tile.index)) {
                tile.setSpecial('내부 타워');
            }
        });

        // Center Tile (0, 0)
        const centerTile = this.getTile(0, 0);
        if (centerTile) {
            centerTile.setSpecial('중앙 타워');
        }

        console.log(`Generated Map 3 (Hexagon R6) with ${this.tiles.size} tiles.`);
    }

    generateMap1() {
        // Custom Map Data provided by User (v1.8 Hand-Drawn)
        const mapData = [
            { q: -9, r: 7 }, { q: -8, r: 7 }, { q: -7, r: 7 }, { q: -6, r: 7 }, { q: -5, r: 6 }, { q: -4, r: 6 }, { q: -3, r: 6 }, { q: -2, r: 6 }, { q: -1, r: 6 },
            { q: 0, r: 5 }, { q: 1, r: 5 }, { q: 3, r: 5 }, { q: 2, r: 5 }, { q: 4, r: 5 }, { q: 5, r: 5 }, { q: 5, r: 4 }, { q: 4, r: 4 }, { q: 3, r: 4 },
            { q: 2, r: 4 }, { q: 1, r: 4 }, { q: 0, r: 4 }, { q: -1, r: 5 }, { q: -2, r: 5 }, { q: -3, r: 5 }, { q: -4, r: 5 }, { q: -5, r: 5 }, { q: -6, r: 6 },
            { q: -7, r: 6 }, { q: -10, r: 7 }, { q: -10, r: 6 }, { q: -9, r: 5 }, { q: -9, r: 4 }, { q: -9, r: 3 }, { q: -9, r: 2 }, { q: -8, r: 1 },
            { q: -7, r: 0 }, { q: -6, r: 0 }, { q: -5, r: 0 }, { q: -5, r: -1 }, { q: -4, r: -1 }, { q: -4, r: -2 }, { q: -3, r: -3 }, { q: -2, r: -4 }, { q: -1, r: -5 },
            { q: 0, r: -6 }, { q: 1, r: -6 }, { q: 1, r: -5 }, { q: 2, r: -5 }, { q: 2, r: -4 }, { q: 2, r: -3 }, { q: 3, r: -3 }, { q: 3, r: -2 }, { q: 4, r: -2 },
            { q: 4, r: -1 }, { q: 5, r: -2 }, { q: 5, r: -1 }, { q: 6, r: -1 }, { q: 6, r: 0 }, { q: 6, r: 1 }, { q: 5, r: 2 }, { q: 4, r: 3 }, { q: -8, r: 6 },
            { q: -9, r: 6 }, { q: -8, r: 5 }, { q: -7, r: 5 }, { q: -6, r: 5 }, { q: -7, r: 4 }, { q: -8, r: 4 }, { q: -8, r: 3 }, { q: -7, r: 3 }, { q: -8, r: 2 },
            { q: -7, r: 2 }, { q: -7, r: 1 }, { q: -6, r: 1 }, { q: -5, r: 1 }, { q: -6, r: 2 }, { q: -6, r: 3 }, { q: -6, r: 4 }, { q: -5, r: 4 }, { q: -4, r: 4 },
            { q: -3, r: 4 }, { q: -2, r: 4 }, { q: -1, r: 4 }, { q: 1, r: 3 }, { q: 2, r: 3 }, { q: 3, r: 3 }, { q: 4, r: 2 }, { q: 5, r: 1 }, { q: 5, r: 0 },
            { q: 0, r: 3 }, // Added Missing Tile
            { q: 0, r: -5 }, { q: -1, r: -4 }, { q: 0, r: -4 }, { q: 1, r: -4 }, { q: -2, r: -3 }, { q: -1, r: -3 }, { q: 0, r: -3 }, { q: 1, r: -3 }, { q: -3, r: -2 },
            { q: -2, r: -2 }, { q: -1, r: -2 }, { q: 0, r: -2 }, { q: 1, r: -2 }, { q: 2, r: -2 }, { q: -3, r: -1 }, { q: -2, r: -1 }, { q: -1, r: -1 }, { q: 0, r: -1 },
            { q: 0, r: 0 }, { q: 1, r: -1 }, { q: 1, r: 0 }, { q: 2, r: -1 }, { q: 2, r: 0 }, { q: 3, r: 0 }, { q: 3, r: -1 }, { q: 4, r: 0 }, { q: 4, r: 1 },
            { q: 3, r: 2 }, { q: 2, r: 2 }, { q: 1, r: 2 }, { q: 1, r: 1 }, { q: 2, r: 1 }, { q: 3, r: 1 }, { q: 0, r: 1 }, { q: -1, r: 2 }, { q: -2, r: 3 },
            { q: -3, r: 3 }, { q: -3, r: 2 }, { q: -2, r: 2 }, { q: 0, r: 2 }, { q: -1, r: 3 }, { q: -4, r: 2 }, { q: -4, r: 1 }, { q: -4, r: 0 }, { q: -5, r: 2 },
            { q: -5, r: 3 }, { q: -4, r: 3 }, { q: -3, r: 1 }, { q: -2, r: 0 }, { q: -1, r: 0 }, { q: -2, r: 1 }, { q: -1, r: 1 }, { q: -3, r: 0 }, { q: -5, r: 7 },
            { q: -4, r: 7 }, { q: -3, r: 7 }, { q: 0, r: 6 }, { q: 1, r: 6 }, { q: 2, r: 6 }, { q: -2, r: 7 }
        ];

        // Sort Data for Reading Order (Top-to-Bottom (r), Left-to-Right (q))
        mapData.sort((a, b) => {
            if (a.r !== b.r) return a.r - b.r;
            return a.q - b.q;
        });

        // Load Tiles from Data
        for (let data of mapData) {
            if (!this.tiles.has(`${data.q},${data.r}`)) {
                this.createTile(data.q, data.r);
            }
        }

        // Define Special Landmarks
        // 1. Original Q,R Landmarks (Preserved)
        const landmarksQR = [
            { q: -1, r: 2, name: '창의학습관' },
            { q: -3, r: 4, name: '오리연못' },
            { q: -6, r: 6, name: '응용공학동' },
            { q: -2, r: -1, name: '카이마루' },
            { q: 1, r: 1, name: '스컴' },
            { q: -6, r: 3, name: '어은동산' }
            // '대운동장' removed from here (was q:4, r:3)
        ];

        landmarksQR.forEach(lm => {
            const tile = this.getTile(lm.q, lm.r);
            if (tile) { tile.setSpecial(lm.name); tile.draw(); }
        });

        // 2. New ID-based Landmarks — use index map for O(1) lookup
        const indexMap = new Map();
        this.tiles.forEach(tile => indexMap.set(tile.index, tile));

        const landmarksID = [
            { id: 127, name: '대운동장' },
            { id: 5, name: '북측 연구소' },
            { id: 70, name: '미르나래관' },
            { id: 150, name: '나노종합기술원' },
            { id: 69, name: '서문' }
        ];

        landmarksID.forEach(lm => {
            const tile = indexMap.get(lm.id);
            if (tile) { tile.setSpecial(lm.name); tile.draw(); }
        });

        // Tile 133: Override to normal (non-special)
        const tile133 = indexMap.get(133);
        if (tile133) { tile133.isSpecial = false; tile133.specialName = ''; tile133.draw(); }

        console.log(`Generated Custom Map 1 with ${this.tiles.size} tiles.`);
    }

    addHexGroup(cq, cr, radius) {
        for (let q = -radius; q <= radius; q++) {
            let r1 = Math.max(-radius, -q - radius);
            let r2 = Math.min(radius, -q + radius);
            for (let r = r1; r <= r2; r++) {
                const mapQ = cq + q;
                const mapR = cr + r;

                // Add if not exists
                if (!this.tiles.has(`${mapQ},${mapR}`)) {
                    this.createTile(mapQ, mapR);
                }
            }
        }
    }

    createTile(q, r) {
        // Axial to Pixel conversion (pointy top)
        const x = this.centerX + this.hexSize * (this.SQRT3 * q + this.HALF_SQRT3 * r);
        const y = this.centerY + this.hexSize * (3 / 2 * r);

        const index = this.tiles.size + 1;
        const tile = new HexTile(this.scene, q, r, x, y, this.hexSize - 2, index);
        this.tiles.set(`${q},${r}`, tile);
        this._tilesCache = null; // Invalidate cache
        return tile;
    }

    getTile(q, r) {
        return this.tiles.get(`${q},${r}`);
    }

    getAllTiles() {
        if (!this._tilesCache) {
            this._tilesCache = Array.from(this.tiles.values());
        }
        return this._tilesCache;
    }

    getDistance(a, b) {
        return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
    }

    // Static directions array for memory optimization
    static DIRECTIONS = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];

    getNeighbors(tile) {
        const neighbors = [];
        for (const dir of HexGrid.DIRECTIONS) {
            const n = this.getTile(tile.q + dir.q, tile.r + dir.r);
            if (n) neighbors.push(n);
        }
        return neighbors;
    }

    destroy() {
        this.tiles.forEach(tile => {
            tile.destroy();
        });
        this.tiles.clear();
        this._tilesCache = null;
        console.log("HexGrid Destroyed");
    }
}
