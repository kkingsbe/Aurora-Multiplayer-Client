<script>
  import Header from "./header.svelte"
  import {Button} from "sveltestrap"

  export let screen

  //Changes the page to the "New Game" page
	function newGamePage() {
		screen = "new game"
	}
	//Changes the page to the "Continue Game" page
	function continueGamePage() {
		screen = "continue game"
	}
</script>

<main>
  <Header text="Aurora Multiplayer"/>
  <div class="button-group">
    <Button type="button" color="info" on:click={newGamePage}>New Game</Button>
    <Button type="button" color="warning" on:click={continueGamePage}>Continue Existing Game</Button>
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

.button-group {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

@media (min-width: 640px) {
  main {
    max-width: none;
  }
}
</style>