<script>
  import Spinner from '../node_modules/svelte-spinner'
  export let spinnerText
	export let loading
</script>

{#if loading}
  <div class="spinner-container">
    <Spinner size="100" speed="750" color="#ff6c52" thickness="3" gap="40"></Spinner>
    <p class="spinner-text">{spinnerText}</p>
  </div>
{/if}

<style>
  .spinner-container {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.8);
		width: 100%;
		min-height: 100%;
		z-index: 100;
	}
	.spinner-text {
		color: white;
		font-size: 5vh;
		margin: 5px;
		z-index: 101;
	}
</style>