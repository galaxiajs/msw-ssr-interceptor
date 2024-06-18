<script lang="ts">
const { data } = $props();
let movies = $state<{ title: string; id: string }[]>([]);
let loading = $state(false);

function handleFetchMovies() {
	loading = true;
	fetch("https://api.example.com/movies")
		.then((response) => response.json())
		.then((data) => {
			movies = data.data.movies;
			loading = false;
		});
}
</script>

<header>
	<h1>Hello, {data.user.firstName}!</h1>
</header>

<main>
	{#if movies}
		<ul id="movies">
			{#each movies as movie}
				<li>{movie.title}</li>
			{/each}
		</ul>
	{/if}
	<button disabled={loading} onclick={handleFetchMovies}>Fetch movies</button>
</main>
