import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');
const fs = require('node:fs');

function dist(r, g, b, r2, g2, b2) {
	return Math.hypot(r - r2, g - g2, b - b2);
}

function cutout(input, output) {
	const png = PNG.sync.read(fs.readFileSync(input));
	const { width: w, height: h, data } = png;
	const idx = (x, y) => (w * y + x) << 2;

	const i0 = idx(0, 0);
	const i1 = idx(Math.min(12, w - 1), 0);
	const c0 = [data[i0], data[i0 + 1], data[i0 + 2]];
	const c1 = [data[i1], data[i1 + 1], data[i1 + 2]];

	const isMagenta = (r, g, b) => r >= 180 && b >= 80 && g < r * 0.55 && b > g && r - g >= 70;

	const isBg = (x, y) => {
		const i = idx(x, y);
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];
		const a = data[i + 3];
		if (a < 16) return true;
		if (isMagenta(r, g, b)) return true;
		if (dist(r, g, b, c0[0], c0[1], c0[2]) < 48) return true;
		if (dist(r, g, b, c1[0], c1[1], c1[2]) < 48) return true;
		const mx = Math.max(r, g, b);
		const mn = Math.min(r, g, b);
		const luma = (r * 30 + g * 59 + b * 11) / 100;
		return luma >= 175 && mx - mn <= 28;
	};

	const seen = new Uint8Array(w * h);
	const q = [];
	const enq = (x, y) => {
		if (x < 0 || y < 0 || x >= w || y >= h) return;
		const k = y * w + x;
		if (seen[k]) return;
		if (!isBg(x, y)) return;
		seen[k] = 1;
		q.push(k);
	};

	for (let x = 0; x < w; x++) {
		enq(x, 0);
		enq(x, h - 1);
	}
	for (let y = 0; y < h; y++) {
		enq(0, y);
		enq(w - 1, y);
	}

	const n4 = [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1]
	];
	while (q.length) {
		const k = q.pop();
		const x = k % w;
		const y = (k / w) | 0;
		const i = idx(x, y);
		data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0;
		for (const [dx, dy] of n4) enq(x + dx, y + dy);
	}

	const kill = [];
	const markPaleEdge = (minLuma, maxSat) => {
		kill.length = 0;
		for (let y = 1; y < h - 1; y++) {
			for (let x = 1; x < w - 1; x++) {
				const i = idx(x, y);
				if (data[i + 3] < 16) continue;
				let near = false;
				for (const [dx, dy] of n4) {
					if (data[idx(x + dx, y + dy) + 3] < 16) {
						near = true;
						break;
					}
				}
				if (!near) continue;
				const r = data[i];
				const g = data[i + 1];
				const b = data[i + 2];
				const mx = Math.max(r, g, b);
				const mn = Math.min(r, g, b);
				const luma = (r * 30 + g * 59 + b * 11) / 100;
				if (luma >= minLuma && mx - mn <= maxSat) kill.push(i);
				else if (luma >= 215) kill.push(i);
			}
		}
		for (const i of kill) data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0;
	};

	markPaleEdge(150, 45);
	markPaleEdge(130, 40);

	kill.length = 0;
	for (let y = 1; y < h - 1; y++) {
		for (let x = 1; x < w - 1; x++) {
			const i = idx(x, y);
			if (data[i + 3] < 16) continue;
			let clear = 0;
			for (const [dx, dy] of n4) {
				if (data[idx(x + dx, y + dy) + 3] < 16) clear++;
			}
			if (clear >= 3) kill.push(i);
		}
	}
	for (const i of kill) data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0;

	for (let y = 1; y < h - 1; y++) {
		for (let x = 1; x < w - 1; x++) {
			const i = idx(x, y);
			if (data[i + 3] < 16) continue;
			let edge = false;
			for (const [dx, dy] of n4) {
				if (data[idx(x + dx, y + dy) + 3] < 16) {
					edge = true;
					break;
				}
			}
			if (!edge) continue;
			data[i] = (data[i] * 9) / 10;
			data[i + 1] = (data[i + 1] * 9) / 10;
			data[i + 2] = (data[i + 2] * 9) / 10;
			data[i + 3] = 255;
		}
	}

	fs.writeFileSync(output, PNG.sync.write(png));
}

const assets = process.argv[2];
const dest = process.argv[3];
if (!assets || !dest) {
	console.error('usage: node cutout.mjs <assetsDir> <destDir>');
	process.exit(1);
}
const names = fs
	.readdirSync(assets)
	.filter(
		(name) =>
			name.endsWith('.png') && (name.startsWith('animal-') || name.startsWith('farmer-'))
	);
for (const name of names) {
	cutout(join(assets, name), join(dest, name));
	console.log('cut', name);
}
