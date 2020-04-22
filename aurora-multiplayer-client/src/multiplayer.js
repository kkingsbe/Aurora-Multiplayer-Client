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
  return new Promise((resolve, reject) => {
    let gameData = {
      users: users,
      currentTurn: users[0],
      warpVotes: []
    }
    let configContent =  JSON.stringify(gameData)
    fs.writeFileSync(path.resolve(__dirname, "../../multiplayer.config"), configContent)
    let dbContent = fs.readFileSync(path.resolve(__dirname, "../../AuroraDB.db"))
    let params = {
      Bucket: BUCKET_NAME,
      Key: `${gameName}/AuroraDB.db`,
      Body: dbContent
    }
    s3.upload(params, (err, data) => {
      if(err) reject(err)
      console.log(`Successfully created game! ${data.Location}`)
      resolve(true)
    })

    params = {
      Bucket: BUCKET_NAME,
      Key: `${gameName}/multiplayer.config`,
      Body: configContent
    }
    s3.upload(params, (err, data) => {
      if(err) reject(err)
      console.log(`Successfully created game! ${data.Location}`)
      resolve(true)
    })
  })
}

//Checks if the given user is in the given game
module.exports.inGame = async function(gameName, username) {
  return new Promise((resolve, reject) => {
    let filePath = path.resolve(__dirname, "../../")
    const params = {
      Bucket: BUCKET_NAME,
      Key: `${gameName}/multiplayer.config`
    }
    //console.log(params)
    s3.getObject(params, (err, data) => {
      if (err) reject(err)
      let users = JSON.parse(data.Body.toString()).users
      console.log(users)
      if(users.includes(username)) resolve(true)
      else reject("user not in game")
    })
  })
}

module.exports.pullGame = async function(gameName, username) {
  return new Promise(async (resolve, reject) => {
    let success = true
    await this.inGame(gameName, username).catch(err => {
      success = false
      reject(err)
      return
    })

    if(success) {
      let filePath = path.resolve(__dirname, "../../")
      let params = {
        Bucket: BUCKET_NAME,
        Key: `${gameName}/multiplayer.config`
      }
      await s3.getObject(params, (err, data) => {
        if (err) reject(err)
        console.log(data)
        fs.writeFileSync(`${filePath}/multiplayer.config`, data.Body.toString())
      })
      params = {
        Bucket: BUCKET_NAME,
        Key: `${gameName}/AuroraDB.db`
      }
      console.log(params)
      await s3.getObject(params, (err, data) => {
        if (err) reject(err)
        console.log(data)
        console.log(err)
        fs.writeFileSync(`${filePath}/AuroraDB.db`, data.Body.toString())
      })
      resolve(true)
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