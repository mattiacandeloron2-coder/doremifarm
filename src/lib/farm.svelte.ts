import { KEYS, KINDS, kindById, type AnimalId, type AnimalKind, type AnimalPose } from './catalog';
import {
	PASTURE,
	PEN,
	clamp,
	enterSpeed,
	enterWaypoints,
	exitWaypoints,
	inPen,
	pastureSpot,
	penXRange,
	returnWaypoints,
	spawnDoor,
	stepFarmer
} from './yard';
import {
	BEAT,
	MAX_RECORD_SECONDS,
	decodeFile,
	ensureYell,
	getContext,
	hasParrotSample,
	playAnimal,
	playClick,
	playYell,
	recordMic,
	setParrotTwist,
	setPianoOctave,
	startPianoNote,
	stopAllPianoNotes,
	stopPianoNote,
	stopYell,
	yellDuration
} from './audio';
import { dueAccompanimentHits, type Sequence } from './playback';
import { pianoNoteIndex, recordPianoHold } from './piano';

export type Phase = 'piazza' | 'registra' | 'orchestra';
export type FarmerPose = 'idle' | 'yell' | 'run' | 'point';

export const FARMER_GO = "se v pij v'accid titt";

export type Placed = {
	id: string;
	kind: AnimalId;
	key: string;
	x: number;
	y: number;
	vx: number;
	vy: number;
	tx: number;
	ty: number;
	path: { x: number; y: number }[];
	pathI: number;
	entering: boolean;
	walking: boolean;
	facing: number;
	idleUntil: number;
	hitUntil: number;
	hits: number[];
	notes: number[];
	sequenceLength: number;
	pose: AnimalPose;
	escaped: boolean;
	ready: boolean;
};

const PIANO_ID = 'piano';

export type Meteor = {
	id: number;
	x: number;
	y: number;
	born: number;
};

let nextId = 1;
let nextMeteor = 1;

export class FarmGame {
	phase = $state<Phase>('piazza');
	placed = $state<Placed[]>([]);
	elapsed = $state(0);
	loopLength = $state(MAX_RECORD_SECONDS);
	beat = $state(0);
	farmer = $state({ x: 28, y: 56, facing: 1, pose: 'idle' as FarmerPose });
	meteors = $state<Meteor[]>([]);
	hue = $state(0);
	flash = $state(0);
	parrotOctave = $state(0);
	parrotSpeed = $state(1);
	pianoOctave = $state(0);
	pianoSelected = $state(false);
	pianoHits = $state<number[]>([]);
	pianoNotes = $state<number[]>([]);
	pianoHolds = $state<number[]>([]);
	pianoLength = $state(0);
	pianoReady = $state(false);
	heldPiano = $state<number[]>([]);
	lastPianoNote = $state<number | null>(null);
	hasParrot = $state(false);
	micBusy = $state(false);
	menuKind = $state<AnimalId>('pappagallo');
	now = $state(0);
	selectedId = $state<string | null>(null);
	recordingId = $state<string | null>(null);

	#recordStartedAt = 0;
	#orchStartedAt = 0;
	#lastBeat = -1;
	#fired = new Set<string>();
	#loopIndex = 0;
	#lastStamp = 0;
	#yellUntil = 0;
	#kickoFallAt = 0;
	#pointUntil = 0;
	#pianoHeldAt = new Map<number, number>();

	get kinds(): AnimalKind[] {
		return KINDS;
	}

	get selected() {
		return this.placed.find((p) => p.id === this.selectedId) ?? null;
	}

	get recording() {
		return this.placed.find((p) => p.id === this.recordingId) ?? null;
	}

	get recordingPiano() {
		return this.recordingId === PIANO_ID;
	}

	get hasSequences() {
		return this.pianoHits.length > 0 || this.placed.some((p) => p.hits.length > 0);
	}

	get hasReady() {
		return (
			(this.pianoReady && this.pianoHits.length > 0) ||
			this.placed.some((p) => p.ready && p.hits.length > 0)
		);
	}

	get canOpenPiano() {
		return this.phase !== 'orchestra' && (this.phase !== 'registra' || this.recordingPiano);
	}

	get remaining() {
		if (this.phase !== 'registra') return MAX_RECORD_SECONDS;
		return Math.max(0, MAX_RECORD_SECONDS - this.elapsed);
	}

	get canCall() {
		return this.phase === 'piazza' && this.placed.length < KEYS.length;
	}

	place(kind: AnimalId) {
		if (kind === 'piano') {
			this.openPiano();
			return;
		}
		if (this.phase !== 'piazza') return;
		if (this.placed.length >= KEYS.length) return;
		const key = KEYS[this.placed.length];
		const id = `a${nextId++}`;
		const door = spawnDoor(kindById(kind).group);
		const path = enterPath(kind);
		const first = path[0];
		this.pianoSelected = false;
		this.placed.push({
			id,
			kind,
			key,
			x: door.x,
			y: door.y,
			vx: 0,
			vy: 0,
			tx: first.x,
			ty: first.y,
			path,
			pathI: 0,
			entering: true,
			walking: true,
			facing: first.x >= door.x ? 1 : -1,
			idleUntil: 0,
			hitUntil: 0,
			hits: [],
			notes: [],
			sequenceLength: 0,
			pose: 'idle',
			escaped: false,
			ready: false
		});
		this.selectedId = id;
	}

	openPiano() {
		if (!this.canOpenPiano) return;
		getContext();
		this.pianoSelected = true;
		this.selectedId = null;
	}

	deselect() {
		if (this.phase !== 'piazza') return;
		this.selectedId = null;
		this.pianoSelected = false;
		this.#releaseHeldPiano(this.elapsed);
		stopAllPianoNotes();
	}

	clickAnimal(id: string) {
		const animal = this.placed.find((p) => p.id === id);
		if (!animal) return;
		if (this.phase === 'orchestra') return;
		getContext();
		if (this.phase === 'registra' && this.recordingId === id) {
			if (animal.kind === 'piano') return;
			this.#stamp(animal);
			return;
		}
		if (this.phase === 'registra') return;
		this.selectedId = id;
		this.pianoSelected = false;
		playAnimal(animal.kind);
		animal.hitUntil = performance.now() + 220;
	}

	startAnimalRecord(id: string) {
		if (this.phase === 'orchestra') return;
		if (id === PIANO_ID) {
			if (!this.pianoSelected) return;
			getContext();
			if (this.phase === 'registra') this.stopAnimalRecord();
			this.recordingId = PIANO_ID;
			this.pianoHits = [];
			this.pianoNotes = [];
			this.pianoHolds = [];
			this.pianoLength = 0;
			this.pianoReady = false;
			this.#pianoHeldAt.clear();
			this.heldPiano = [];
			this.phase = 'registra';
			this.elapsed = 0;
			this.beat = 0;
			this.#lastBeat = -1;
			this.#lastStamp = 0;
			this.#fired.clear();
			this.#loopIndex = 0;
			this.#recordStartedAt = performance.now();
			return;
		}
		const animal = this.placed.find((p) => p.id === id);
		if (!animal) return;
		getContext();
		if (this.phase === 'registra') this.stopAnimalRecord();
		this.pianoSelected = false;
		this.selectedId = id;
		this.recordingId = id;
		animal.hits = [];
		animal.notes = [];
		animal.sequenceLength = 0;
		animal.ready = false;
		this.phase = 'registra';
		this.elapsed = 0;
		this.beat = 0;
		this.#lastBeat = -1;
		this.#lastStamp = 0;
		this.#fired.clear();
		this.#loopIndex = 0;
		this.#recordStartedAt = performance.now();
	}

	stopAnimalRecord() {
		this.#releaseHeldPiano(this.elapsed);
		if (this.recordingPiano) {
			const last = this.pianoHits.at(-1) ?? 0;
			const lastHold = this.pianoHolds.at(-1) ?? 0;
			this.pianoLength = Math.max(
				2,
				Math.min(MAX_RECORD_SECONDS, Math.max(this.elapsed, last + lastHold + 0.5))
			);
		} else {
			const animal = this.placed.find((p) => p.id === this.recordingId);
			if (animal) {
				const last = animal.hits.at(-1) ?? 0;
				animal.sequenceLength = Math.max(
					2,
					Math.min(MAX_RECORD_SECONDS, Math.max(this.elapsed, last + 0.5))
				);
			}
		}
		this.phase = 'piazza';
		this.recordingId = null;
		this.elapsed = 0;
		this.#lastBeat = -1;
	}

	scappa(id: string) {
		if (this.phase !== 'piazza') return;
		if (id === PIANO_ID) {
			if (this.pianoHits.length === 0 || this.pianoReady) return;
			this.pianoReady = true;
			return;
		}
		const animal = this.placed.find((p) => p.id === id);
		if (!animal || animal.hits.length === 0 || animal.ready) return;
		animal.ready = true;
		animal.escaped = true;
		animal.pose = 'idle';
		if (inPen(animal.x, animal.y) || animal.entering) {
			beginPath(animal, [...exitWaypoints(), pastureSpot()]);
		}
	}

	cancella(id: string) {
		if (this.phase === 'orchestra') return;
		if (this.recordingId === id) this.stopAnimalRecord();
		if (id === PIANO_ID) {
			this.pianoHits = [];
			this.pianoNotes = [];
			this.pianoHolds = [];
			this.pianoLength = 0;
			this.pianoReady = false;
			this.#pianoHeldAt.clear();
			this.heldPiano = [];
			stopAllPianoNotes();
			return;
		}
		const animal = this.placed.find((p) => p.id === id);
		if (!animal) return;
		animal.hits = [];
		animal.notes = [];
		animal.sequenceLength = 0;
		animal.ready = false;
		if (animal.escaped || !inPen(animal.x, animal.y)) {
			this.#sendHome(animal);
		}
	}

	async clickFarmer() {
		getContext();
		if (this.phase === 'registra') return;
		if (this.phase === 'orchestra') {
			this.stopOrchestra();
			return;
		}
		if (!this.hasReady || this.farmer.pose !== 'idle') return;
		await this.#startOrchestra();
	}

	stopOrchestra() {
		stopYell();
		this.phase = 'piazza';
		this.farmer.pose = 'point';
		this.farmer.x = 28;
		this.farmer.y = 56;
		this.farmer.facing = 1;
		this.meteors = [];
		this.hue = 0;
		this.#yellUntil = 0;
		this.#kickoFallAt = 0;
		this.#pointUntil = performance.now() + 900;
		this.pianoReady = false;
		stopAllPianoNotes();
		for (const animal of this.placed) {
			animal.pose = 'idle';
			animal.ready = false;
			if (animal.escaped || !inPen(animal.x, animal.y)) this.#sendHome(animal);
		}
	}

	pressKey(raw: string) {
		if (this.phase === 'orchestra') return;
		const note = pianoNoteIndex(raw);
		if (note != null && (this.pianoSelected || this.recordingPiano)) {
			this.pressPiano(note);
			return;
		}
		if (this.phase === 'registra') {
			if (this.recordingPiano) return;
			const animal = this.recording;
			if (!animal) return;
			this.#stamp(animal);
			return;
		}
		const key = raw.toUpperCase();
		const animal = this.placed.find((p) => p.key === key);
		if (animal) this.clickAnimal(animal.id);
	}

	releaseKey(raw: string) {
		const note = pianoNoteIndex(raw);
		if (note == null) return;
		this.releasePiano(note);
	}

	pressPiano(note: number) {
		if (!this.pianoSelected && !this.recordingPiano) return;
		if (this.heldPiano.includes(note)) return;
		getContext();
		startPianoNote(note, this.pianoOctave);
		this.lastPianoNote = note;
		if (!this.heldPiano.includes(note)) this.heldPiano = [...this.heldPiano, note];
		if (this.recordingPiano) this.#pianoHeldAt.set(note, this.elapsed);
	}

	releasePiano(note: number) {
		stopPianoNote(note);
		this.heldPiano = this.heldPiano.filter((n) => n !== note);
		if (this.lastPianoNote === note) this.lastPianoNote = this.heldPiano.at(-1) ?? null;
		const start = this.#pianoHeldAt.get(note);
		this.#pianoHeldAt.delete(note);
		if (!this.recordingPiano || start == null) return;
		const line = {
			hits: this.pianoHits,
			notes: this.pianoNotes,
			holds: this.pianoHolds
		};
		recordPianoHold(line, note, start, this.elapsed);
		this.pianoHits = line.hits;
		this.pianoNotes = line.notes;
		this.pianoHolds = line.holds;
	}

	twistPiano() {
		setPianoOctave(this.pianoOctave);
	}

	async loadParrot(file: File) {
		await decodeFile(file);
		this.hasParrot = hasParrotSample();
	}

	async captureParrot() {
		this.micBusy = true;
		try {
			await recordMic(3);
			this.hasParrot = hasParrotSample();
		} finally {
			this.micBusy = false;
		}
	}

	twistParrot() {
		setParrotTwist(this.parrotOctave, this.parrotSpeed);
	}

	tick(dt: number, wall: number) {
		this.now = wall;
		this.#audioClock();
		this.#wander(dt, wall);
		this.#psyche(dt, wall);
		if (this.phase === 'orchestra' && this.farmer.pose === 'yell' && this.#yellUntil && wall >= this.#yellUntil) {
			this.farmer.pose = 'run';
		}
		if (this.farmer.pose === 'point' && wall >= this.#pointUntil) {
			const returning = this.placed.some((a) => a.entering);
			if (!returning) this.farmer.pose = 'idle';
		}
		if (this.phase === 'orchestra' && this.#kickoFallAt && wall >= this.#kickoFallAt) {
			for (const animal of this.placed) {
				if (animal.kind !== 'kicko' || animal.pose === 'fall' || !animal.ready) continue;
				animal.pose = 'fall';
				animal.walking = false;
				animal.vx = 0;
				animal.vy = 0;
			}
		}
	}

	#stamp(animal: Placed, note?: number) {
		const t = performance.now();
		if (t - this.#lastStamp < 80) return;
		this.#lastStamp = t;
		playAnimal(animal.kind, undefined, note ?? 0, this.pianoOctave);
		animal.hitUntil = t + 220;
		animal.hits.push(this.elapsed);
	}

	async #startOrchestra() {
		await ensureYell();
		if (this.phase !== 'piazza' || !this.hasReady) return;
		this.phase = 'orchestra';
		this.farmer.pose = 'yell';
		this.farmer.y = 56;
		this.loopLength = Math.max(
			4,
			this.pianoHits.length > 0 ? this.pianoLength || 4 : 0,
			...this.placed.filter((p) => p.hits.length > 0).map((p) => p.sequenceLength || 4)
		);
		this.#orchStartedAt = performance.now();
		this.#fired.clear();
		this.#loopIndex = 0;
		this.#lastBeat = -1;
		const duration = playYell();
		this.#yellUntil = performance.now() + Math.max(duration, yellDuration()) * 1000;
		this.#kickoFallAt = performance.now() + 1400;
		for (const animal of this.placed) {
			if (!animal.ready) continue;
			animal.pose = 'run';
			animal.walking = true;
			if (animal.entering) continue;
			animal.vx = animal.x < 55 ? 1 : -1;
			animal.vy = 0;
			animal.facing = animal.vx >= 0 ? 1 : -1;
		}
	}

	#sendHome(animal: Placed) {
		animal.ready = false;
		animal.pose = 'idle';
		animal.escaped = true;
		beginPath(animal, [...returnWaypoints(), penSpot()]);
	}

	#audioClock() {
		if (this.phase === 'registra') {
			this.elapsed = (performance.now() - this.#recordStartedAt) / 1000;
			if (this.elapsed >= MAX_RECORD_SECONDS) {
				this.stopAnimalRecord();
				return;
			}
			const beat = Math.floor(this.elapsed / BEAT);
			if (beat !== this.#lastBeat) {
				this.#lastBeat = beat;
				this.beat = beat;
				this.flash = 1;
				playClick();
			}
			for (const due of dueAccompanimentHits(
				this.#sequences(),
				this.elapsed,
				this.recordingId,
				this.#fired
			)) {
				this.#playDue(due);
			}
			return;
		}

		if (this.phase === 'orchestra') {
			const elapsed = (performance.now() - this.#orchStartedAt) / 1000;
			const t = elapsed % this.loopLength;
			const beat = Math.floor(t / BEAT);
			if (beat !== this.#lastBeat) {
				this.#lastBeat = beat;
				this.beat = beat;
				this.flash = 1;
				if (beat % 2 === 0) this.#spawnMeteor();
			}
			for (const due of dueAccompanimentHits(
				this.#readySequences(),
				elapsed,
				null,
				this.#fired
			)) {
				this.#playDue(due);
			}
		}
	}

	#sequences(): Sequence[] {
		const list: Sequence[] = this.placed.map((p) => ({
			id: p.id,
			hits: p.hits,
			notes: p.notes,
			sequenceLength: p.sequenceLength
		}));
		if (this.pianoHits.length > 0) {
			list.push({
				id: PIANO_ID,
				hits: this.pianoHits,
				notes: this.pianoNotes,
				holds: this.pianoHolds,
				sequenceLength: this.pianoLength
			});
		}
		return list;
	}

	#readySequences(): Sequence[] {
		return this.#sequences().filter((s) => {
			if (s.id === PIANO_ID) return this.pianoReady;
			return this.placed.find((p) => p.id === s.id)?.ready;
		});
	}

	#playDue(due: { id: string; note?: number; hold?: number }) {
		if (due.id === PIANO_ID) {
			playAnimal('piano', undefined, due.note ?? 0, this.pianoOctave, due.hold);
			return;
		}
		const animal = this.placed.find((p) => p.id === due.id);
		if (!animal) return;
		playAnimal(animal.kind, undefined, due.note ?? 0, this.pianoOctave);
		animal.hitUntil = performance.now() + 240;
	}

	#releaseHeldPiano(end: number) {
		for (const [note, start] of this.#pianoHeldAt) {
			const line = {
				hits: this.pianoHits,
				notes: this.pianoNotes,
				holds: this.pianoHolds
			};
			recordPianoHold(line, note, start, end);
			this.pianoHits = line.hits;
			this.pianoNotes = line.notes;
			this.pianoHolds = line.holds;
		}
		this.#pianoHeldAt.clear();
		this.heldPiano = [];
		stopAllPianoNotes();
	}

	#wander(dt: number, wall: number) {
		stepFarmer(this.farmer, dt, wall, this.phase);

		for (const a of this.placed) {
			if (a.pose === 'fall') {
				a.walking = false;
				continue;
			}
			if (a.id === this.recordingId) {
				a.walking = false;
				continue;
			}
			if (a.entering) {
				const next = a.path[a.pathI];
				walkToward(a, a.tx, a.ty, enterSpeed(next) * dt);
				if (Math.hypot(a.tx - a.x, a.ty - a.y) < 1.2) {
					a.pathI += 1;
					const following = a.path[a.pathI];
					if (!following) {
						a.entering = false;
						a.x = a.tx;
						a.y = a.ty;
						if (this.phase === 'orchestra' && a.ready) {
							a.pose = 'run';
							a.walking = true;
							a.vx = a.x < 55 ? 1 : -1;
							a.vy = 0;
							a.facing = a.vx >= 0 ? 1 : -1;
						} else {
							a.walking = false;
							if (!a.ready) a.escaped = false;
							a.idleUntil = wall + 400 + Math.random() * 900;
							grazeTarget(a);
						}
					} else {
						a.tx = following.x;
						a.ty = following.y;
					}
				}
				continue;
			}
			if (a.pose === 'run') {
				a.walking = true;
				a.x += Math.sign(a.vx || 1) * 14 * dt;
				a.facing = Math.sign(a.vx || 1);
				if (a.escaped) bounceInPasture(a);
				else bounceInPen(a);
				continue;
			}
			graze(a, dt, wall, this.phase === 'orchestra');
		}
	}

	#psyche(dt: number, wall: number) {
		this.flash = Math.max(0, this.flash - dt * 3);
		if (this.phase === 'orchestra') {
			this.hue = (this.hue + dt * 18) % 360;
			this.meteors = this.meteors.filter((m) => wall - m.born < 900);
		} else {
			this.hue *= 0.9;
			this.meteors = [];
		}
	}

	#spawnMeteor() {
		this.meteors.push({
			id: nextMeteor++,
			x: Math.random() * 100,
			y: -8,
			born: performance.now()
		});
	}
}

function enterPath(kind: AnimalId) {
	return [...enterWaypoints(kindById(kind).group), penSpot()];
}

function beginPath(a: Placed, path: { x: number; y: number }[]) {
	a.path = path;
	a.pathI = 0;
	a.entering = true;
	a.walking = true;
	const first = path[0];
	a.tx = first.x;
	a.ty = first.y;
}

function penSpot() {
	const y = PEN.y0 + 4 + Math.random() * (PEN.y1 - PEN.y0 - 8);
	const { x0, x1 } = penXRange(y);
	return { x: x0 + 3 + Math.random() * (x1 - x0 - 6), y };
}

function bounceInPen(a: Placed) {
	a.y = clamp(a.y, PEN.y0, PEN.y1);
	const { x0, x1 } = penXRange(a.y);
	if (a.x < x0 || a.x > x1) a.vx *= -1;
	if (a.y <= PEN.y0 || a.y >= PEN.y1) a.vy *= -1;
	a.x = clamp(a.x, x0, x1);
	a.y = clamp(a.y, PEN.y0, PEN.y1);
}

function walkToward(a: Placed, tx: number, ty: number, step: number) {
	const dx = tx - a.x;
	const dy = ty - a.y;
	const dist = Math.hypot(dx, dy);
	if (dist < 0.2) {
		a.walking = false;
		return;
	}
	a.walking = true;
	if (Math.abs(dx) > 0.15) a.facing = dx >= 0 ? 1 : -1;
	a.x += (dx / dist) * step;
	a.y += (dy / dist) * step;
}

function bounceInPasture(a: Placed) {
	if (a.x < PASTURE.x0 || a.x > PASTURE.x1) a.vx *= -1;
	if (a.y <= PASTURE.y0 || a.y >= PASTURE.y1) a.vy *= -1;
	a.x = clamp(a.x, PASTURE.x0, PASTURE.x1);
	a.y = clamp(a.y, PASTURE.y0, PASTURE.y1);
}

function grazeTarget(a: Placed) {
	const spot = a.escaped ? pastureSpot() : penSpot();
	a.tx = spot.x;
	a.ty = spot.y;
}

function graze(a: Placed, dt: number, wall: number, wild: boolean) {
	if (wall < a.idleUntil) {
		a.walking = false;
		return;
	}
	const dx = a.tx - a.x;
	const dy = a.ty - a.y;
	if (Math.hypot(dx, dy) < 1.1) {
		a.walking = false;
		a.idleUntil = wall + (wild ? 180 + Math.random() * 420 : 700 + Math.random() * 1600);
		grazeTarget(a);
		return;
	}
	walkToward(a, a.tx, a.ty, (wild ? 12 : 6.5) * dt);
	if (a.escaped) bounceInPasture(a);
	else bounceInPen(a);
}

export function farmerHint(
	phase: Phase,
	hasAnimals: boolean,
	hasSequences: boolean,
	hasReady: boolean
) {
	if (!hasAnimals) return 'Prima chiama un animale';
	if (phase === 'registra') return 'CLICCA L’ANIMALE';
	if (phase === 'orchestra') return 'CLICCA PER FERMARE';
	if (!hasSequences) return 'PRIMA REGISTRA DALLA BARRA';
	if (!hasReady) return 'PRIMA CONFERMA DALLA BARRA';
	return 'CLICCA IL FARMER';
}

export { kindById };
