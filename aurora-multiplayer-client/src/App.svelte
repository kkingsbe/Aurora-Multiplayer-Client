<script>
	//Import the needed components
	import Home from './Home.svelte'
	import NewGame from './NewGame.svelte'
	import ContinueGame from './ContinueGame.svelte'
	import PlayTurn from './PlayTurn.svelte'

	//Declare the "global" variables used by this app
	let screen = "home"       //This sets the current screen of the app. Value can be "home", "new game", "continue game", or "play turn"
	let numNewGameUsers = 1   //The number of users to be added to a new game (controls how many inputs are visible)
	let newGameUsers = []     //An array to store the usernames when creating a new game
	let gameName = ""         //Stores the game name
	let gameData              //Stores the parsed JSON data from the multiplayer.config file
	let currentUsername = ""  //The current username of the player using the MP client
	let currentTurn = ""      //The current turn inside of the game
	let shortestWarp = ""     //The text version of the shortest warp
	let isUsersTurn = false   //Stores if it is the currently signed in users turn. This is used to disable some elements
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
