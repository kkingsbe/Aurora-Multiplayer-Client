<script>
	//Variables that this component accepts
  export let gameName         //Stores the games name
  export let currentUsername  //Stores the username of the currently logged in user
  export let screen           //Stores the current screem
  export let gameData         //Stores the parsed multiplayer.config file
  export let shortestWarp     //Stores the string version of the shortest voted-for warp
	export let hasPlayed        //If the currently logged in user has uploaded once this turn already
	//Import the needed node modules
	var path = require('path')
	var multiplayer = require(path.resolve(__dirname, "../src/multiplayer"))
	const { dialog } = require('electron').remote
	//Import the needed components
  import {Button, Form, FormGroup, Label, Input} from "sveltestrap"
	import Header from "./header.svelte"
  import Loader from './Loader.svelte'
	shortestWarp = ""
	let warpType
	let warpTypeNum      //An integer representing a warp length. See multiplayer.js for more info
	let warpLength
	let spinnerText = "" //Stores the text to display under the spinner while loading
	let loading = false  //Toggles the loading overlay

	//Downloads a game, reguardless of DB lock. They will not be able to reupload. They will later have to run pullGame() to start their turn, this db will be overwritten.
  async function downloadDB() {
		console.log("Downloading DB")
		loading = true
		spinnerText = "Downloading DB..."
		await multiplayer.pullGame(gameName)
		loading = false
		dialog.showMessageBox(null, {
			type: "info",
			buttons: ["OK"],
			title: "Download complete",
			message: `Download of ${gameName} complete.`
		})
	}

  //Downloads the db and json file from S3 and makes sure that the user is in the game
	async function pullGame() {
    //TODO: implement lock of db by uploading lock file with current user name to server before downloading config
    //check if lock file present and contains name other than self before downloading config, clear after upload.
    //There probably needs to be a way to manually delete it in case of error
		loading = true
    spinnerText = "Checking lock file..."
    let lock = await multiplayer.checkLock(gameName)
    .catch(err => {
      console.log("Error retrieving lock file: " + err)
      //if error not 404, actually error
    }


		spinnerText = "Fetching config..."
		gameData = await multiplayer.getConfig(gameName)
		.catch(err => {
			console.log(err)
			dialog.showMessageBox(null, {
				type: "error",
				buttons: ["OK"],
				title: "Error",
				message: "Game does not exist"
			})
			loading = false
			return
		})
    let inGame = await multiplayer.isUserInGame(gameData, currentUsername)
    if(!inGame) { //TODO: immediately clear lock if user not in game
      loading = false
      dialog.showMessageBox(null, {
        type: "error",
        buttons: ["OK"],
        title: "Error",
        message: "You are not a player in this game"
      })
      return
    }
    hasPlayed = await multiplayer.hasUserPlayed(gameData, currentUsername)
		spinnerText = "Downloading DB..."
		await multiplayer.pullGame(gameName)
		.catch(err => {
			dialog.showMessageBox(null, {
				type: "error",
				buttons: ["OK"],
				title: "Error",
				message: err
			})
		})
		loading = false
    if(!gameData || !inGame) return
    screen = "play turn"
		//gameName = gameData.gameName
    let voteList = [] //make list of votes for comparison which is shortest
    for(let user of gameData.users) { //only count votes cast this turn
      if(user.hasPlayed) {
        voteList.push(user.warpVote)
      }
    }
		let shortestType = 10
		//Gotta make sure that each vote is smaller than the starting value
		let shortestWarpSecs = Number.MAX_VALUE
		let warpType = ""
		let length = 0
		for(let vote of voteList) {
			let warpSeconds = 0
			//Convert the vote into seconds so it can be compared
			switch(vote.type) {
				case 1:
					warpSeconds = vote.length
					break
				case 2:
					warpSeconds = vote.length * 60
					break
				case 3:
					warpSeconds = vote.length * 3600
					break
				case 4:
					warpSeconds = vote.length * 86400
					break
				case 5:
					warpSeconds = vote.length * 604800
					break
				case 6:
					warpSeconds = vote.length * 2592000
					break
				case 7:
					warpSeconds = vote.length * 31556926
					break
			}
			if(warpSeconds < shortestWarpSecs) {
				shortestWarpSecs = warpSeconds
				length = vote.length
				shortestType = vote.type
			}
		}
		warpTypeNum = shortestType
		switch(shortestType) {
			case 1:
				warpType = "Seconds"
				break
			case 2:
				warpType = "Minutes"
				break
			case 3:
				warpType = "Hours"
				break
			case 4:
				warpType = "Days"
				break
			case 5:
				warpType = "Weeks"
				break
			case 6:
				warpType = "Months"
				break
			case 7:
				warpType = "Years"
				break
		}
    shortestWarp = length + " " + warpType
		//Check if this user can advance time
    let turnStatus = await multiplayer.turnStatus(gameData)
    console.log("turnStatus: " + turnStatus)
    console.log("hasPlayed: " + hasPlayed)
		if(turnStatus === "ready for processing") { //user can advance time, play turn, upload. hasPlayed flags are cleared on upload in this state
			dialog.showMessageBox(null, {
				type: "info",
				buttons: ["OK"],
				title: "New round",
				message: `All players have uploaded, please warp forwards ${length} ${warpType} before making your turn`
			})
      //if the player has already played they can update their turn, but time will not advance and hasPlayed flags not clear
		} else if(!hasPlayed && turnStatus === "last player") { //user can play turn, advance time, play another turn and then upload. hasPlayed flags are cleared on upload in this state
      dialog.showMessageBox(null, {
        type: "info",
        buttons: ["OK"],
        title: "New round",
        message: `You are the last person to play this turn, please warp forwards ${length} ${warpType} or a shorter interval of your choosing after making your turn. You can then play another turn and upload without advancing time again.`
      })
    }
	}
</script>

<main>
  <Loader spinnerText={spinnerText} loading={loading}></Loader>
  <Header text="Continue Game"/>
  <Form>
    <FormGroup>
      <Label>Game Name</Label>
      <Input bind:value={gameName}/>
    </FormGroup>
    <FormGroup>
      <Label>Username</Label>
      <Input bind:value={currentUsername}/>
    </FormGroup>
    <div class="button-group-horizontal-center">
      <Button color="success" type="button" on:click={pullGame}>Play Turn</Button>
      <Button color="warning" type="button" on:click={downloadDB}>Download DB</Button>
    </div>
  </Form>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
		min-height: 100%;
		color: white;
		background: linear-gradient(45deg, #30cfd0, #330867);
	}
	.button-group-horizontal-center {
		margin-top: 10px;
		display: flex;
		flex-direction: row;
		justify-content: center;
		width: 100%;
	}
	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
