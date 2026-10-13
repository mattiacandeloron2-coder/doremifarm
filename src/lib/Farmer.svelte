<script lang="ts">
	import { asset } from '$app/paths';
	import { FARMER_GO, type FarmerPose } from '$lib/farm.svelte';

	let { pose, facing }: { pose: FarmerPose; facing: number } = $props();

	const src = $derived(
		pose === 'yell'
			? asset('/farmer-yell.png')
			: pose === 'run'
				? asset('/farmer-run.png')
				: pose === 'point'
					? asset('/farmer-point.png')
					: asset('/farmer-idle.png')
	);
</script>

<div class={['char', pose]} style:transform="scaleX({facing})">
	<img class="frame" src={src} alt="Farmer" />
	{#if pose === 'run'}
		<span class="bubble" style:transform="scaleX({facing})">{FARMER_GO}</span>
	{/if}
</div>

<style>
	.char {
		position: relative;
		width: 100%;
		height: 100%;
		transform-origin: center bottom;
	}

	.frame {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		object-position: center bottom;
		pointer-events: none;
	}

	.yell {
		animation: hop 0.35s ease-in-out infinite;
	}

	.point {
		animation: jab 0.4s ease-in-out infinite;
	}

	.run {
		animation: dash 0.22s ease-in-out infinite;
	}

	.bubble {
		position: absolute;
		left: 50%;
		top: auto;
		bottom: -6px;
		translate: -50% 100%;
		background: #f3ece0;
		color: #1c1916;
		border: 1px solid #1c1916;
		padding: 6px 10px;
		font-family: inherit;
		font-size: 13px;
		font-weight: 500;
		line-height: 1.35;
		width: max-content;
		max-width: 200px;
		z-index: 2;
	}

	@keyframes hop {
		50% {
			translate: 0 -4px;
		}
	}

	@keyframes jab {
		50% {
			translate: 3px 0;
		}
	}

	@keyframes dash {
		50% {
			translate: 0 -2px;
		}
	}
</style>
