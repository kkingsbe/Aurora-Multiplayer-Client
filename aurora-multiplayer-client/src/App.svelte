<script>
	export let name;
	var path = require('path')
	var multiplayer = require(path.resolve(__dirname, "../src/multiplayer"))
	const { dialog } = require('electron').remote

	import {Button, Form, FormGroup, Label, Input} from "sveltestrap"
	import Header from "./header.svelte"
	import Loader from './Loader.svelte'

	let screen = "home"
	let numNewGameUsers = 1
	let newGameUsers = []

	let gameName = ""
	let gameData
	let loading = false
	let spinnerText = ""
	let currentUsername = ""
	let currentTurn = ""
	let shortestWarp = ""
	let isUsersTurn = false
	let warpType
	let warpTypeNum
	let warpLength
	//Changes the page to the "New Game" page
	function newGamePage() {
		screen = "new game"
	}
	//Changes the page to the "Continue Game" page
	function continueGamePage() {
		screen = "continue game"
	}

	//Increments the number of users while creating a new game
	function incrementUsers() {
		numNewGameUsers ++
	}

	//Decrements the number of users while creating a new game
	function decrementUsers() {
		numNewGameUsers --
	}

	//Just flips isUsersTurn() so it can be used as a flag for disabling buttons
	function isNotAbleToSubmitTurn() {
		console.log(isUsersTurn())
		return !isUsersTurn()
	}

	//Uploads the db and game json file to S3
	async function uploadGame() {
		loading = true
		spinnerText = "Creating Game..."
		console.log(`Users: ${newGameUsers}`)
		let success = await multiplayer.uploadGame(gameName, newGameUsers)
		console.log(success)
		if(success) {
			loading = false
			dialog.showMessageBox(null, {
        type: "info",
        buttons: ["OK"],
        title: "Success!",
        message: "Successfully uploaded db file"
			})
			screen = "home"
		}
	}

	//Downloads the db and json file from S3 and makes sure that the user is in the game
	async function pullGame() {
		loading = true
		spinnerText = "Downloading db..."
		gameData = await multiplayer.pullGame(gameName, currentUsername)
		.catch(err => {
			dialog.showMessageBox(null, {
				type: "error",
				buttons: ["OK"],
				title: "Error",
				message: err
			})
		})
		loading = false
		
		console.log(gameData)
		if(gameData) {
			screen = "play turn"

			

			gameName = gameData.gameName
			currentTurn = gameData.currentTurn

			let shortestType = 10
			let warpType = ""
			let length = 0
			for(let vote of gameData.warpVotes) {
				if(vote.type < shortestType) {
					shortestType = vote.type
					length = vote.length
				}
				if(vote.type == shortestType && vote.length < length) {
					length = vote.length
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
			console.log(shortestType)
			shortestWarp = length + " " + warpType
			isUsersTurn = (currentTurn === currentUsername)

			//Check if it is the game creators turn
			if(isUsersTurn && gameData.currentTurn == gameData.users[0]) {
				dialog.showMessageBox(null, {
					type: "info",
					buttons: ["OK"],
					title: "New round",
					message: `New round, please warp forwards ${length} ${warpType} before making your turn`
				})
			}

			console.log(isUsersTurn)
		}
	}

	async function submitTurn() {
		loading = true
		spinnerText = "Uploading db..."
		console.log(warpType)
		switch(warpType) {
			case "seconds":
				warpTypeNum = 1
				break
			case "minutes":
				warpTypeNum = 2
				break
			case "hours":
				warpTypeNum = 3
				break
			case "days":
				warpTypeNum = 4
				break
			case "weeks":
				warpTypeNum = 5
				brea
			case "months":
				warpTypeNum = 6
				break
			case "years":
				warpTypeNum = 7
				break
		}
		let nextPlayer = await multiplayer.submitTurn(gameData, currentUsername, {type: warpTypeNum, length: warpLength, madeBy: currentUsername})
		loading = false
		dialog.showMessageBox(null, {
			type: "info",
			buttons: ["OK"],
			title: "Turn Complete",
			message: `Turn complete! It is now ${nextPlayer}'s turn.`
		})
		screen = "home"
	}
	
</script>

{#if screen == "home"}
	<main>
		<Header text="Aurora Multiplayer"/>
		<div class="button-group">
			<Button type="button" color="primary" on:click={newGamePage}>New Game</Button>
			<Button type="button" color="secondary" on:click={continueGamePage}>Continue Existing Game</Button>
		</div>
	</main>
{/if}

{#if screen == "new game"}
	<main>
		<Loader spinnerText={spinnerText} loading={loading}></Loader>
		<Header text="New Game"/>
		<Form>
			<FormGroup>
				<Label>Game Name</Label>
				<Input id="gameNameInput" bind:value = {gameName}/>
			</FormGroup>
			
			<FormGroup>
				<Label>Users to be added to game</Label>
				{#each Array(numNewGameUsers) as _, i}
					<Input placeholder="username" bind:value={newGameUsers[i]}/>
				{/each}
			</FormGroup>
			<div class="button-group">
				<Button color="primary" type="button" id="addUserBtn" on:click={incrementUsers}>Add User</Button>
				<Button color="danger" type="button" id="addUserBtn" on:click={decrementUsers}>Remove User</Button>
			</div>
			<div class="button-group-horizontal-center">
				<Button color="success" type="button" on:click={uploadGame}>Create Game</Button>
			</div>
		</Form>
	</main>
{/if}

{#if screen == "continue game"}
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
{/if}

{#if screen == "play turn"}
	<main>
		<Loader spinnerText={spinnerText} loading={loading}></Loader>
		<Header text="Play Turn"/>
		<div class="horiz-table">
			<div class="horiz-table-header">
				<div class="table-header-cell">Game Name</div>
				<div class="table-header-cell">Current Turn</div>
				<div class="table-header-cell">Next Warp Length</div>
			</div>
			<div class="horiz-table-col">
				<div class="table-cell">{gameName}</div>
				<div class="table-cell">{currentTurn}</div>
				<div class="table-cell">{shortestWarp}</div>
			</div>
		</div>
		<Label style="margin-bottom:2px;margin-top:20px;">How long would you like to warp?</Label>
		<div class="button-group-horizontal-center" style="width:300px;margin-top:0;">
			<Input type="text" bind:value={warpLength}/>
			<Input type="select" bind:value={warpType}>
				<option default>type</option>
				<option value="seconds">Seconds</option>
				<option value="minutes">Minutes</option>
				<option value="hours">Hours</option>
				<option value="days">Days</option>
				<option value="weeks">Weeks</option>
				<option value="months">Months</option>
				<option value="years">Years</option>
			</Input>
		</div>
		<div class="button-group-horizontal-center">
			<Button type="button" color="success" disabled={!isUsersTurn} on:click={submitTurn}>Submit Turn</Button>
		</div>
	</main>
{/if}

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

	.button-group {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
	}

	.button-group-horizontal-center {
		margin-top: 10px;
		display: flex;
		flex-direction: row;
		justify-content: center;
		width: 100%;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	.horiz-table {
		display: flex;
		flex-direction: row;
	}

	.horiz-table-header {
		display: flex;
		flex-direction: column;
	}

	.table-header-cell {
		border: 1px solid black;
		background: #00177e;
		font-size: 1.5em;
		text-align: right;
		padding: 7px;
	}

	.horiz-table-col {
		display: flex;
		flex-direction: column;
	}

	.table-cell {
		border: 1px solid black;
		background: whitesmoke;
		color: rgb(68, 68, 68);
		font-size: 1.5em;
		text-align: right;
		padding: 7px;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>