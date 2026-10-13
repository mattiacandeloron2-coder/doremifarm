import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	BARN_DOOR,
	FENCE_LEFT,
	GATE_IN,
	GATE_OUT,
	PEN,
	enterWaypoints,
	exitWaypoints,
	inPasture,
	inPen,
	pastureSpot,
	penXRange,
	returnWaypoints,
	spawnDoor,
	stepFarmer
} from './yard.ts';

test('idle farmer stays planted', () => {
	const farmer = { x: 28, y: 56, facing: 1 as const, pose: 'idle' as const };
	for (let i = 0; i < 40; i++) {
		stepFarmer(farmer, 0.016, 1000 + i * 16, 'piazza');
	}
	assert.equal(farmer.x, 28);
	assert.equal(farmer.y, 56);
	assert.equal(farmer.facing, 1);
});

test('pointing farmer stays planted beside the pen', () => {
	const farmer = { x: 28, y: 56, facing: 1 as const, pose: 'point' as const };
	for (let i = 0; i < 40; i++) {
		stepFarmer(farmer, 0.016, 1000 + i * 16, 'piazza');
	}
	assert.equal(farmer.x, 28);
	assert.equal(farmer.y, 56);
	assert.equal(farmer.facing, 1);
	assert.equal(farmer.pose, 'point');
});

test('farm animals appear at the barn door, aliens at the top-left fence', () => {
	assert.deepEqual(spawnDoor('fattoria'), BARN_DOOR);
	assert.deepEqual(spawnDoor('speciale'), BARN_DOOR);
	assert.deepEqual(spawnDoor('strano'), FENCE_LEFT);
	assert.ok(BARN_DOOR.x > 50, 'barn door is on the right, under the red barn');
	assert.ok(BARN_DOOR.y < 52, 'barn door sits at the back of the yard');
	assert.ok(FENCE_LEFT.x < 45, 'ship exit is the left side of the fence');
	assert.ok(FENCE_LEFT.y <= PEN.y0, 'ship exit is the top of the fence');
	assert.ok(FENCE_LEFT.x < BARN_DOOR.x);
});

test('enter path walks into the pen, not around the front gate', () => {
	for (const group of ['fattoria', 'strano', 'speciale'] as const) {
		const path = enterWaypoints(group);
		assert.ok(path.length >= 1);
		assert.notEqual(path[0]?.x, GATE_OUT.x);
		assert.notEqual(path.at(-1)?.x, GATE_IN.x);
		const last = path.at(-1)!;
		assert.equal(inPen(last.x, last.y), true, `${group} should finish inside the pen`);
	}
});

test('pen x-range stays isometric', () => {
	const back = penXRange(PEN.y0);
	const front = penXRange(PEN.y1);
	assert.ok(front.x1 > back.x1);
	assert.equal(inPen(50, 58), true);
	assert.equal(inPen(50, 90), false);
});

test('exit path leaves through the same opening to the front grass', () => {
	const path = exitWaypoints();
	assert.equal(path[0]?.x, GATE_IN.x);
	assert.equal(path[1]?.x, GATE_OUT.x);
	assert.equal(inPen(GATE_OUT.x, GATE_OUT.y), false);
	assert.equal(inPen(GATE_IN.x, GATE_IN.y), true);
});

test('return path comes back through the opening', () => {
	const path = returnWaypoints();
	assert.equal(path[0]?.x, GATE_OUT.x);
	assert.equal(path[1]?.x, GATE_IN.x);
	assert.equal(inPen(path[0].x, path[0].y), false);
	assert.equal(inPen(path[1].x, path[1].y), true);
});

test('pasture sits in front of the fence, not in the pen', () => {
	assert.equal(inPasture(GATE_OUT.x, GATE_OUT.y), true);
	assert.equal(inPen(50, 86), false);
	assert.equal(inPasture(50, 86), true);
	assert.equal(inPasture(50, 58), false);
	for (let i = 0; i < 20; i++) {
		const spot = pastureSpot();
		assert.equal(inPasture(spot.x, spot.y), true);
		assert.equal(inPen(spot.x, spot.y), false);
	}
});
