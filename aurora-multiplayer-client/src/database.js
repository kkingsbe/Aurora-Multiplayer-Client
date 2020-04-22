const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "../../AuroraDB.db");

let database = new sqlite3.Database(databasePath,sqlite3.OPEN_READONLY,(err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log("Connected to database");
});

//Returns a promise for the GameTime property of the specified game
module.exports.getTime = async function(selectedGame) {
    return new Promise((resolve, reject) => {
        const sql = "SELECT GameName, GameTime FROM FCT_Game";
        database.all(sql,(err,rows) => {
            if (err) {
                reject(err);
            }
            rows.forEach((row)=>{
                if (row.GameName == selectedGame) {
                    resolve(row.GameTime);
                }
            });
            reject("Failed");
        });
    })
}