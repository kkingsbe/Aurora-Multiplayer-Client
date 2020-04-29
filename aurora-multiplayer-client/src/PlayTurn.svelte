<script>
	//Variables that this component accepts
  export let screen           //Stores the current screem
  export let gameName         //Stores the games name
  export let gameData         //Stores the parsed multiplayer.config file
  export let currentUsername  //Stores the username of the currently logged in user
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

	let spinnerText = "" //Stores the text to display under the spinner while loading
	let loading = false  //Toggles the loading overlay
	let warpTypeNum      //An integer representing a warp length. See multiplayer.js for more info
	let warpType
	let warpLength

	//Records the users vote to multiplayer.config, and uploads that and AuroraDB.db to the S3 bucket
  async function submitTurn() {
    //abort if warp vote not filled out correctly
    if(warpType === "default" || warpType.length === 0 || warpLength.length === 0) { //these variables are hella weird
      dialog.showMessageBox(null, {
        type: "warning",
        buttons: ["OK"],
        title: "Warp vote malformed",
        message: "Please input how long you would like to advance time."
      })
      return
    }
		loading = true
		spinnerText = "Uploading DB..."
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
		let newTurn = await multiplayer.submitTurn(gameData, currentUsername, {type: warpTypeNum, length: warpLength})

    spinnerText = "Deleting lock file..."
    await multiplayer.deleteLock(gameName)
    .catch(err => {
  		dialog.showMessageBox(null, {
  			type: "error",
  			buttons: ["OK"],
  			title: "Can't delete lock file",
  			message: "Error deleting lock file: " + err + "\nCopy your AuroraDB.db file, download the turn again, overwrite the downloaded DB file with yours and try to upload again."
  		})
      loading = false
      return
    })

    let messageText = "Upload finished!"
    if(newTurn) messageText += "\nYou have played the first turn of the new increment. If you didn't advance time, redownload and do so right now to update your turn."
		loading = false
		dialog.showMessageBox(null, {
			type: "info",
			buttons: ["OK"],
			title: "Turn Complete",
			message: messageText
		})
		screen = "home"
	}
</script>

<main>
  <Loader spinnerText={spinnerText} loading={loading}></Loader>
  <Header text="Play Turn"/>
  <div class="horiz-table">
    <div class="horiz-table-header">
      <div class="table-header-cell">Game Name</div>
      <div class="table-header-cell">Next Warp Length</div>
    </div>
    <div class="horiz-table-col">
      <div class="table-cell">{gameName}</div>
      <div class="table-cell">{shortestWarp}</div>
    </div>
  </div>
  <h2 style="margin-top: 20px;">Players in this game</h2>
	<table>
		<thead>
			<tr>
				<th>User</th>
				<th>Has taken turn</th>
			</tr>
		</thead>
		<tbody>
			{#each gameData.users as user}
			<tr>
				<td>{user.name}</td>
				<td>{user.hasPlayed ? '✓' : '✗'}</td>
			</tr>
			{/each}
		</tbody>
	</table>
  <Label style="margin-bottom:2px;margin-top:20px;">How long would you like to warp?</Label>
  <div class="button-group-horizontal-center" style="width:300px;margin-top:0;">
    <Input type="text" bind:value={warpLength}/>
    <Input type="select" bind:value={warpType}>
     <option value="default" default>Choose...</option>
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
    <Button type="button" color="success" on:click={submitTurn}>{hasPlayed ? "Update Turn" : "Submit Turn"}</Button>
    <!--><Button type="button" color="success" disabled={hasPlayed} on:click={submitTurn}>Submit Turn</Button><-->
  </div>
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
		background: linear-gradient(45deg, #30cfd0, #081667);
	}

	.button-group-horizontal-center {
		margin-top: 10px;
		display: flex;
		flex-direction: row;
		justify-content: center;
		width: 100%;
	}

	.horiz-table {
		display: flex;
		flex-direction: row;
		border-radius: 10px;
		box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.6);
		margin-top: 70px;
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

	table {
		border-radius: 10px;
		box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.6);
		cursor: pointer;
		background: none;
	}

	h1 {
		font-weight: 100;
		font-size: 5em;
		margin: 10px;
		color: white;
	}

	th {
		min-width: 200px;
		background: rgb(45, 43, 70);
		color: white;
		padding: 15px;
		margin: 0;
		font-size: 1.5em;
	}
	th:first-child {
		border-top-left-radius: 10px;
	}
	th:last-child {
		border-top-right-radius: 10px;
	}

	td {
		text-align: center;
		padding: 10px;
		color: rgb(36, 36, 36);
	}

	tr {
		background: rgb(235, 235, 235);
	}
	tr:nth-child(odd) {
		background: whitesmoke;
	}

	tr:last-child td:first-child{
		border-bottom-left-radius: 10px;
	}

	tr:last-child td:last-child{
		border-bottom-right-radius: 10px;
	}
	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
