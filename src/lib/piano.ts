export const PIANO_KEYS = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'] as const;

const SCALE_SEMITONES = [0, 2, 4, 5, 7, 9, 11, 12, 14];
const C4 = 60;

export function pianoNoteIndex(raw: string): number | null {
	const key = raw.toUpperCase();
	const i = (PIANO_KEYS as readonly string[]).indexOf(key);
	return i < 0 ? null : i;
}

export function pianoMidi(noteIndex: number, octave = 0): number {
	const i = Math.max(0, Math.min(SCALE_SEMITONES.length - 1, noteIndex | 0));
	return C4 + SCALE_SEMITONES[i] + octave * 12;
}

export function pianoFreq(noteIndex: number, octave = 0): number {
	return 440 * Math.pow(2, (pianoMidi(noteIndex, octave) - 69) / 12);
}

export function recordPianoHold(
	line: { hits: number[]; notes: number[]; holds: number[] },
	note: number,
	start: number,
	end: number
) {
	line.hits.push(start);
	line.notes.push(note);
	line.holds.push(Math.max(0.05, end - start));
}
