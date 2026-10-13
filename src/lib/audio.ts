import { asset } from '$app/paths';
import type { AnimalId } from './catalog';
import { pianoFreq } from './piano';

const BPM = 120;
export const BEAT = 60 / BPM;
export const MAX_RECORD_SECONDS = 60;

let ctx: AudioContext | null = null;
let parrotBuffer: AudioBuffer | null = null;
let parrotOctave = 0;
let parrotSpeed = 1;
let pianoOctave = 0;

export function getContext(): AudioContext {
	if (!ctx) ctx = new AudioContext();
	if (ctx.state === 'suspended') void ctx.resume();
	return ctx;
}

export function setParrotBuffer(buffer: AudioBuffer | null) {
	parrotBuffer = buffer;
}

export function setParrotTwist(octave: number, speed: number) {
	parrotOctave = octave;
	parrotSpeed = speed;
}

export function setPianoOctave(octave: number) {
	pianoOctave = octave;
}

export function hasParrotSample() {
	return parrotBuffer !== null;
}

function now() {
	return getContext().currentTime;
}

function dest() {
	return getContext().destination;
}

function envGain(t: number, attack: number, hold: number, release: number, peak = 0.4) {
	const g = getContext().createGain();
	g.gain.setValueAtTime(0, t);
	g.gain.linearRampToValueAtTime(peak, t + attack);
	g.gain.setValueAtTime(peak, t + attack + hold);
	g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
	return g;
}

function noiseBuffer(seconds = 0.4) {
	const audio = getContext();
	const length = Math.floor(audio.sampleRate * seconds);
	const buffer = audio.createBuffer(1, length, audio.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
	return buffer;
}

export function playClick(when = now()) {
	const audio = getContext();
	const osc = audio.createOscillator();
	const g = envGain(when, 0.001, 0.01, 0.04, 0.12);
	osc.type = 'square';
	osc.frequency.setValueAtTime(1660, when);
	osc.connect(g);
	g.connect(dest());
	osc.start(when);
	osc.stop(when + 0.06);
}

function playKick(when: number) {
	const audio = getContext();
	const osc = audio.createOscillator();
	const g = envGain(when, 0.001, 0.02, 0.22, 0.9);
	osc.type = 'sine';
	osc.frequency.setValueAtTime(92, when);
	osc.frequency.exponentialRampToValueAtTime(28, when + 0.18);
	const metal = audio.createOscillator();
	metal.type = 'triangle';
	metal.frequency.setValueAtTime(311, when);
	metal.frequency.exponentialRampToValueAtTime(40, when + 0.12);
	const mg = envGain(when, 0.001, 0.01, 0.1, 0.18);
	osc.connect(g);
	metal.connect(mg);
	g.connect(dest());
	mg.connect(dest());
	osc.start(when);
	metal.start(when);
	osc.stop(when + 0.28);
	metal.stop(when + 0.16);
}

function playSnare(when: number) {
	const audio = getContext();
	const src = audio.createBufferSource();
	src.buffer = noiseBuffer(0.25);
	const bp = audio.createBiquadFilter();
	bp.type = 'bandpass';
	bp.frequency.setValueAtTime(1850, when);
	bp.Q.value = 0.7;
	const g = envGain(when, 0.001, 0.02, 0.14, 0.55);
	const tone = audio.createOscillator();
	tone.type = 'square';
	tone.frequency.setValueAtTime(187, when);
	tone.frequency.exponentialRampToValueAtTime(90, when + 0.08);
	const tg = envGain(when, 0.001, 0.01, 0.08, 0.12);
	src.connect(bp);
	bp.connect(g);
	g.connect(dest());
	tone.connect(tg);
	tg.connect(dest());
	src.start(when);
	tone.start(when);
	tone.stop(when + 0.12);
}

function playBlippo(when: number) {
	const audio = getContext();
	const carrier = audio.createOscillator();
	const mod = audio.createOscillator();
	const modGain = audio.createGain();
	carrier.type = 'sawtooth';
	mod.type = 'square';
	const base = 140 + Math.random() * 420;
	carrier.frequency.setValueAtTime(base, when);
	carrier.frequency.exponentialRampToValueAtTime(base * (Math.random() > 0.5 ? 2.7 : 0.4), when + 0.22);
	mod.frequency.setValueAtTime(30 + Math.random() * 80, when);
	modGain.gain.setValueAtTime(400 + Math.random() * 800, when);
	mod.connect(modGain);
	modGain.connect(carrier.frequency);
	const g = envGain(when, 0.005, 0.05, 0.18, 0.28);
	carrier.connect(g);
	g.connect(dest());
	carrier.start(when);
	mod.start(when);
	carrier.stop(when + 0.28);
	mod.stop(when + 0.28);
}

function playZizz(when: number) {
	const audio = getContext();
	const a = audio.createOscillator();
	const b = audio.createOscillator();
	a.type = 'square';
	b.type = 'sawtooth';
	a.frequency.setValueAtTime(55, when);
	b.frequency.setValueAtTime(56.4, when);
	a.frequency.linearRampToValueAtTime(880, when + 0.16);
	b.frequency.linearRampToValueAtTime(910, when + 0.16);
	const g = envGain(when, 0.01, 0.04, 0.2, 0.22);
	a.connect(g);
	b.connect(g);
	g.connect(dest());
	a.start(when);
	b.start(when);
	a.stop(when + 0.28);
	b.stop(when + 0.28);
}

function playGallina(when: number) {
	const audio = getContext();
	for (let i = 0; i < 4; i++) {
		const t = when + i * 0.045;
		const osc = audio.createOscillator();
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(740 - i * 70, t);
		osc.frequency.exponentialRampToValueAtTime(420 - i * 40, t + 0.04);
		const g = envGain(t, 0.002, 0.01, 0.04, 0.22);
		osc.connect(g);
		g.connect(dest());
		osc.start(t);
		osc.stop(t + 0.07);
	}
}

function playMucca(when: number) {
	const audio = getContext();
	const osc = audio.createOscillator();
	const osc2 = audio.createOscillator();
	osc.type = 'sawtooth';
	osc2.type = 'triangle';
	osc.frequency.setValueAtTime(130, when);
	osc.frequency.linearRampToValueAtTime(95, when + 0.45);
	osc2.frequency.setValueAtTime(262, when);
	osc2.frequency.linearRampToValueAtTime(190, when + 0.45);
	const f = audio.createBiquadFilter();
	f.type = 'lowpass';
	f.frequency.setValueAtTime(480, when);
	const g = envGain(when, 0.04, 0.2, 0.28, 0.32);
	osc.connect(f);
	osc2.connect(f);
	f.connect(g);
	g.connect(dest());
	osc.start(when);
	osc2.start(when);
	osc.stop(when + 0.55);
	osc2.stop(when + 0.55);
}

function playMaiale(when: number) {
	const audio = getContext();
	const osc = audio.createOscillator();
	osc.type = 'sawtooth';
	osc.frequency.setValueAtTime(280, when);
	osc.frequency.exponentialRampToValueAtTime(920, when + 0.18);
	osc.frequency.exponentialRampToValueAtTime(240, when + 0.38);
	const n = audio.createBufferSource();
	n.buffer = noiseBuffer(0.4);
	const ng = envGain(when, 0.01, 0.05, 0.2, 0.08);
	const g = envGain(when, 0.01, 0.12, 0.2, 0.28);
	osc.connect(g);
	n.connect(ng);
	g.connect(dest());
	ng.connect(dest());
	osc.start(when);
	n.start(when);
	osc.stop(when + 0.42);
}

function playParrot(when: number) {
	if (!parrotBuffer) {
		playBlippo(when);
		return;
	}
	const audio = getContext();
	const src = audio.createBufferSource();
	src.buffer = parrotBuffer;
	const rate = parrotSpeed * Math.pow(2, parrotOctave);
	src.playbackRate.setValueAtTime(Math.max(0.25, Math.min(4, rate)), when);
	const g = audio.createGain();
	g.gain.setValueAtTime(0.7, when);
	src.connect(g);
	g.connect(dest());
	src.start(when);
}

type PianoVoice = {
	oscs: OscillatorNode[];
	gains: GainNode[];
};

const pianoVoices = new Map<number, PianoVoice>();

function wirePiano(when: number, noteIndex: number, octave: number) {
	const audio = getContext();
	const freq = pianoFreq(noteIndex, octave);
	const osc1 = audio.createOscillator();
	const osc2 = audio.createOscillator();
	const sub = audio.createOscillator();
	osc1.type = 'sawtooth';
	osc2.type = 'sawtooth';
	sub.type = 'triangle';
	osc1.frequency.setValueAtTime(freq, when);
	osc2.frequency.setValueAtTime(freq, when);
	osc2.detune.setValueAtTime(8, when);
	sub.frequency.setValueAtTime(freq / 2, when);
	const filter = audio.createBiquadFilter();
	filter.type = 'lowpass';
	filter.Q.value = 8;
	filter.frequency.setValueAtTime(Math.min(3600, freq * 8), when);
	const g = audio.createGain();
	const sg = audio.createGain();
	osc1.connect(filter);
	osc2.connect(filter);
	filter.connect(g);
	g.connect(dest());
	sub.connect(sg);
	sg.connect(dest());
	return { oscs: [osc1, osc2, sub], gains: [g, sg] };
}

function playPiano(when: number, noteIndex = 0, octave = pianoOctave, hold = 0.72) {
	const dur = Math.max(0.08, hold);
	const { oscs, gains } = wirePiano(when, noteIndex, octave);
	const peak = [0.2, 0.08];
	for (let i = 0; i < gains.length; i++) {
		const g = gains[i];
		g.gain.setValueAtTime(0, when);
		g.gain.linearRampToValueAtTime(peak[i], when + 0.02);
		const cut = when + dur;
		g.gain.setValueAtTime(peak[i], Math.max(when + 0.02, cut - 0.12));
		g.gain.exponentialRampToValueAtTime(0.0001, cut);
	}
	for (const osc of oscs) {
		osc.start(when);
		osc.stop(when + dur + 0.02);
	}
}

export function startPianoNote(noteIndex: number, octave = pianoOctave) {
	stopPianoNote(noteIndex);
	const when = now();
	const voice = wirePiano(when, noteIndex, octave);
	voice.gains[0].gain.setValueAtTime(0, when);
	voice.gains[0].gain.linearRampToValueAtTime(0.2, when + 0.02);
	voice.gains[1].gain.setValueAtTime(0, when);
	voice.gains[1].gain.linearRampToValueAtTime(0.08, when + 0.02);
	for (const osc of voice.oscs) osc.start(when);
	pianoVoices.set(noteIndex, voice);
}

export function stopPianoNote(noteIndex: number) {
	const voice = pianoVoices.get(noteIndex);
	if (!voice) return;
	const t = now();
	for (const g of voice.gains) {
		const cur = Math.max(g.gain.value, 0.001);
		g.gain.cancelScheduledValues(t);
		g.gain.setValueAtTime(cur, t);
		g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
	}
	for (const osc of voice.oscs) {
		try {
			osc.stop(t + 0.14);
		} catch {
			/* already stopped */
		}
	}
	pianoVoices.delete(noteIndex);
}

export function stopAllPianoNotes() {
	for (const note of [...pianoVoices.keys()]) stopPianoNote(note);
}

export function playAnimal(
	id: AnimalId,
	when = now(),
	note = 0,
	octave?: number,
	hold?: number
) {
	switch (id) {
		case 'kicko':
			playKick(when);
			return;
		case 'snarix':
			playSnare(when);
			return;
		case 'blippo':
			playBlippo(when);
			return;
		case 'zizz':
			playZizz(when);
			return;
		case 'gallina':
			playGallina(when);
			return;
		case 'mucca':
			playMucca(when);
			return;
		case 'maiale':
			playMaiale(when);
			return;
		case 'pappagallo':
			playParrot(when);
			return;
		case 'piano':
			playPiano(when, note, octave ?? pianoOctave, hold ?? 0.72);
	}
}

export async function decodeFile(file: File) {
	const audio = getContext();
	const data = await file.arrayBuffer();
	const buffer = await audio.decodeAudioData(data.slice(0));
	setParrotBuffer(buffer);
}

export async function recordMic(seconds = 3) {
	const audio = getContext();
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
	const source = audio.createMediaStreamSource(stream);
	const chunks: Float32Array[] = [];
	const proc = audio.createScriptProcessor(2048, 1, 1);
	const mute = audio.createGain();
	mute.gain.value = 0;
	proc.onaudioprocess = (event) => {
		chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
	};
	source.connect(proc);
	proc.connect(mute);
	mute.connect(audio.destination);
	await new Promise((r) => setTimeout(r, seconds * 1000));
	proc.disconnect();
	source.disconnect();
	stream.getTracks().forEach((t) => t.stop());
	const length = chunks.reduce((n, c) => n + c.length, 0);
	const buffer = audio.createBuffer(1, Math.max(1, length), audio.sampleRate);
	const data = buffer.getChannelData(0);
	let o = 0;
	for (const c of chunks) {
		data.set(c, o);
		o += c.length;
	}
	setParrotBuffer(buffer);
}

let yellBuffer: AudioBuffer | null = null;
let yellSource: AudioBufferSourceNode | null = null;
let yellLoading: Promise<void> | null = null;

export async function ensureYell() {
	if (yellBuffer) return;
	if (!yellLoading) {
		yellLoading = (async () => {
			const audio = getContext();
			const res = await fetch(asset('/vai-comba.wav'));
			const data = await res.arrayBuffer();
			yellBuffer = await audio.decodeAudioData(data.slice(0));
		})().catch(() => {
			yellLoading = null;
		});
	}
	await yellLoading;
}

export function yellDuration() {
	return yellBuffer?.duration ?? 2.6;
}

export function stopYell() {
	try {
		yellSource?.stop();
	} catch {
		/* already stopped */
	}
	yellSource = null;
	if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}

function yellVoice() {
	if (typeof speechSynthesis === 'undefined') return null;
	const voices = speechSynthesis.getVoices();
	const italian = voices.filter((v) => /^it/i.test(v.lang));
	return (
		italian.find((v) => /diego|giuseppe|cataldo|cosimo|male|uomo/i.test(v.name)) ??
		italian[0] ??
		null
	);
}

function yellCombaSpeech() {
	if (typeof speechSynthesis === 'undefined') return;
	speechSynthesis.cancel();
	const u = new SpeechSynthesisUtterance('Sote rotte la ciuccie. Compaaaaaaa!');
	const voice = yellVoice();
	if (voice) u.voice = voice;
	u.rate = 0.68;
	u.pitch = 0.28;
	u.volume = 1;
	u.lang = 'it-IT';
	speechSynthesis.speak(u);
}

export function playYell() {
	stopYell();
	if (!yellBuffer) {
		yellCombaSpeech();
		return yellDuration();
	}
	const audio = getContext();
	const src = audio.createBufferSource();
	src.buffer = yellBuffer;
	const g = audio.createGain();
	g.gain.value = 3.4;
	const punch = audio.createDynamicsCompressor();
	punch.threshold.value = -18;
	punch.knee.value = 4;
	punch.ratio.value = 14;
	punch.attack.value = 0.003;
	punch.release.value = 0.12;
	src.connect(g);
	g.connect(punch);
	punch.connect(dest());
	src.start();
	yellSource = src;
	src.onended = () => {
		if (yellSource === src) yellSource = null;
	};
	return yellBuffer.duration;
}
