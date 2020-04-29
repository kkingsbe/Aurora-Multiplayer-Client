//Import the needed node modules
const AWS = require('aws-sdk')
const fs = require('fs')
const isDev = require("electron-is-dev")
var path = require('path')

//Detect if running in dev or prod
var gamePath = ""
if(isDev) gamePath = "../"
else gamePath = process.env.PORTABLE_EXECUTABLE_DIR + "/"

//Set up the AWS module
AWS.config.region = 'us-east-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:c4733679-8bcb-4b4e-931d-6794a9e28293',
});
const BUCKET_NAME = 'aurora-multiplayer-saves'
const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: {Bucket: BUCKET_NAME}
})

//Preforms the initial upload of the game to the AWS S3 bucket if no game with that name already exists
module.exports.uploadGame = async function(gameName, users) {
  return new Promise(async (resolve, reject) => {
    //let time = await this.currentTime(gameName)
    if(users.length <= 0) {
      reject("User list empty")
      return
    }
    if(await this.gameExists(gameName)) {
      reject("Game already exists")
      return
    }
    //make user objects out of username string list
    function UserObject(name) {
      this.name = name
      this.hasPlayed = false
      this.warpVote = {}
      /*Warp types:
        1: seconds
        2: minutes
        3: hours
        4. days
        5. weeks
        6. months
        7. years
      */
    }
    let userObjects = []
    for(let name of users) {
      userObjects.push(new UserObject(name))
    }
    let gameData = {
      gameName: gameName,
      //time: time,
      users: userObjects,
    }
    let configContent = JSON.stringify(gameData)
    //fs.writeFileSync(path.resolve(process.env.PORTABLE_EXECUTABLE_DIR, "multiplayer.config"), configContent)
    //let dbContent = fs.readFileSync(path.resolve(process.env.PORTABLE_EXECUTABLE_DIR, "AuroraDB.db"))
    let dbStream = fs.createReadStream(path.resolve(gamePath + "AuroraDB.db"))
    let params = {
      Key: `${gameName}/AuroraDB.db`,
      Body: dbStream
    }
    await s3.putObject(params).promise()

    params = {
      Key: `${gameName}/multiplayer.config`,
      Body: configContent
    }
    await s3.upload(params, (err, data) => {
      if(err) reject(err)
      console.log(`Successfully created game! ${data}`)
      resolve(true)
    }).promise()

    resolve("Game uploaded")
  })
}

//Records the given users vote in multiplayer.config, and uploads that and AuroraDB.db to the AWS S3 bucket
module.exports.submitTurn = async function(gameData, userName, warpVote) {
  return new Promise(async (resolve, reject) => {
    //let gameData = await this.getConfig(gameName) - originally this had the gameName passed on, but why load the config again?
    //let localGameTime = await this.currentTime(gameName)

    /*
    //If the user is not the game creator, they are not allowed to advance time
    if(userName != gameData.users[0] && localGameTime != gameData.time) {
      reject("Illegal time advancement")
      return
    }
    */

    //TODO: Best make sure again here that lock is still in place on our name

    //TODO: Different actions based on the user only playing last turn, but not advancing time or playing last turn and advancing, but not playing again.
    //      Have them click checkboxes or something, best display it to them like a flowchart, a sequence: play, increment, play, upload

    //set warpVote and hasPlayed for current player
    let status = await this.turnStatus(gameData)
    console.log("status: " +  status)
    let hasPlayed = await this.hasUserPlayed(gameData, userName)
    console.log("hasPlayed: " +  hasPlayed)
    let newTurn = (status === "ready for processing" || (status === "last player" && !hasPlayed)) ? true : false //only one player needed to upload and it was this one. They advanced time and played first in the new turn.
    console.log("newTurn: " +  newTurn)
    for(let user of gameData.users) {
      if(user.name === userName) {
        console.log("found self in user list, adding vote")
        user.hasPlayed = true
        user.warpVote = warpVote
      } else if(newTurn) { //delete other votes and hasPlayed flags if the current player advanced to a new turn
        console.log("deleting player: " +  user.name + " vote")
        user.hasPlayed = false
        user.warpVote = {}
      }
    }

    let configContent = JSON.stringify(gameData)
    fs.writeFileSync(path.resolve(gamePath + "multiplayer.config"), configContent)
    //let dbContent = fs.readFileSync(path.resolve(process.env.PORTABLE_EXECUTABLE_DIR, "AuroraDB.db"))
    let dbStream = fs.createReadStream(path.resolve(gamePath + "AuroraDB.db"))
    let params = {
      Key: `${gameData.gameName}/AuroraDB.db`,
      Body: dbStream
    }
    await s3.upload(params, (err, data) => {
      if(err) reject(err)
      //console.log(`Successfully created game! ${data.Location}`)
    }).promise()

    params = {
      Key: `${gameData.gameName}/multiplayer.config`,
      Body: configContent
    }
    await s3.upload(params, (err, data) => {
      if(err) reject(err)
      //console.log(`Successfully created game! ${data.Location}`)
    }).promise()
    resolve(newTurn)
  })
}

//Returns the config file stored in S3
module.exports.getConfig = async function(gameName) {
  return new Promise((resolve, reject) => {
    const params = {
      Key: `${gameName}/multiplayer.config`
    }
    s3.getObject(params, (err, data) => {
      if (err) {
        reject(err)
        return
      }
      resolve(JSON.parse(data.Body.toString()))
    })
  })
}

//Downloads AuroraDB.db
module.exports.pullGame = async function(gameName) {
  return new Promise(async (resolve, reject) => {
    let filePath = path.resolve(gamePath, "")
    //Get AuroraDB.db file
    params = {
      Key: `${gameName}/AuroraDB.db`
    }
    let file = fs.createWriteStream(`${filePath}/AuroraDB.db`)
    s3.getObject(params).createReadStream().pipe(file)
    file.on("close", () => {resolve()})
  })
}

//returns true if a game with the provided name exists, determined by a multiplayer.config file being present. Returns false on error or if not present.
module.exports.gameExists = async function(gameName) {
  return new Promise((resolve, reject) => {
    const params = {
      Key: `${gameName}/multiplayer.config`
    }
    s3.headObject(params, (err, data) => {
      if (err) {
        console.log("Err in gameExists: " + err)
        resolve(false)
        return
      }
      resolve(true)
    })
  })
}

//Gets lock file for game. Will either return no lock or user which the game is currently locked for or error
module.exports.checkLock = async function(gameName) {
  return new Promise(async (resolve, reject) => {
    const params = {
      Key: `${gameName}/lock`
    }
    s3.getObject(params, (err, data) => {
      if (err) {
        reject(err)
        return
      }
      resolve(data.Body.toString())
    })
  })
}

//Creates new lock file containing given username. Does not throw error if a lock is being overwritten! Use getLock first to determine if a game already has a lock file present.
module.exports.createLock = async function(gameName, userName) {
  return new Promise(async (resolve, reject) => {
    params = {
      Key: `${gameName}/lock`,
      Body: userName
    }
    await s3.upload(params, (err, data) => {
      if(err) {
        reject(err)
        return
      }
      resolve()
    })
  })
}

//Deletes lock file for game, to be used after a user has uploaded
module.exports.deleteLock = async function(gameName) {
  return new Promise(async (resolve, reject) => {
    const params = {
      Key: `${gameName}/lock`
     }
     s3.deleteObject(params, (err, data) => {
       if (err) {
         reject(err)
         return
       }
       resolve()
     })
  })
}

//Checks if the given user is in the given config file
module.exports.inGame = function(config, username) {
  let users = config.users
  for(let user of users) {
    if(user.name === username) return true
  }
  return false
}

/*  Checks status of current turn.
    - All players have played:              ready for procssing
    - All but one player have played:       last player
    - More than one player has not played:  turn in progress
*/
module.exports.turnStatus = function(config) {
  let numUsers = config.users.length
  let numPlayed = 0
  for(let user of config.users) {
    if(user.hasPlayed === true) numPlayed++
  }
  if(numPlayed === numUsers) return "ready for processing"
  else if(numPlayed === numUsers - 1) return "last player"
  else return "turn in progress"
}

//Checks if user is present in this config
module.exports.isUserInGame = function(config, username) {
  for(let user of config.users) {
    if(user.name === username) return true
  }
  return false
}

//Checks if the current user has already uploaded the DB once this increment
module.exports.hasUserPlayed = function(config, username) {
  for(let user of config.users) {
    if(user.name === username) return user.hasPlayed
  }
  return false //should never be reached as long as the user is in the list
}

//Checks in the database if GameTime is the same as provided argument
module.exports.currentlyIsTime = async function (gameName, expectedTime) {
  return new Promise(async (resolve, reject) => {
      const db = require("./database");
      const time = await db.getTime(gameName).catch((message) => {
        reject("Failed");
      });
      db.close();
      if (time == expectedTime) {
        resolve(true);
      } else {
        resolve(false);
      }
  })
}

//Returns the current game time
module.exports.currentTime = async function (gameName) {
  return new Promise(async (resolve, reject) => {
      const db = require("./database");
      const time = await db.getTime(gameName).catch((message) => {
        reject(message);
      });
      console.log(time)
      db.close();
      resolve(time)
  })
}
