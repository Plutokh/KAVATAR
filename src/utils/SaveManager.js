export default class SaveManager {
    static SAVE_KEY = 'kavatar_save_data_v1';

    static save(gm) {
        if (!gm || !gm.grid) {
            console.error("SaveManager: Invalid GameManager or Grid");
            return false;
        }

        try {
            const state = {
                // Game Settings
                mapId: gm.mapId,
                currentRound: gm.currentRound,
                currentTurn: gm.currentTurn,
                isPart2: gm.isPart2,
                isSetupPhase: gm.isSetupPhase,
                setupTurn: gm.setupTurn,
                timeLeft: gm.timeLeft, // Save Time Left

                // Team Data
                teamData: gm.teamData,

                // Grid Data
                tiles: []
            };

            // Serialize Tiles
            const tiles = gm.grid.getAllTiles();
            tiles.forEach(tile => {
                state.tiles.push({
                    q: tile.q,
                    r: tile.r,
                    ownerID: tile.ownerID,
                    power: tile.power,
                    isShielded: tile.isShielded,
                    isPermanentShield: tile.isPermanentShield,
                    isSpecial: tile.isSpecial,
                    specialName: tile.specialName
                });
            });

            const jsonString = JSON.stringify(state);
            localStorage.setItem(SaveManager.SAVE_KEY, jsonString);
            // console.log("Game State Saved (Length: " + jsonString.length + ")");
            return true;
        } catch (e) {
            console.error("SaveManager: Failed to save", e);
            return false;
        }
    }

    static load(gm) {
        if (!gm || !gm.grid) {
            console.error("SaveManager: Invalid GameManager or Grid");
            return false;
        }

        const jsonString = localStorage.getItem(SaveManager.SAVE_KEY);
        if (!jsonString) {
            console.log("SaveManager: No save data found.");
            return false;
        }

        try {
            const state = JSON.parse(jsonString);

            // Restore Game Settings
            gm.currentRound = state.currentRound;
            gm.currentTurn = state.currentTurn;
            gm.isPart2 = state.isPart2;
            gm.isSetupPhase = state.isSetupPhase;
            gm.setupTurn = state.setupTurn;
            gm.timeLeft = state.timeLeft || 60; // Default if missing

            // Restore Team Data
            gm.teamData = state.teamData;

            // Restore Grid
            if (state.tiles) {
                state.tiles.forEach(data => {
                    const tile = gm.grid.getTile(data.q, data.r);
                    if (tile) {
                        tile.setOwner(data.ownerID);
                        tile.setPower(data.power);
                        tile.isShielded = data.isShielded;
                        tile.isPermanentShield = data.isPermanentShield;

                        if (data.isSpecial) {
                            tile.setSpecial(data.specialName);
                        } else {
                            tile.isSpecial = false;
                            tile.specialName = '';
                        }
                        tile.draw(); // Refresh Visuals
                    }
                });
            }

            // Restore UI
            gm.scene.events.emit('updateUI');

            // Restore Timer
            if (gm.restoreTimer) {
                gm.restoreTimer();
            }

            gm.scene.events.emit('showToast', "게임 로드 완료!");
            console.log("Game State Loaded successfully.");
            return true;

        } catch (e) {
            console.error("SaveManager: Failed to load save data", e);
            gm.scene.events.emit('showToast', "세이브 파일 로드 오류!");
            return false;
        }
    }

    static hasSave() {
        return !!localStorage.getItem(SaveManager.SAVE_KEY);
    }

    static clearSave() {
        localStorage.removeItem(SaveManager.SAVE_KEY);
        console.log("SaveManager: Save data cleared.");
    }
}
