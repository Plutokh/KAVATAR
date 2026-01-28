export default class SaveManager {
    static save(gm) {
        if (!gm || !gm.grid) {
            console.error("SaveManager: Invalid GameManager or Grid");
            return null;
        }

        const state = {
            // Game Settings
            mapId: gm.mapId,
            currentRound: gm.currentRound,
            currentTurn: gm.currentTurn,
            isPart2: gm.isPart2,
            isSetupPhase: gm.isSetupPhase,
            setupTurn: gm.setupTurn,

            // Team Data
            teamData: gm.teamData,

            // Grid Data
            tiles: []
        };

        // Serialize Tiles
        const tiles = gm.grid.getAllTiles();
        tiles.forEach(tile => {
            state.tiles.push({
                key: `${tile.q},${tile.r}`,
                q: tile.q,
                r: tile.r,
                ownerID: tile.ownerID,
                power: tile.power,
                isShielded: tile.isShielded,
                isPermanentShield: tile.isPermanentShield,
                isSpecial: tile.isSpecial,
                specialName: tile.specialName,
                // index: tile.index (Re-generated on load, but maybe needed if custom map logic uses it. Mostly sequential.)
                index: tile.index
            });
        });

        const json = JSON.stringify(state);
        console.log("Game State Saved (Length: " + json.length + ")");
        return json;
    }

    static load(gm, jsonString) {
        if (!gm || !gm.grid) {
            console.error("SaveManager: Invalid GameManager or Grid");
            return false;
        }

        try {
            const state = JSON.parse(jsonString);

            // Restore Game Settings
            // Note: Map regeneration might be needed if mapId changes, 
            // but usually we assume loading into the correct scene. 
            // For safety, we just overwrite values.
            gm.currentRound = state.currentRound;
            gm.currentTurn = state.currentTurn;
            gm.isPart2 = state.isPart2;
            gm.isSetupPhase = state.isSetupPhase;
            gm.setupTurn = state.setupTurn;

            // Restore Team Data
            gm.teamData = state.teamData;

            // Restore Grid
            // We iterate over SAVED tiles and update the CURRENT grid tiles.
            // If the map matches (q,r keys match), this works.
            if (state.tiles) {
                state.tiles.forEach(data => {
                    const tile = gm.grid.getTile(data.q, data.r);
                    if (tile) {
                        tile.setOwner(data.ownerID);
                        tile.setPower(data.power);
                        tile.isShielded = data.isShielded;
                        tile.isPermanentShield = data.isPermanentShield;

                        // Special status usually static, but maybe dynamic via events? 
                        // Restoring it effectively allows custom scenarios.
                        if (data.isSpecial) {
                            tile.setSpecial(data.specialName);
                        } else {
                            tile.isSpecial = false;
                            tile.specialName = '';
                        }

                        // We don't restore Index usually as it's static, 
                        // but if state includes it, we check? No need.
                        tile.draw(); // Refresh Visuals
                    }
                });
            }

            // Refresh UI
            gm.scene.events.emit('updateUI');
            gm.scene.events.emit('showToast', "Game State Loaded!");
            console.log("Game State Loaded successfully.");
            return true;

        } catch (e) {
            console.error("SaveManager: Failed to load save data", e);
            gm.scene.events.emit('showToast', "Error Loading Save!");
            return false;
        }
    }
}
