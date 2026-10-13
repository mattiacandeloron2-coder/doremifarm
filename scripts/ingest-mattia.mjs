import { createRequire } from 'node:module';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');
const jpeg = require('jpeg-js');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dest = join(root, 'static');
const work = join(tmpdir(), 'doremifarm-mattia-art');
const cursorAssets = 'C:\\Users\\matti\\.cursor\\projects\\c-Users-matti-Desktop-DoReMiFarm\\assets';

mkdirSync(dest, { recursive: true });
mkdirSync(work, { recursive: true });

const STAGE = join(
	cursorAssets,
	'c__Users_matti_AppData_Roaming_Cursor_User_workspaceStorage_e81eff3d7c11d1c42db20ac06b8c469d_images_d692d0ce-8d20-4134-94d5-22328e975a09-90251d91-6a33-4745-b844-27a3611cab1a.jpg'
);
const SHEET = join(
	cursorAssets,
	'c__Users_matti_AppData_Roaming_Cursor_User_workspaceStorage_e81eff3d7c11d1c42db20ac06b8c469d_images_image-50d8c8f0-bc13-4bb5-bac2-426e4c1a93d9.jpg'
);

function loadRgba(path) {
	const buf = readFileSync(path);
	if (buf[0] === 0xff && buf[1] === 0xd8) {
		const decoded = jpeg.decode(buf, { useTArray: true });
		return { width: decoded.width, height: decoded.height, data: Buffer.from(decoded.data) };
	}
	return PNG.sync.read(buf);
}

function cloneImg(img) {
	return { width: img.width, height: img.height, data: Buffer.from(img.data) };
}

function luma(r, g, b) {
	return 0.299 * r + 0.587 * g + 0.114 * b;
}

function sat(r, g, b) {
	return Math.max(r, g, b) - Math.min(r, g, b);
}

function isPaint(r, g, b, a) {
	if (a < 16) return false;
	return sat(r, g, b) > 22 || luma(r, g, b) > 40;
}

/** Cream paper only — not cow/chicken white (those are neutral, not yellow). */
function isPaper(r, g, b) {
	const s = sat(r, g, b);
	const yellow = (r + g) / 2 - b;
	return r > 246 && g > 244 && b > 232 && b < 248 && yellow > 6 && s >= 6 && s <= 22;
}

function floodExterior(blocked, w, h) {
	const exterior = Buffer.alloc(w * h);
	const q = [];
	const enq = (x, y) => {
		if (x < 0 || y < 0 || x >= w || y >= h) return;
		const k = y * w + x;
		if (exterior[k] || blocked[k]) return;
		exterior[k] = 1;
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
		enq(x + 1, y);
		enq(x - 1, y);
		enq(x, y + 1);
		enq(x, y - 1);
	}
	return exterior;
}

function knockBeige(img) {
	const { width: w, height: h, data } = img;
	const paint = Buffer.alloc(w * h);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const i = (w * y + x) << 2;
			if (!isPaper(data[i], data[i + 1], data[i + 2])) paint[y * w + x] = 1;
		}
	}
	const exterior = floodExterior(paint, w, h);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			if (!exterior[y * w + x]) continue;
			const i = (w * y + x) << 2;
			data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0;
		}
	}
	return img;
}

function silhouette(img, foot = 10) {
	const { width: w, height: h, data } = img;
	const paint = Buffer.alloc(w * h);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const i = (w * y + x) << 2;
			if (isPaint(data[i], data[i + 1], data[i + 2], data[i + 3])) paint[y * w + x] = 1;
		}
	}
	const outsidePaint = floodExterior(paint, w, h);
	const keep = Buffer.alloc(w * h);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const k = y * w + x;
			if (paint[k] || !outsidePaint[k]) keep[k] = 1;
		}
	}
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			if (!paint[y * w + x]) continue;
			for (let dy = 1; dy <= foot; dy++) {
				const ny = y + dy;
				if (ny >= h) break;
				const i = (w * ny + x) << 2;
				if (isPaint(data[i], data[i + 1], data[i + 2], data[i + 3])) continue;
				keep[ny * w + x] = 1;
			}
		}
	}
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			if (keep[y * w + x]) continue;
			const i = (w * y + x) << 2;
			data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0;
		}
	}
	return img;
}

function crop(img, padRatio = 0.04) {
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

function slice(img, x0, y0, x1, y1) {
	const nw = x1 - x0;
	const nh = y1 - y0;
	const out = new PNG({ width: nw, height: nh });
	for (let y = 0; y < nh; y++) {
		for (let x = 0; x < nw; x++) {
			const sx = x0 + x;
			const sy = y0 + y;
			const si = (sy * img.width + sx) << 2;
			const di = (y * nw + x) << 2;
			out.data[di] = img.data[si];
			out.data[di + 1] = img.data[si + 1];
			out.data[di + 2] = img.data[si + 2];
			out.data[di + 3] = img.data[si + 3];
		}
	}
	return out;
}

function scale2x(img) {
	const { width: w, height: h, data } = img;
	const nw = w * 2;
	const nh = h * 2;
	const out = new PNG({ width: nw, height: nh });
	for (let y = 0; y < nh; y++) {
		const sy = (y + 0.5) / 2 - 0.5;
		const y0 = Math.max(0, Math.floor(sy));
		const y1 = Math.min(h - 1, y0 + 1);
		const fy = sy - y0;
		for (let x = 0; x < nw; x++) {
			const sx = (x + 0.5) / 2 - 0.5;
			const x0 = Math.max(0, Math.floor(sx));
			const x1 = Math.min(w - 1, x0 + 1);
			const fx = sx - x0;
			const i00 = (w * y0 + x0) << 2;
			const i10 = (w * y0 + x1) << 2;
			const i01 = (w * y1 + x0) << 2;
			const i11 = (w * y1 + x1) << 2;
			const di = (nw * y + x) << 2;
			for (let c = 0; c < 4; c++) {
				const v0 = data[i00 + c] * (1 - fx) + data[i10 + c] * fx;
				const v1 = data[i01 + c] * (1 - fx) + data[i11 + c] * fx;
				out.data[di + c] = Math.round(v0 * (1 - fy) + v1 * fy);
			}
		}
	}
	return out;
}

function writePng(img, name) {
	const png = img instanceof PNG ? img : new PNG({ width: img.width, height: img.height });
	if (!(img instanceof PNG)) png.data = Buffer.from(img.data);
	const tmpPath = join(work, name);
	writeFileSync(tmpPath, PNG.sync.write(png));
	try {
		copyFileSync(tmpPath, join(dest, name));
	} catch (err) {
		console.error('copy failed', name, err.code);
	}
	console.log(name, png.width + 'x' + png.height);
}

function prepare(img) {
	knockBeige(img);
	return crop(img, 0.02);
}

const stageDest = join(dest, 'farm-stage.png');
try {
	const existing = PNG.sync.read(readFileSync(stageDest));
	if (existing.width < 2000) {
		const stage = scale2x(loadRgba(STAGE));
		writePng(stage, 'farm-stage.png');
		writePng(stage, 'farm-stage-source.png');
	}
} catch {
	const stage = scale2x(loadRgba(STAGE));
	writePng(stage, 'farm-stage.png');
	writePng(stage, 'farm-stage-source.png');
}

const sheet = loadRgba(SHEET);
const cuts = [
	['farmer-idle.png', 0, 120, 158, 360],
	['farmer-yell.png', 155, 90, 320, 360],
	['animal-blippo.png', 328, 155, 488, 360],
	['animal-kicko.png', 486, 185, 628, 360],
	['animal-snarix.png', 626, 165, 838, 360],
	['animal-zizz.png', 838, 125, 1024, 360],
	['animal-maiale.png', 50, 400, 280, 565],
	['animal-mucca.png', 270, 380, 530, 565],
	['animal-gallina.png', 520, 380, 760, 575],
	['animal-pappagallo.png', 780, 380, 960, 575]
];

for (const [name, x0, y0, x1, y1] of cuts) {
	writePng(prepare(slice(sheet, x0, y0, x1, y1)), name);
}

writePng(cloneImg(loadRgba(join(work, 'animal-kicko.png'))), 'animal-kicko-run.png');
writePng(cloneImg(loadRgba(join(work, 'animal-kicko.png'))), 'animal-kicko-fall.png');
writePng(cloneImg(loadRgba(join(work, 'farmer-idle.png'))), 'farmer-run.png');
writePng(cloneImg(loadRgba(join(work, 'farmer-idle.png'))), 'farmer-point.png');
