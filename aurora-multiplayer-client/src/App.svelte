<script>
	export let name;
	var path = require('path')
	var multiplayer = require(path.resolve(__dirname, "../src/multiplayer"))
	const { dialog } = require('electron').remote

	import {Button, Form, FormGroup, Label, Input} from "sveltestrap"
	import Header from "./header.svelte"
	import Loader from './Loader.svelte'

	import Home from './Home.svelte'
	import NewGame from './NewGame.svelte'
	import ContinueGame from './ContinueGame.svelte'

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
	
	//Just flips isUsersTurn() so it can be used as a flag for disabling buttons
	function isNotAbleToSubmitTurn() {
		console.log(isUsersTurn())
		return !isUsersTurn()
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
				break
			case "months":
				warpTypeNum = 6
				break
			case "years":
				warpTypeNum = 7
				break
		}
		let nextPlayer = await multiplayer.submitTurn(gameName, currentUsername, {type: warpTypeNum, length: warpLength, madeBy: currentUsername})
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
	<Home newGamePage={newGamePage} continueGamePage={continueGamePage}></Home>
{/if}

{#if screen == "new game"}
	<NewGame gameName={gameName} spinnerText={spinnerText} loading={loading} numNewGameUsers={numNewGameUsers} newGameUsers={newGameUsers} bind:screen={screen}></NewGame>
{/if}

{#if screen == "continue game"}
	<ContinueGame loading={loading} spinnerText={spinnerText} bind:gameData={gameData} gameName={gameName} currentUsername={currentUsername} bind:screen={screen} bind:currentTurn={currentTurn} bind:shortestWarp={shortestWarp}></ContinueGame>
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
		border-radius: 10px;
		box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.6);
	}

	.horiz-table-header {
		display: flex;
		flex-direction: column;
	}

	.table-header-cell {
		background: #37a2c2;
		font-size: 1.5em;
		text-align: right;
		padding: 7px;
	}

	.table-header-cell:nth-child(odd) {
		background: #48acca !important;
	}

	.table-header-cell:first-child {
		border-top-left-radius: 10px;
	}

	.table-header-cell:last-child {
		border-bottom-left-radius: 10px;
	}

	.horiz-table-col {
		display: flex;
		flex-direction: column;
	}

	.table-cell {
		background: rgb(235, 235, 235);
		color: rgb(68, 68, 68);
		font-size: 1.5em;
		text-align: left;
		padding: 7px;
	}

	.table-cell:nth-child(odd) {
		background: whitesmoke;
	}

	.table-cell:first-child {
		border-top-right-radius: 10px;
	}

	.table-cell:last-child {
		border-bottom-right-radius: 10px;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>