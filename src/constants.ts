/**
 * constants for the {@link suggest2 | Suggest2 API}
 * for use in {@link LCSHMethods}
 */
export const [BROADER_URL, NARROWER_URL, RELATED_URL] = [
	'http://www.w3.org/2004/02/skos/core#broader',
	'http://www.w3.org/2004/02/skos/core#narrower',
	'http://www.w3.org/2004/02/skos/core#related',
];

export const PREF_LABEL = 'http://www.w3.org/2004/02/skos/core#prefLabel';

export const [SUBJECTS, SUBDIVISIONS] = [
	'http://id.loc.gov/authorities/subjects/collection_LCSHAuthorizedHeadings',
	'http://id.loc.gov/authorities/subjects/collection_Subdivisions',
];
