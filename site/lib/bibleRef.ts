/**
 * "John 3:16", "jn 3 16", "1 cor 13", "Yoweeri 2:13" → { book: 'JHN', chapter: 3, verse: 16 }.
 * Matches the translation's own book names first, then common English names and abbreviations.
 */
const ENGLISH: Record<string, string[]> = {
  GEN: ['genesis', 'gen', 'gn'], EXO: ['exodus', 'exod', 'ex'], LEV: ['leviticus', 'lev', 'lv'],
  NUM: ['numbers', 'num', 'nm'], DEU: ['deuteronomy', 'deut', 'dt'], JOS: ['joshua', 'josh'],
  JDG: ['judges', 'judg', 'jdg'], RUT: ['ruth', 'rth'], '1SA': ['1 samuel', '1 sam', '1sam', '1 sa'],
  '2SA': ['2 samuel', '2 sam', '2sam', '2 sa'], '1KI': ['1 kings', '1 kgs', '1kgs', '1 ki'], '2KI': ['2 kings', '2 kgs', '2kgs', '2 ki'],
  '1CH': ['1 chronicles', '1 chron', '1 chr'], '2CH': ['2 chronicles', '2 chron', '2 chr'], EZR: ['ezra', 'ezr'],
  NEH: ['nehemiah', 'neh'], EST: ['esther', 'esth', 'est'], JOB: ['job', 'jb'], PSA: ['psalms', 'psalm', 'ps', 'psa'],
  PRO: ['proverbs', 'prov', 'pr'], ECC: ['ecclesiastes', 'eccl', 'ecc'], SNG: ['song of solomon', 'song of songs', 'song', 'sos'],
  ISA: ['isaiah', 'isa', 'is'], JER: ['jeremiah', 'jer'], LAM: ['lamentations', 'lam'], EZK: ['ezekiel', 'ezek', 'ezk'],
  DAN: ['daniel', 'dan', 'dn'], HOS: ['hosea', 'hos'], JOL: ['joel', 'jl'], AMO: ['amos', 'am'], OBA: ['obadiah', 'obad', 'ob'],
  JON: ['jonah', 'jon'], MIC: ['micah', 'mic'], NAM: ['nahum', 'nah'], HAB: ['habakkuk', 'hab'], ZEP: ['zephaniah', 'zeph'],
  HAG: ['haggai', 'hag'], ZEC: ['zechariah', 'zech'], MAL: ['malachi', 'mal'], MAT: ['matthew', 'matt', 'mt'],
  MRK: ['mark', 'mk', 'mrk'], LUK: ['luke', 'lk'], JHN: ['john', 'jn', 'jhn'], ACT: ['acts', 'ac'], ROM: ['romans', 'rom', 'rm'],
  '1CO': ['1 corinthians', '1 cor', '1cor'], '2CO': ['2 corinthians', '2 cor', '2cor'], GAL: ['galatians', 'gal'],
  EPH: ['ephesians', 'eph'], PHP: ['philippians', 'phil', 'php'], COL: ['colossians', 'col'],
  '1TH': ['1 thessalonians', '1 thess', '1 th'], '2TH': ['2 thessalonians', '2 thess', '2 th'], '1TI': ['1 timothy', '1 tim'],
  '2TI': ['2 timothy', '2 tim'], TIT: ['titus', 'tit'], PHM: ['philemon', 'phlm', 'phm'], HEB: ['hebrews', 'heb'],
  JAS: ['james', 'jas', 'jm'], '1PE': ['1 peter', '1 pet', '1pe'], '2PE': ['2 peter', '2 pet', '2pe'],
  '1JN': ['1 john', '1 jn', '1jn'], '2JN': ['2 john', '2 jn', '2jn'], '3JN': ['3 john', '3 jn', '3jn'], JUD: ['jude', 'jud'],
  REV: ['revelation', 'revelations', 'rev', 'rv'],
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'.]/g, '')
    .replace(/^(i{1,3})\s+/, (m) => `${m.trim().length} `)
    .replace(/^([123])(?=[a-z])/, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();

export type ParsedRef = { book: string; chapter: number; verse?: number };

export function parseReference(input: string, books: { id: string; name: string; numberOfChapters: number }[]): ParsedRef | null {
  const m = norm(input).match(/^(.+?)\s*(\d{1,3})(?:\s*[:.\s]\s*(\d{1,3}))?$/);
  if (!m) return null;
  const [, rawName, ch, vs] = m;
  const name = rawName.trim();
  if (!name) return null;
  const candidates: [string, string][] = [];
  for (const b of books) candidates.push([norm(b.name), b.id]);
  for (const [id, names] of Object.entries(ENGLISH)) for (const n of names) candidates.push([n, id]);
  const exact = candidates.find(([n]) => n === name);
  const prefix = name.length >= 3 ? candidates.find(([n]) => n.startsWith(name)) : undefined;
  const id = (exact ?? prefix)?.[1];
  const book = books.find((b) => b.id === id);
  if (!book) return null;
  const chapter = Math.min(Math.max(Number(ch), 1), book.numberOfChapters);
  return { book: book.id, chapter, verse: vs ? Number(vs) : undefined };
}
