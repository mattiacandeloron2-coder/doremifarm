import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PIANO_KEYS, pianoMidi, pianoNoteIndex, recordPianoHold } from './piano.ts';
import { dueAccompanimentHits } from './playback.ts';

test('asdfghjkl are nine sequential keys on the mini piano', () => {
	assert.deepEqual([...PIANO_KEYS], ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L']);
	assert.equal(pianoNoteIndex('a'), 0);
	assert.equal(pianoNoteIndex('S'), 1);
	assert.equal(pianoNoteIndex('L'), 8);
	assert.equal(pianoNoteIndex('z'), null);
});

test('keys walk a C major scale, and ottava shifts by 12', () => {
	assert.deepEqual(
		PIANO_KEYS.map((_, i) => pianoMidi(i, 0)),
		[60, 62, 64, 65, 67, 69, 71, 72, 74]
	);
	assert.equal(pianoMidi(0, 1), 72);
	assert.equal(pianoMidi(0, -1), 48);
});

test('piano accompaniment keeps which key was pressed', () => {
	const piano = { id: 'p1', hits: [1], notes: [3], sequenceLength: 4 };
	const due = dueAccompanimentHits([piano], 1, 'other', new Set());
	assert.deepEqual(due, [{ id: 'p1', hit: 1, note: 3 }]);
});

test('holding a piano key records how long it was pressed', () => {
	const line = { hits: [] as number[], notes: [] as number[], holds: [] as number[] };
	recordPianoHold(line, 2, 1, 2.5);
	assert.deepEqual(line, { hits: [1], notes: [2], holds: [1.5] });
});

test('piano accompaniment keeps how long the key was held', () => {
	const piano = { id: 'p1', hits: [1], notes: [3], holds: [1.4], sequenceLength: 4 };
	const due = dueAccompanimentHits([piano], 1, 'other', new Set());
	assert.deepEqual(due, [{ id: 'p1', hit: 1, note: 3, hold: 1.4 }]);
});
