const AWS = require('aws-sdk')
const fs = require('fs')
const isDev = require("electron-is-dev")
var path = require('path')

var gamePath = ""
if(isDev) gamePath = "../"
else gamePath = process.env.PORTABLE_EXECUTABLE_DIR + "/"

AWS.config.region = 'us-east-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:c4733679-8bcb-4b4e-931d-6794a9e28293',
});
const BUCKET_NAME = 'aurora-multiplayer-saves'
const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: {Bucket: BUCKET_NAME}
})

module.exports.uploadGame = async function(gameName, users) {
  return new Promise(async (resolve, reject) => {
    let gameData = {
      gameName: gameName,
      users: users,
      currentTurn: users[0],
      /*Warp types:
        1: seconds
        2: minutes
        3: hours
        4. days
        5. weeks
        6. months
        7. years
      */
      warpVotes: []
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

    resolve(true)
  })
}

module.exports.submitTurn = async function(gameName, userName, warpVote) {
  return new Promise(async (resolve, reject) => {
    let gameData = await this.getConfig(gameName)
    console.log(gameData)
    let alreadyVoted = false
    //Reset the votes if everyone has voted and it is now the game creators turn
    if(gameData.warpVotes.length >= gameData.users.length && userName == gameData.users[0]) {
      gameData.warpVotes = []
    }
    
    for(let vote of gameData.warpVotes) {
      if(vote.madeBy == userName) alreadyVoted = true
    }
    if(!alreadyVoted) {
      gameData.warpVotes.push(warpVote)
      if(gameData.currentTurn == gameData.users[gameData.users.length-1]) gameData.currentTurn = gameData.users[0]
      else {
        gameData.currentTurn = gameData.users[gameData.users.indexOf(gameData.currentTurn)+1]
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
      //resolve(gameData.currentTurn)
    }).promise()
    resolve(gameData.currentTurn)
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

//Checks if the given user is in the given config file
module.exports.inGame = function(config, username) {
  let users = config.users
  if(users.includes(username)) return true
  else return false
}

//Checks if it is the given users turn
module.exports.isCurrentUsersTurn = function(config, username) {
  let currentTurn = config.currentTurn
  if(currentTurn == username) return true
  else return false
}

module.exports.pullGame = async function(gameName, username) {
  return new Promise(async (resolve, reject) => {
    let gameData = false
    let config = await this.getConfig(gameName)
    let inGame = this.inGame(config, username)
    let currentTurn = this.isCurrentUsersTurn(config, username)
    if(!inGame) {
      reject("User not in game")
      return
    }

    let filePath = path.resolve(gamePath, "")
    //Write multiplayer.config to disk
    fs.writeFileSync(`${filePath}/multiplayer.config`, JSON.stringify(config))

    if(!currentTurn) {
      reject("Not your turn")
      return
    }

    //Get AuroraDB.db file
    params = {
      Key: `${gameName}/AuroraDB.db`
    }
    let file = fs.createWriteStream(`${filePath}/AuroraDB.db`)
    s3.getObject(params).createReadStream().pipe(file)
    file.on("close", () => {resolve(gameData)})
  })
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