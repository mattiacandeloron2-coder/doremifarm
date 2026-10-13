import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dueAccompanimentHits } from './playback.ts';

const gallina = {
	id: 'a1',
	hits: [1],
	sequenceLength: 4
};

const mucca = {
	id: 'a2',
	hits: [0.5, 2],
	sequenceLength: 4
};

test('first recording has no accompaniment', () => {
	const fired = new Set<string>();
	const due = dueAccompanimentHits([gallina], 1, 'a1', fired);
	assert.deepEqual(due, []);
});

test('while recording, you hear the other animal at its pallino', () => {
	const fired = new Set<string>();
	const due = dueAccompanimentHits([gallina, mucca], 1, 'a2', fired);
	assert.deepEqual(due, [{ id: 'a1', hit: 1 }]);
});

test('a pallino fires once until the loop comes around', () => {
	const fired = new Set<string>();
	dueAccompanimentHits([gallina, mucca], 1, 'a2', fired);
	assert.deepEqual(dueAccompanimentHits([gallina, mucca], 1.2, 'a2', fired), []);
	assert.deepEqual(dueAccompanimentHits([gallina, mucca], 5, 'a2', fired), [{ id: 'a1', hit: 1 }]);
});

test('the animal you are recording is silent in the accompaniment', () => {
	const fired = new Set<string>();
	const due = dueAccompanimentHits([gallina, mucca], 2, 'a2', fired);
	assert.deepEqual(
		due.map((d) => d.id),
		['a1']
	);
});
