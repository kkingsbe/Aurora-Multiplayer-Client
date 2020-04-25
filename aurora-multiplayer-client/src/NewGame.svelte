<script>
  export let gameName
  export let numNewGameUsers
  export let newGameUsers
  export let screen

  var path = require('path')
  var multiplayer = require(path.resolve(__dirname, "../src/multiplayer"))
	const { dialog } = require('electron').remote

  import Header from "./header.svelte"
  import Loader from './Loader.svelte'
  import {Button, Form, FormGroup, Label, Input} from "sveltestrap"

  let spinnerText = ""
  let loading = false

  //Increments the number of users while creating a new game
	function incrementUsers() {
		numNewGameUsers ++
	}

	//Decrements the number of users while creating a new game
	function decrementUsers() {
		numNewGameUsers --
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
</script>

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

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>