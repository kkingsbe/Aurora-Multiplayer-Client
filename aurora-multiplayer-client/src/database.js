const sqlite3 = require("sqlite3");
const path = require("path");
const isDev = require("electron-is-dev")

const gamePath = (isDev) ? "../" :  process.env.PORTABLE_EXECUTABLE_DIR + "/";
const databasePath = path.resolve(gamePath, "AuroraDB.db");

let database = new sqlite3.Database(databasePath,sqlite3.OPEN_READONLY,(err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log("Connected to database");
});

//Returns a promise for the GameTime property of the specified game
module.exports.getTime = async function(selectedGame) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT GameName, GameTime FROM FCT_Game WHERE GameName = '${selectedGame}'`;
        database.get(sql,(err,row) => {
            if (err) {
                reject(err);
            }
            if (row === undefined) {
                reject("No game with specified name");
            } else {
                resolve(row.GameTime);
            }
        });
    })
}

//Closes the database connection
module.exports.close = function() {
    database.close((err) => {
        if (err) {
            return console.log(err.message);
        }
        console.log("Closed the database connection");
    });
}