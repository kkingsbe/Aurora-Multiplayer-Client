<script>
	import Home from './Home.svelte'
	import NewGame from './NewGame.svelte'
	import ContinueGame from './ContinueGame.svelte'
	import PlayTurn from './PlayTurn.svelte'

	let screen = "home"
	let numNewGameUsers = 1
	let newGameUsers = []

	let gameName = ""
	let gameData
	
	//The current username of the player using the MP client
	let currentUsername = ""

	//The current turn inside of the game
	let currentTurn = ""
	let shortestWarp = ""
	let isUsersTurn = false
</script>

{#if screen == "home"}
	<Home bind:screen={screen}></Home>
{/if}

{#if screen == "new game"}
	<NewGame gameName={gameName} numNewGameUsers={numNewGameUsers} newGameUsers={newGameUsers} bind:screen={screen}></NewGame>
{/if}

{#if screen == "continue game"}
	<ContinueGame bind:gameData={gameData} bind:gameName={gameName} bind:currentUsername={currentUsername} bind:screen={screen} bind:currentTurn={currentTurn} bind:shortestWarp={shortestWarp} bind:isUsersTurn={isUsersTurn}></ContinueGame>
{/if}

{#if screen == "play turn"}
	<PlayTurn bind:screen={screen} gameName={gameName} bind:currentTurn={currentTurn} bind:currentUsername={currentUsername} bind:shortestWarp={shortestWarp} bind:isUsersTurn={isUsersTurn}></PlayTurn>
{/if}