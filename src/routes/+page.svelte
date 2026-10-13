<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import Farmer from '$lib/Farmer.svelte';
	import MiniPiano from '$lib/MiniPiano.svelte';
	import { animalSprite, type AnimalId } from '$lib/catalog';
	import { FarmGame, farmerHint, kindById } from '$lib/farm.svelte';

	const game = new FarmGame();
	let dockHover = $state<string | null>(null);

	/** Crop each sprite to the face for the dock. */
	const FACE: Record<AnimalId, string> = {
		pappagallo: '50% 10%',
		gallina: '78% 18%',
		mucca: '88% 32%',
		maiale: '14% 40%',
		blippo: '44% 6%',
		kicko: '40% 26%',
		snarix: '48% 26%',
		zizz: '48% 10%',
		piano: '50% 78%'
	};

	onMount(() => {
		let frame = 0;
		let last = performance.now();
		const loop = (t: number) => {
			const dt = Math.min(0.05, (t - last) / 1000);
			last = t;
			game.tick(dt, t);
			frame = requestAnimationFrame(loop);
		};
		frame = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(frame);
	});

	function onKey(event: KeyboardEvent) {
		if (event.repeat) return;
		if (event.key.length !== 1) return;
		game.pressKey(event.key);
	}

	function onKeyUp(event: KeyboardEvent) {
		if (event.key.length !== 1) return;
		game.releaseKey(event.key);
	}

	async function onParrotFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) await game.loadParrot(file);
	}

	function onOctave(event: Event) {
		game.parrotOctave = Number((event.currentTarget as HTMLInputElement).value);
		game.twistParrot();
	}

	function onSpeed(event: Event) {
		game.parrotSpeed = Number((event.currentTarget as HTMLInputElement).value);
		game.twistParrot();
	}

	function bumpPiano(delta: number) {
		game.pianoOctave = Math.max(-2, Math.min(2, game.pianoOctave + delta));
		game.twistPiano();
	}

	function callAnimal(id: AnimalId) {
		if (id === 'piano') {
			game.openPiano();
			return;
		}
		if (!game.canCall) return;
		game.place(id);
	}

	function clearMenu() {
		game.deselect();
	}

	function menuId() {
		return game.pianoSelected ? 'piano' : game.selectedId;
	}

	const selectedKind = $derived(
		game.pianoSelected ? kindById('piano') : game.selected ? kindById(game.selected.kind) : null
	);
	const recordingThis = $derived(
		game.phase === 'registra' &&
			((game.pianoSelected && game.recordingPiano) ||
				(game.selectedId !== null && game.recordingId === game.selectedId))
	);
	const showMenubar = $derived(
		game.phase === 'orchestra' || game.pianoSelected || !!(game.selected && selectedKind)
	);
	const menuHits = $derived(game.pianoSelected ? game.pianoHits : (game.selected?.hits ?? []));
	const menuHolds = $derived(game.pianoSelected ? game.pianoHolds : []);
	const menuReady = $derived(game.pianoSelected ? game.pianoReady : !!game.selected?.ready);
	const headPct = $derived(recordingThis ? (game.elapsed / 60) * 100 : 0);
</script>

<svelte:window onkeydown={onKey} onkeyup={onKeyUp} />

<div
	class={[
		'world',
		{ orchestra: game.phase === 'orchestra', recording: game.phase === 'registra' }
	]}
	style:--hue={game.hue}
	style:--flash={game.flash}
>
	<div class="stage">
		<div class="yard">
			<button type="button" class="ground" aria-label="Chiudi il menu" onclick={clearMenu}></button>
			<img class="farm-art" src="/farm-stage.png?v=11" alt="" />

			{#each game.meteors as m (m.id)}
				<div class="meteor" style:left="{m.x}%" style:top="{m.y}%"></div>
			{/each}

			<button
				type="button"
				class={['farmer', game.farmer.pose]}
				style:left="{game.farmer.x}%"
				style:top="{game.farmer.y}%"
				style:z-index={Math.round(game.farmer.y)}
				style:pointer-events={game.phase === 'registra' ? 'none' : 'auto'}
				onclick={(event) => {
					event.stopPropagation();
					game.clickFarmer();
				}}
			>
				<span class="shadow"></span>
				<Farmer pose={game.farmer.pose} facing={game.farmer.facing} />
				{#if game.farmer.pose === 'idle'}
					<span class="hint">{farmerHint(game.phase, game.placed.length > 0 || game.pianoHits.length > 0 || game.pianoSelected, game.hasSequences, game.hasReady)}</span>
				{/if}
			</button>

			{#each game.placed as animal (animal.id)}
				{@const kind = kindById(animal.kind)}
				<button
					type="button"
					class={[
						'animal',
						{
							hit: animal.hitUntil > game.now,
							weird: game.phase === 'orchestra' && animal.pose === 'idle' && kind.group === 'strano',
							selected: game.selectedId === animal.id,
							armed: game.recordingId === animal.id,
							sprint: animal.pose === 'run',
							splat: animal.pose === 'fall',
							entering: animal.entering,
							walking: animal.walking && animal.pose !== 'fall'
						}
					]}
					style:left="{animal.x}%"
					style:top="{animal.y}%"
					style:z-index={Math.round(animal.y)}
					style:--sprite-w="{kind.w}%"
					style:--sprite-h="{kind.h}%"
					onclick={(event) => {
						event.stopPropagation();
						game.clickAnimal(animal.id);
					}}
				>
					<span class="shadow"></span>
					<div class="body" style:transform="scaleX({animal.facing})">
						<img class="sprite" src={animalSprite(kind.id, animal.pose)} alt="" />
					</div>
					{#if game.selectedId === animal.id || game.recordingId === animal.id}
						<div class="tag">
							<b>{kind.name}</b>
						</div>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	{#if showMenubar}
		<header class="menubar" transition:fly={{ y: -16, duration: 220 }}>
			{#if game.phase === 'orchestra'}
				<div class="menu-lead">
					<b class="menu-name">Orchestra</b>
				</div>
				<button type="button" class="ferma" onclick={() => game.stopOrchestra()}>FERMA</button>
			{:else if game.pianoSelected || (game.selected && selectedKind)}
				<div class="menu-lead">
					{#if selectedKind && selectedKind.id !== 'piano'}
						<img class="menu-sprite" src={animalSprite(selectedKind.id)} alt="" />
					{/if}
					<b class="menu-name">{selectedKind?.name}</b>
					{#if game.pianoSelected && game.pianoHits.length > 0}
						<span class="melodie">linee melodiche</span>
					{/if}
				</div>
				<div class="menu-actions">
					{#if recordingThis}
						<button type="button" onclick={() => game.stopAnimalRecord()}>FERMA REGISTRAZIONE</button>
						<p class="clock">{game.elapsed.toFixed(2)}s</p>
					{:else}
						<button type="button" onclick={() => game.startAnimalRecord(menuId()!)}>
							REGISTRA
						</button>
						{#if menuHits.length > 0}
							<button
								type="button"
								class="conferma"
								disabled={menuReady}
								onclick={() => game.scappa(menuId()!)}
							>
								CONFERMA
							</button>
							<button type="button" class="cancella" onclick={() => game.cancella(menuId()!)}>
								CANCELLA
							</button>
						{/if}
					{/if}
				</div>
				<div class={['timeline', { live: recordingThis }]}>
					<div class="head" style:left="{headPct}%"></div>
					{#each menuHits as t, i (`${menuId()}-${i}`)}
						{#if game.pianoSelected}
							<span
								class="hold"
								style:left="{(t / 60) * 100}%"
								style:width="{((menuHolds[i] ?? 0.2) / 60) * 100}%"
							></span>
						{:else}
							<span class="dot" style:left="{(t / 60) * 100}%"></span>
						{/if}
					{/each}
				</div>
				{#if selectedKind?.id === 'pappagallo'}
					<div class="menu-parrot">
						<label class="file">
							Carica un suono
							<input type="file" accept="audio/*" onchange={onParrotFile} />
						</label>
						<button type="button" disabled={game.micBusy} onclick={() => game.captureParrot()}>
							{game.micBusy ? 'Ascolto 3 secondi…' : 'Registra 3 secondi'}
						</button>
						<label>
							Ottava {game.parrotOctave}
							<input
								type="range"
								min="-2"
								max="2"
								step="1"
								value={game.parrotOctave}
								oninput={onOctave}
							/>
						</label>
						<label>
							Velocità {game.parrotSpeed.toFixed(1)}
							<input
								type="range"
								min="0.5"
								max="2"
								step="0.1"
								value={game.parrotSpeed}
								oninput={onSpeed}
							/>
						</label>
					</div>
				{:else if selectedKind?.id === 'piano'}
					<div class="menu-parrot menu-piano">
						<button
							type="button"
							class="oct"
							aria-label="Ottava giù"
							disabled={game.pianoOctave <= -2}
							onclick={() => bumpPiano(-1)}
						>
							−
						</button>
						<div class="piano-keys">
							<MiniPiano
								held={game.heldPiano}
								ondown={(note) => game.pressPiano(note)}
								onup={(note) => game.releasePiano(note)}
							/>
						</div>
						<button
							type="button"
							class="oct"
							aria-label="Ottava su"
							disabled={game.pianoOctave >= 2}
							onclick={() => bumpPiano(1)}
						>
							+
						</button>
					</div>
				{/if}
			{/if}
		</header>
	{/if}

	<nav class="dock-wrap">
		<p class="dock-caption">{dockHover ?? 'Chiama in fattoria'}</p>
		<div class="dock">
			{#each game.kinds as kind (kind.id)}
				<button
					type="button"
					class={['dock-icon', { on: kind.id === 'piano' ? game.pianoSelected : game.selected?.kind === kind.id }]}
					style:--face={FACE[kind.id]}
					disabled={kind.id === 'piano' ? !game.canOpenPiano : !game.canCall}
					aria-label={kind.name}
					onclick={() => callAnimal(kind.id)}
					onmouseenter={() => (dockHover = kind.name)}
					onmouseleave={() => (dockHover = null)}
				>
					<img src={animalSprite(kind.id)} alt="" />
				</button>
			{/each}
		</div>
	</nav>
</div>

<style>
	.world {
		--hue: 0;
		--flash: 0;
		--paper: #f3ece0;
		--ink: #1c1916;
		--mute: #6b6458;
		--barn: #c4452d;
		--sun: #e7b40f;
		position: relative;
		height: 100dvh;
		overflow: hidden;
		background: var(--paper);
		color: var(--ink);
	}

	.world.orchestra {
		animation: wobble 1.8s ease-in-out infinite;
	}

	.menubar {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 6;
		display: grid;
		grid-template-columns: auto auto 1fr;
		grid-template-areas:
			'lead actions timeline'
			'parrot parrot parrot';
		gap: 8px 16px;
		align-items: center;
		padding: 8px 18px 10px;
		background: rgb(243 236 224 / 0.78);
		backdrop-filter: blur(16px) saturate(1.15);
		border-bottom: 1px solid rgb(28 25 22 / 0.18);
		font-size: 13px;
	}

	.menu-lead {
		grid-area: lead;
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}

	.menu-name {
		margin: 0;
		color: var(--ink);
		font-family: inherit;
		font-size: 15px;
		font-weight: 600;
	}

	.melodie {
		font-size: 12px;
		font-weight: 500;
		color: var(--mute);
		letter-spacing: 0;
		text-transform: none;
		white-space: nowrap;
	}

	.menu-sprite {
		width: 28px;
		height: 34px;
		flex: 0 0 28px;
		object-fit: contain;
		object-position: center bottom;
		image-rendering: auto;
	}

	.menu-actions {
		grid-area: actions;
		display: flex;
		flex-wrap: wrap;
		gap: 2px 4px;
		align-items: center;
	}

	.menu-actions button,
	.menubar > button.ferma {
		border: 0;
		background: transparent;
		padding: 6px 10px;
		letter-spacing: 0.02em;
	}

	.menu-actions button:hover:not(:disabled),
	.menubar > button.ferma:hover {
		background: rgb(28 25 22 / 0.08);
	}

	button.ferma {
		color: var(--barn);
		font-weight: 600;
	}

	button.conferma {
		color: var(--ink);
	}

	button.cancella {
		color: var(--barn);
	}

	.clock {
		margin: 0;
		padding: 0 8px;
		font-size: 11px;
		letter-spacing: 0.04em;
		text-transform: none;
		color: var(--mute);
	}

	label {
		display: grid;
		gap: 4px;
		font-size: 11px;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		color: var(--mute);
	}

	button,
	input[type='file'] {
		font-family: inherit;
		font-size: 12px;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		border: 1px solid var(--ink);
		background: var(--paper);
		color: var(--ink);
		padding: 6px 10px;
		border-radius: 0;
	}

	button {
		cursor: pointer;
		font-weight: 500;
	}

	button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.menu-parrot {
		grid-area: parrot;
		display: flex;
		flex-wrap: wrap;
		gap: 8px 12px;
		align-items: end;
		padding-top: 4px;
		border-top: 1px solid rgb(28 25 22 / 0.12);
	}

	.menu-parrot label {
		min-width: 120px;
		flex: 1 1 120px;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8px;
		white-space: nowrap;
	}

	.menu-parrot .file {
		flex-direction: column;
		align-items: stretch;
		white-space: normal;
		flex: 1 1 180px;
	}

	.menu-parrot input[type='range'] {
		width: 100%;
		max-width: 160px;
		accent-color: var(--ink);
	}

	.menu-piano {
		display: grid;
		grid-template-columns: 48px minmax(0, 1fr) 48px;
		align-items: center;
		width: 100%;
		gap: 12px;
	}

	.piano-keys {
		display: flex;
		justify-content: center;
		min-width: 0;
	}

	.oct {
		width: 44px;
		height: 44px;
		padding: 0;
		border-radius: 10px;
		font-size: 22px;
		font-weight: 600;
		letter-spacing: 0;
		text-transform: none;
		line-height: 1;
		background: #fff;
		border: 1px solid var(--ink);
	}

	.timeline {
		grid-area: timeline;
		position: relative;
		width: 100%;
		height: 14px;
		background: transparent;
		border: 0;
		border-bottom: 1px solid var(--ink);
	}

	.timeline.live {
		border-bottom-color: var(--barn);
	}

	.head {
		position: absolute;
		top: 0;
		bottom: -1px;
		width: 1px;
		background: var(--barn);
		translate: -50% 0;
		z-index: 2;
	}

	.dot {
		position: absolute;
		top: 50%;
		width: 7px;
		height: 7px;
		background: var(--ink);
		border: 0;
		border-radius: 50%;
		translate: -50% -50%;
		z-index: 1;
	}

	.hold {
		position: absolute;
		top: 50%;
		height: 6px;
		min-width: 4px;
		background: var(--ink);
		border-radius: 2px;
		translate: 0 -50%;
		z-index: 1;
	}

	.dock-wrap {
		position: absolute;
		left: 50%;
		bottom: 18px;
		z-index: 7;
		translate: -50% 0;
		display: grid;
		justify-items: center;
		gap: 8px;
		pointer-events: none;
	}

	.dock-caption {
		margin: 0;
		padding: 3px 10px;
		font-family: inherit;
		font-size: 13px;
		font-weight: 500;
		font-style: normal;
		color: var(--ink);
		background: rgb(243 236 224 / 0.82);
		border-radius: 999px;
	}

	.dock {
		pointer-events: auto;
		display: flex;
		align-items: flex-end;
		gap: 8px;
		padding: 10px 12px 12px;
		background: rgb(243 236 224 / 0.42);
		backdrop-filter: blur(22px) saturate(1.25);
		border: 1px solid rgb(255 255 255 / 0.45);
		border-radius: 22px;
		box-shadow:
			0 18px 40px rgb(28 25 22 / 0.22),
			inset 0 1px 0 rgb(255 255 255 / 0.55);
	}

	.dock-icon {
		width: 46px;
		height: 46px;
		padding: 0;
		border: 0;
		border-radius: 14px;
		background: rgb(255 255 255 / 0.55);
		box-shadow: 0 2px 6px rgb(28 25 22 / 0.12);
		overflow: hidden;
		transform-origin: center bottom;
		transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.dock-icon.on {
		outline: 2px solid var(--ink);
		outline-offset: 1px;
	}

	.dock-icon:hover:not(:disabled) {
		transform: scale(1.32) translateY(-10px);
	}

	.dock-icon img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: var(--face);
		pointer-events: none;
		transform: scale(1.15);
	}

	.stage {
		position: absolute;
		inset: 0;
		overflow: hidden;
		background: var(--paper);
		filter: hue-rotate(calc(var(--hue) * 0.35deg));
	}

	.yard {
		position: absolute;
		left: 50%;
		top: 50%;
		translate: -50% -50%;
		width: max(100vw, calc(100dvh * 16 / 9));
		height: max(100dvh, calc(100vw * 9 / 16));
		overflow: hidden;
	}

	.world.recording .stage {
		filter: hue-rotate(calc(var(--hue) * 0.35deg)) saturate(1.04);
	}

	.ground {
		position: absolute;
		inset: 0;
		z-index: 0;
		border: 0;
		background: transparent;
		padding: 0;
		cursor: default;
	}

	.farm-art {
		position: absolute;
		pointer-events: none;
		inset: 0;
		z-index: 0;
		width: 100%;
		height: 100%;
		object-fit: fill;
	}

	.farmer {
		position: absolute;
		width: 6.8%;
		height: 11.4%;
		border: 0;
		background: transparent;
		padding: 0;
		cursor: pointer;
		translate: -50% -100%;
	}

	.farmer .hint {
		position: absolute;
		left: 50%;
		bottom: -8px;
		width: max-content;
		max-width: 240px;
		translate: -50% 100%;
		background: var(--paper);
		color: var(--ink);
		border: 1px solid var(--ink);
		font-family: inherit;
		font-size: 12px;
		font-weight: 500;
		font-style: normal;
		letter-spacing: 0;
		text-transform: none;
		line-height: 1.35;
		padding: 5px 8px;
		z-index: 2;
	}

	.animal {
		position: absolute;
		translate: -50% -100%;
		text-align: center;
		border: 0;
		background: transparent;
		padding: 0;
		cursor: pointer;
		font-family: inherit;
		width: var(--sprite-w);
		height: var(--sprite-h);
	}

	.shadow {
		position: absolute;
		left: 50%;
		bottom: 2px;
		z-index: 0;
		width: 72%;
		height: 8px;
		translate: -50% 50%;
		background: radial-gradient(ellipse, rgb(28 25 22 / 0.28) 0%, rgb(28 25 22 / 0) 72%);
		pointer-events: none;
	}

	.farmer .shadow {
		width: 58%;
		height: 10px;
		bottom: 4px;
	}

	.body {
		position: relative;
		z-index: 1;
		width: 100%;
		height: 100%;
		transform-origin: center bottom;
	}

	.animal.walking .sprite {
		animation: step 0.42s ease-in-out infinite;
	}

	.animal.selected .sprite,
	.animal.armed .sprite {
		filter: drop-shadow(0 0 0 1px var(--ink));
	}

	.animal.armed .sprite {
		outline: 1px dashed var(--barn);
		outline-offset: 3px;
	}

	.animal.hit .sprite {
		transform: scale(1.06) rotate(-3deg);
	}

	.animal.sprint .sprite {
		animation: step 0.18s ease-in-out infinite;
	}

	.animal.splat .sprite {
		animation: splat 0.35s ease-out 1;
	}

	.animal.weird .sprite {
		animation: freak 0.55s ease-in-out infinite;
	}

	.sprite {
		width: 100%;
		height: 100%;
		object-fit: contain;
		object-position: center bottom;
		image-rendering: auto;
		pointer-events: none;
		display: block;
	}

	.tag {
		position: absolute;
		left: 50%;
		top: 0;
		translate: -50% calc(-100% - 6px);
		margin: 0;
		background: var(--paper);
		color: var(--ink);
		border: 1px solid var(--ink);
		font-size: 11px;
		letter-spacing: 0.04em;
		text-transform: none;
		z-index: 2;
		white-space: nowrap;
		padding: 4px 7px;
	}

	.tag b {
		font-family: inherit;
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0;
	}

	.meteor {
		position: absolute;
		z-index: 2;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--sun);
		animation: fall 1.1s ease-in forwards;
		pointer-events: none;
	}

	@keyframes fall {
		to {
			transform: translate(-24px, 70vh);
			opacity: 0.2;
		}
	}

	@keyframes wobble {
		50% {
			transform: scale(1.004, 0.997) rotate(0.12deg);
		}
	}

	@keyframes freak {
		50% {
			transform: rotate(-4deg) scale(1.04, 0.96);
		}
	}

	@keyframes step {
		50% {
			transform: translateY(-2px) scaleY(0.98);
		}
	}

	@keyframes splat {
		0% {
			transform: scale(1.18, 0.78) rotate(-8deg);
		}
		100% {
			transform: none;
		}
	}
</style>
