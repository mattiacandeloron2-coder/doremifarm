export type Sequence = {
	id: string;
	hits: number[];
	notes?: number[];
	holds?: number[];
	sequenceLength: number;
};

export type DueHit = {
	id: string;
	hit: number;
	note?: number;
	hold?: number;
};

export function dueAccompanimentHits(
	sequences: Sequence[],
	elapsed: number,
	recordingId: string | null,
	fired: Set<string>
): DueHit[] {
	const others = sequences.filter((s) => s.id !== recordingId && s.hits.length > 0);
	if (others.length === 0) return [];
	const loopLength = Math.max(4, ...others.map((s) => s.sequenceLength || 4));
	const loopIndex = Math.floor(elapsed / loopLength);
	const t = elapsed % loopLength;
	const due: DueHit[] = [];
	for (const animal of others) {
		for (let i = 0; i < animal.hits.length; i++) {
			const hit = animal.hits[i];
			const stamp = `${loopIndex}:${animal.id}:${hit.toFixed(3)}`;
			if (t >= hit && !fired.has(stamp)) {
				fired.add(stamp);
				const note = animal.notes?.[i];
				const hold = animal.holds?.[i];
				due.push({
					id: animal.id,
					hit,
					...(note == null ? {} : { note }),
					...(hold == null ? {} : { hold })
				});
			}
		}
	}
	return due;
}
