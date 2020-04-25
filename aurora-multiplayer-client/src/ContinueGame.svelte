<script>
  export let gameName
  export let currentUsername
  export let screen
  export let gameData
  export let currentTurn
  export let shortestWarp
  export let isUsersTurn

	var path = require('path')
	var multiplayer = require(path.resolve(__dirname, "../src/multiplayer"))
	const { dialog } = require('electron').remote

  import {Button, Form, FormGroup, Label, Input} from "sveltestrap"
	import Header from "./header.svelte"
  import Loader from './Loader.svelte'

	currentTurn = ""
	shortestWarp = ""
	isUsersTurn = false
	let warpType
	let warpTypeNum
	let warpLength
	let spinnerText = ""
  let loading = false
  
  //Downloads the db and json file from S3 and makes sure that the user is in the game
	async function pullGame() {
		let inGame = true
		isUsersTurn = true
		loading = true
		spinnerText = "Downloading db..."
    gameData = await multiplayer.getConfig(gameName)
		await multiplayer.pullGame(gameName, currentUsername)
		.catch(err => {
			//We don't need to error out here if the user is in the game, but it is not their turn
			if(err != "Not your turn") {
				dialog.showMessageBox(null, {
					type: "error",
					buttons: ["OK"],
					title: "Error",
					message: err
				})
				inGame = false
			} else {
				isUsersTurn = false
			}
		})
		loading = false
		if(gameData && inGame) {
      screen = "play turn"
      console.log(screen)
			gameName = gameData.gameName
			currentTurn = gameData.currentTurn

			let shortestType = 10

			//Gotta make sure that each vote is smaller than the starting value
			let shortestWarpSecs = Number.MAX_VALUE
			let warpType = ""
			let length = 0

			console.log(gameData.warpVotes)
			for(let vote of gameData.warpVotes) {
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
					console.log(warpSeconds)
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
					brea
				case 6:
					warpType = "Months"
					break
				case 7:
					warpType = "Years"
					break
			}
      shortestWarp = length + " " + warpType

			//Check if it is the game creators turn
			if(isUsersTurn && gameData.currentTurn == gameData.users[0]) {
        console.log(isUsersTurn)
				dialog.showMessageBox(null, {
					type: "info",
					buttons: ["OK"],
					title: "New round",
					message: `New round, please warp forwards ${length} ${warpType} before making your turn`
				})
			}
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
      <Button color="success" type="button" on:click={pullGame}>Continue</Button>
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
		background: #203A43;
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