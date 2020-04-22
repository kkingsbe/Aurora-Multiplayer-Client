const AWS = require('aws-sdk')
const fs = require('fs')
var path = require('path')

const s3KeyID = "AKIA25DC2266KCCM5PFX"
const s3KeySecret = "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"
const BUCKET_NAME = 'aurora-multiplayer-saves'
const s3 = new AWS.S3({
  accessKeyId: s3KeyID,
  secretAccessKey: s3KeySecret
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
        4. weeks
        5. days
        6. months
        7. years
      */
      warpVotes: []
    }
    let configContent =  JSON.stringify(gameData)
    fs.writeFileSync(path.resolve(process.env.PORTABLE_EXECUTABLE_DIR, "multiplayer.config"), configContent)
    let dbContent = fs.readFileSync(path.resolve(process.env.PORTABLE_EXECUTABLE_DIR, "AuroraDB.db"))
    let params = {
      Bucket: BUCKET_NAME,
      Key: `${gameName}/AuroraDB.db`,
      Body: dbContent
    }
    await s3.upload(params, (err, data) => {
      if(err) reject(err)
      console.log(`Successfully created game! ${data}`)
      resolve(true)
    }).promise()

    params = {
      Bucket: BUCKET_NAME,
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

module.exports.submitTurn = async function(gameData, userName, warpVote) {
  return new Promise(async (resolve, reject) => {
    let alreadyVoted = false
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
    let configContent =  JSON.stringify(gameData)
    fs.writeFileSync(path.resolve(process.env.PORTABLE_EXECUTABLE_DIR, "multiplayer.config"), configContent)
    let dbContent = fs.readFileSync(path.resolve(process.env.PORTABLE_EXECUTABLE_DIR, "AuroraDB.db"))
    let params = {
      Bucket: BUCKET_NAME,
      Key: `${gameData.gameName}/AuroraDB.db`,
      Body: dbContent
    }
    await s3.upload(params, (err, data) => {
      if(err) reject(err)
      //console.log(`Successfully created game! ${data.Location}`)
    }).promise()

    params = {
      Bucket: BUCKET_NAME,
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

//Checks if the given user is in the given game
module.exports.inGame = async function(gameName, username) {
  return new Promise((resolve, reject) => {
    let filePath = path.resolve(process.env.PORTABLE_EXECUTABLE_DIR, "")
    const params = {
      Bucket: BUCKET_NAME,
      Key: `${gameName}/multiplayer.config`
    }
    //console.log(params)
    s3.getObject(params, (err, data) => {
      if (err) reject(err)
      let users = JSON.parse(data.Body.toString()).users
      //console.log(users)
      if(users.includes(username)) resolve(true)
      else reject("user not in game")
    })
  })
}

module.exports.pullGame = async function(gameName, username) {
  return new Promise(async (resolve, reject) => {
    let success = true
    let gameData = false
    await this.inGame(gameName, username).catch(err => {
      success = false
      reject(err)
      return
    })

    if(success) {
      let filePath = path.resolve(process.env.PORTABLE_EXECUTABLE_DIR, "")

      //Get multiplayer.config file
      let params = {
        Bucket: BUCKET_NAME,
        Key: `${gameName}/multiplayer.config`
      }
      await s3.getObject(params, (err, data) => {
        if (err) reject(err)
        gameData = JSON.parse(data.Body.toString())
        //console.log(gameData)
        fs.writeFileSync(`${filePath}/multiplayer.config`, data.Body)
      }).promise()

      //Get AuroraDB.db file
      params = {
        Bucket: BUCKET_NAME,
        Key: `${gameName}/AuroraDB.db`
      }
      //console.log(params)
      await s3.getObject(params, (err, data) => {
        if (err) reject(err)
        //console.log(data)
        //console.log(err)
        fs.writeFileSync(`${filePath}/AuroraDB.db`, data.Body)
      }).promise()
      resolve(gameData)
    }
  })
}

async function downloadTemplate() {
  loading = true
  spinnerText = "Downloading File..."
  let filePath = path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads/', selectedTemplate)
  const params = {
    Bucket: BUCKET_NAME,
    Key: `${selectedProject}/${selectedTemplate}`
  }
  console.log(params)
  s3.getObject(params, (err, data) => {
    if (err) throw(err)
    fs.writeFileSync(filePath, data.Body.toString())
    console.log(`${filePath} has been created!`)
    loading = false
    dialog.showMessageBox(null, {
      type: "info",
      buttons: ["OK"],
      title: "Success!",
      message: "Successfully downloaded template to your downloads folder"
    })
  }).promise().catch(err => {
    dialog.showErrorBox("AWS VCS Error", "Unable to find template file")
    loading = false
  })
}
async function getProjectFolders() {
  let params = {
    Bucket: BUCKET_NAME,
    Delimiter: '/'
  }
  return new Promise((resolve, reject) => {
    s3.listObjectsV2(params, (err, data) => {
      if(err) reject(err)
      resolve(data.CommonPrefixes)
    })
  })
}