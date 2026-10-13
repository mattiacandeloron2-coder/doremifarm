import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');
const fs = require('node:fs');

const root = join(import.meta.dirname, '..');
const srcPath = join(root, 'static', 'farm-stage-source.png');
const destPath = join(root, 'static', 'farm-stage.png');

const png = PNG.sync.read(fs.readFileSync(srcPath));
const { width: w, height: h, data } = png;
const idx = (x, y) => (w * y + x) << 2;

function pix(x, y) {
	const i = idx(x, y);
	return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

function setPix(x, y, r, g, b, a = 255) {
	const i = idx(x, y);
	data[i] = r;
	data[i + 1] = g;
	data[i + 2] = b;
	data[i + 3] = a;
}

function isGrass(r, g, b) {
	return g > r + 4 && g > b && g > 40;
}

function lerp(a, b, t) {
	return a + (b - a) * t;
}

function sampleGrass(x, y) {
	const tries = [
		[x, y - 24],
		[x - 3, y - 20],
		[x + 5, y - 18],
		[x, y + 20],
		[x + 8, y - 14],
		[x - 8, y + 12]
	];
	for (const [sx, sy] of tries) {
		if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
		const [r, g, b, a] = pix(sx, sy);
		if (a > 16 && isGrass(r, g, b)) return [r, g, b];
	}
	const dither = (x * 13 + y * 7) % 4;
	if (dither === 0) return [74, 132, 48];
	if (dither === 1) return [92, 154, 56];
	if (dither === 2) return [58, 112, 38];
	return [84, 148, 52];
}

/** First bay of the near fence: between the corner post and the next post. */
const x0 = 468;
const x1 = 526;

for (let x = x0; x <= x1; x++) {
	const t = (x - x0) / (x1 - x0);
	const yTop = Math.round(lerp(478, 508, t));
	const yBot = Math.round(lerp(516, 546, t));
	for (let y = yTop; y <= yBot; y++) {
		const [nr, ng, nb] = sampleGrass(x, y);
		setPix(x, y, nr, ng, nb);
	}
}

fs.writeFileSync(destPath, PNG.sync.write(png));
console.log('opened fence bay', destPath);
