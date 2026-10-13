export const PEN = { y0: 50, y1: 65 };

/** Opening in the near fence, front-left bay beside the farmer. */
export const GATE_OUT = { x: 38.5, y: 67.5 };
export const GATE_IN = { x: 42, y: 62 };

/** White X doors on the red barn, back-right of the yard. */
export const BARN_DOOR = { x: 54, y: 49 };

/** Top-left of the fence, under the crashed ship. */
export const FENCE_LEFT = { x: 41, y: 47 };

/** Grass in front of the fence, where recorded animals wait after CONFERMA. */
export const PASTURE = { x0: 12, x1: 90, y0: 66.5, y1: 92 };

const FARMER_YARD = { x0: 16, x1: 34, y0: 48, y1: 72 };

export type YardGroup = 'speciale' | 'fattoria' | 'strano';
export type FarmerPose = 'idle' | 'yell' | 'run' | 'point';
export type Phase = 'piazza' | 'registra' | 'orchestra';

export type Point = { x: number; y: number };

export function clamp(n: number, a: number, b: number) {
	return Math.max(a, Math.min(b, n));
}

export function penXRange(y: number) {
	const t = clamp((y - PEN.y0) / (PEN.y1 - PEN.y0), 0, 1);
	return { x0: 42 + t * -6, x1: 62 + t * 3 };
}

export function inPen(x: number, y: number) {
	if (y < PEN.y0 || y > PEN.y1) return false;
	const { x0, x1 } = penXRange(y);
	return x >= x0 && x <= x1;
}

export function inPasture(x: number, y: number) {
	return x >= PASTURE.x0 && x <= PASTURE.x1 && y >= PASTURE.y0 && y <= PASTURE.y1;
}

export function pastureSpot(): Point {
	return {
		x: PASTURE.x0 + 6 + Math.random() * (PASTURE.x1 - PASTURE.x0 - 12),
		y: PASTURE.y0 + 2 + Math.random() * (PASTURE.y1 - PASTURE.y0 - 4)
	};
}

export function exitWaypoints(): Point[] {
	return [{ ...GATE_IN }, { ...GATE_OUT }];
}

export function returnWaypoints(): Point[] {
	return [{ ...GATE_OUT }, { ...GATE_IN }];
}

function same(a: Point, b: Point) {
	return a.x === b.x && a.y === b.y;
}

export function spawnDoor(group: YardGroup): Point {
	return group === 'strano' ? { ...FENCE_LEFT } : { ...BARN_DOOR };
}

export function enterWaypoints(group: YardGroup): Point[] {
	if (group === 'strano') return [{ x: 45, y: 54 }];
	return [{ x: 52, y: 56 }];
}

export function stepFarmer(
	farmer: { x: number; y: number; facing: number; pose: FarmerPose },
	dt: number,
	wall: number,
	phase: Phase
) {
	if (phase !== 'orchestra') return;
	const speed = farmer.pose === 'yell' ? 8 : 62;
	farmer.x += Math.sin(wall / 180) * (speed * dt) * farmer.facing;
	farmer.y += Math.cos(wall / 140) * (speed * 0.35 * dt);
	if (farmer.x < FARMER_YARD.x0 || farmer.x > FARMER_YARD.x1) farmer.facing *= -1;
	farmer.x = clamp(farmer.x, FARMER_YARD.x0, FARMER_YARD.x1);
	farmer.y = clamp(farmer.y, FARMER_YARD.y0, FARMER_YARD.y1);
}

export function enterSpeed(target: Point | undefined) {
	if (target && (same(target, GATE_IN) || same(target, GATE_OUT))) return 2.8;
	return 4.4;
}
