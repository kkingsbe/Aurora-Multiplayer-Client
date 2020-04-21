<script>
	export let name;
	import {Button, Form, FormGroup, Label, Input} from "sveltestrap"
	import Header from "./header.svelte"
	const s3KeyID = "AKIA25DC2266KCCM5PFX"
	const s3KeySecret = "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"
	
	let screen = "continue game"
	let numNewGameUsers = 1

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
		<Header text="New Game"/>
		<Form>
			<FormGroup>
				<Label>Game Name</Label>
				<Input id="gameNameInput"/>
			</FormGroup>
			
			<FormGroup>
				<Label>Users to be added to game</Label>
				{#each Array(numNewGameUsers) as _, i}
					<Input id="gameNameInput" placeholder="username"/>
				{/each}
			</FormGroup>
			<div class="button-group">
				<Button color="primary" type="button" id="addUserBtn" on:click={incrementUsers}>Add User</Button>
				<Button color="danger" type="button" id="addUserBtn" on:click={decrementUsers}>Remove User</Button>
			</div>
			<div class="button-group-horizontal-center">
				<Button color="success" type="button">Create Game</Button>
			</div>
		</Form>
	</main>
{/if}

{#if screen == "continue game"}
	<main>
		<Header text="Continue Game"/>
		<Form>
			<FormGroup>
				<Label>Game Name</Label>
				<Input/>
			</FormGroup>
			<FormGroup>
				<Label>Username</Label>
				<Input/>
			</FormGroup>
			<div class="button-group-horizontal-center">
				<Button disabled color="success" type="button">Continue</Button>
			</div>
		</Form>
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

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>