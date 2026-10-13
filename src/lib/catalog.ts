export const KEYS = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'] as const;

export type AnimalId =
	| 'pappagallo'
	| 'gallina'
	| 'mucca'
	| 'maiale'
	| 'blippo'
	| 'kicko'
	| 'snarix'
	| 'zizz'
	| 'piano';

export type AnimalKind = {
	id: AnimalId;
	name: string;
	group: 'speciale' | 'fattoria' | 'strano';
	color: string;
	hint: string;
	/** Sprite box as percent of the yard. */
	w: number;
	h: number;
};

export type AnimalPose = 'idle' | 'run' | 'fall';

export function animalSprite(id: AnimalId, pose: AnimalPose = 'idle') {
	if (id === 'kicko' && pose === 'fall') return '/animal-kicko-fall.png?v=15';
	if (id === 'kicko' && pose === 'run') return '/animal-kicko-run.png?v=15';
	return `/animal-${id}.png?v=15`;
}

export const KINDS: AnimalKind[] = [
	{
		id: 'pappagallo',
		name: 'Pappagallo',
		group: 'speciale',
		color: '#c4452d',
		hint: 'carica o registra la tua voce',
		w: 5.7,
		h: 6.4
	},
	{
		id: 'gallina',
		name: 'Gallina',
		group: 'fattoria',
		color: '#1c1916',
		hint: 'verso da gallina',
		w: 6.4,
		h: 6.8
	},
	{
		id: 'mucca',
		name: 'Mucca',
		group: 'fattoria',
		color: '#f4efe6',
		hint: 'verso da mucca',
		w: 9.4,
		h: 7.1
	},
	{
		id: 'maiale',
		name: 'Maiale',
		group: 'fattoria',
		color: '#e8a39a',
		hint: 'verso da maiale',
		w: 9.0,
		h: 5.4
	},
	{
		id: 'blippo',
		name: 'Blippo',
		group: 'strano',
		color: '#6b3fa0',
		hint: 'synth storto',
		w: 8.0,
		h: 9.2
	},
	{
		id: 'kicko',
		name: 'Kicko',
		group: 'strano',
		color: '#3a3a3a',
		hint: 'kick metallico',
		w: 7.4,
		h: 7.7
	},
	{
		id: 'snarix',
		name: 'Snarix',
		group: 'strano',
		color: '#d45a12',
		hint: 'snare alieno',
		w: 10.6,
		h: 8.3
	},
	{
		id: 'zizz',
		name: 'Zizz',
		group: 'strano',
		color: '#4aa7d4',
		hint: 'elettrico strano',
		w: 9.9,
		h: 10.6
	},
	{
		id: 'piano',
		name: 'Piano',
		group: 'speciale',
		color: '#c4452d',
		hint: 'linee melodiche',
		w: 10.5,
		h: 6.1
	}
];

export function kindById(id: AnimalId): AnimalKind {
	const kind = KINDS.find((k) => k.id === id);
	if (!kind) throw new Error(`unknown animal ${id}`);
	return kind;
}
