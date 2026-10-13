import { createRequire } from 'node:module';
import { join } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');
let jpeg;
try {
	jpeg = require('jpeg-js');
} catch {
	jpeg = null;
}

const assets = process.argv[2];
const dest = process.argv[3];
if (!assets || !dest) {
	console.error('usage: node prep-art.mjs <assetsDir> <destDir>');
	process.exit(1);
}

mkdirSync(dest, { recursive: true });

function loadRgba(path) {
	const buf = readFileSync(path);
	if (buf[0] === 0xff && buf[1] === 0xd8) {
		if (!jpeg) throw new Error(`jpeg-js missing for ${path}`);
		const decoded = jpeg.decode(buf, { useTArray: true });
		return { width: decoded.width, height: decoded.height, data: decoded.data };
	}
	return PNG.sync.read(buf);
}

function distTo(r, g, b, corner) {
	return Math.hypot(r - corner[0], g - corner[1], b - corner[2]);
}

function isMagenta(r, g, b, a, corner) {
	if (a < 16) return true;
	return distTo(r, g, b, corner) < 28;
}

function punchHoles(img, corner) {
	const { width: w, height: h, data } = img;
	for (let i = 0; i < data.length; i += 4) {
		if (data[i + 3] < 16) continue;
		if (distTo(data[i], data[i + 1], data[i + 2], corner) < 32) {
			data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0;
		}
	}
	return img;
}

function cutMagenta(img, holes = false) {
	const { width: w, height: h, data } = img;
	const idx = (x, y) => (w * y + x) << 2;
	const c0 = [data[0], data[1], data[2]];
	const seen = new Uint8Array(w * h);
	const q = [];
	const enq = (x, y) => {
		if (x < 0 || y < 0 || x >= w || y >= h) return;
		const k = y * w + x;
		if (seen[k]) return;
		const i = idx(x, y);
		if (!isMagenta(data[i], data[i + 1], data[i + 2], data[i + 3], c0)) return;
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
	while (q.length) {
		const k = q.pop();
		const x = k % w;
		const y = (k / w) | 0;
		const i = idx(x, y);
		data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0;
		enq(x + 1, y);
		enq(x - 1, y);
		enq(x, y + 1);
		enq(x, y - 1);
	}
	if (holes) punchHoles(img, c0);
	return img;
}

function crop(img, padRatio = 0.06) {
	const { width: w, height: h, data } = img;
	let x0 = w;
	let y0 = h;
	let x1 = 0;
	let y1 = 0;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			if (data[(w * y + x) * 4 + 3] < 16) continue;
			if (x < x0) x0 = x;
			if (y < y0) y0 = y;
			if (x > x1) x1 = x;
			if (y > y1) y1 = y;
		}
	}
	if (x1 < x0) return img;
	const pad = Math.round(Math.max(w, h) * padRatio);
	x0 = Math.max(0, x0 - pad);
	y0 = Math.max(0, y0 - pad);
	x1 = Math.min(w - 1, x1 + pad);
	y1 = Math.min(h - 1, y1 + pad);
	const nw = x1 - x0 + 1;
	const nh = y1 - y0 + 1;
	const out = new PNG({ width: nw, height: nh });
	for (let y = 0; y < nh; y++) {
		for (let x = 0; x < nw; x++) {
			const si = ((y0 + y) * w + (x0 + x)) << 2;
			const di = (y * nw + x) << 2;
			out.data[di] = data[si];
			out.data[di + 1] = data[si + 1];
			out.data[di + 2] = data[si + 2];
			out.data[di + 3] = data[si + 3];
		}
	}
	return out;
}

function toPng(img) {
	const png = img instanceof PNG ? img : new PNG({ width: img.width, height: img.height });
	if (!(img instanceof PNG)) png.data = Buffer.from(img.data);
	return png;
}

function writePng(img, path) {
	writeFileSync(path, PNG.sync.write(toPng(img)));
}

const jobs = [
	['farm-stage-cinematic.png', 'farm-stage.png', false],
	['farm-stage-cinematic.png', 'farm-stage-source.png', false],
	['farmer-idle-graphic2.png', 'farmer-idle.png', true, true],
	['farmer-yell-graphic.png', 'farmer-yell.png', true, true],
	['farmer-run-graphic.png', 'farmer-run.png', true, true],
	['farmer-point-graphic.png', 'farmer-point.png', true, true],
	['animal-gallina-cinematic.png', 'animal-gallina.png', true],
	['animal-mucca-cinematic.png', 'animal-mucca.png', true],
	['animal-maiale-cinematic.png', 'animal-maiale.png', true],
	['animal-pappagallo-cinematic.png', 'animal-pappagallo.png', true],
	['animal-blippo-cinematic.png', 'animal-blippo.png', true],
	['animal-kicko-cinematic.png', 'animal-kicko.png', true],
	['animal-kicko-run-cinematic.png', 'animal-kicko-run.png', true],
	['animal-kicko-fall-cinematic.png', 'animal-kicko-fall.png', true],
	['animal-snarix-cinematic.png', 'animal-snarix.png', true],
	['animal-zizz-cinematic.png', 'animal-zizz.png', true]
];

for (const [srcName, destName, cut, holes] of jobs) {
	const src = join(assets, srcName);
	const out = join(dest, destName);
	let img = loadRgba(src);
	if (cut) {
		img = cutMagenta(img, holes);
		img = crop(img);
	}
	writePng(img, out);
	console.log(cut ? 'cut' : 'copy', destName);
}
