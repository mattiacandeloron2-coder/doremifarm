<script lang="ts">
	import { PIANO_KEYS } from './piano';

	let {
		held = [],
		ondown,
		onup
	}: {
		held?: number[];
		ondown: (note: number) => void;
		onup: (note: number) => void;
	} = $props();

	function down(event: PointerEvent, note: number) {
		event.preventDefault();
		(event.currentTarget as HTMLButtonElement).setPointerCapture(event.pointerId);
		ondown(note);
	}

	function up(event: PointerEvent, note: number) {
		if ((event.currentTarget as HTMLButtonElement).hasPointerCapture(event.pointerId)) {
			(event.currentTarget as HTMLButtonElement).releasePointerCapture(event.pointerId);
		}
		onup(note);
	}
</script>

<div class="mini" role="group" aria-label="Mini piano">
	{#each PIANO_KEYS as key, i (key)}
		<button
			type="button"
			class={['key', { on: held.includes(i) }]}
			aria-label="Tasto {key}"
			onpointerdown={(event) => down(event, i)}
			onpointerup={(event) => up(event, i)}
			onpointercancel={(event) => up(event, i)}
		>
			{key}
		</button>
	{/each}
</div>

<style>
	.mini {
		display: flex;
		align-items: stretch;
		height: 56px;
		gap: 2px;
		padding: 4px;
		background: #1c1916;
		border-radius: 6px;
		width: min(420px, 100%);
		touch-action: none;
	}

	.key {
		flex: 1 1 0;
		margin: 0;
		border: 0;
		border-radius: 0 0 4px 4px;
		background: #f3ece0;
		color: #1c1916;
		font-family: inherit;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0;
		cursor: pointer;
		padding: 0 0 8px;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		touch-action: none;
	}

	.key:hover,
	.key.on {
		background: #fff;
	}

	.key.on {
		translate: 0 2px;
	}
</style>
