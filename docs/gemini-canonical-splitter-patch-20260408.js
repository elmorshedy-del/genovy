// Gemini Canonical Splitter Patch
// Date: 2026-04-08
//
// Target file:
// /Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/genereviewsPipeline.js
//
// Replace the splitter block starting at:
//   export function splitSentences(text) {
// and ending after:
//   export function splitSentenceEntries(text, baseOffset = 0) { ... }
//
// Keep the functions below this block unchanged:
// - splitParagraphEntries
// - buildClinicalTextStructure
// - buildClinicalTextStructureFromSections

export function splitSentences(text) {
  return splitSentenceEntries(text).map((entry) => entry.text);
}

export function splitParagraphs(text) {
  return String(text || '')
    .replace(/\n{3,}/g, '\n\n')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

const SENTENCE_BOUNDARY_PATTERN = /(?<=[.!?])\s+(?=[A-Z0-9])/g;
const NON_TERMINAL_ABBREVIATION_PATTERN =
  /(?:\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|No|Fig|Eq|Ref)\.|(?:[A-Z]\.){2,})$/;
const NON_TERMINAL_ABBREVIATION_MAX_WORDS = 4;

function shouldMergeWithNextSentence(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return false;
  if (!NON_TERMINAL_ABBREVIATION_PATTERN.test(trimmed)) return false;
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  return wordCount <= NON_TERMINAL_ABBREVIATION_MAX_WORDS;
}

function mergeAbbreviationSplitEntries(source, rawEntries, baseOffset) {
  const mergedEntries = [];

  for (let index = 0; index < rawEntries.length; index += 1) {
    let start = rawEntries[index].char_start - baseOffset;
    let end = rawEntries[index].char_end - baseOffset;
    let text = rawEntries[index].text;

    while (index < rawEntries.length - 1 && shouldMergeWithNextSentence(text)) {
      const nextEntry = rawEntries[index + 1];
      end = nextEntry.char_end - baseOffset;
      text = source.slice(start, end).trim();
      index += 1;
    }

    mergedEntries.push({
      text,
      char_start: baseOffset + start,
      char_end: baseOffset + end
    });
  }

  return mergedEntries.map((entry, mergeIndex) => ({
    sentence_id: `s${mergeIndex + 1}`,
    sentence_index: mergeIndex + 1,
    text: entry.text,
    char_start: entry.char_start,
    char_end: entry.char_end
  }));
}

export function splitSentenceEntries(text, baseOffset = 0) {
  const source = String(text || '');
  const rawEntries = [];
  let sliceStart = 0;

  function pushSlice(sliceEnd) {
    const rawSlice = source.slice(sliceStart, sliceEnd);
    if (!rawSlice) return;
    const leadingWhitespace = rawSlice.match(/^\s*/)?.[0].length || 0;
    const trailingWhitespace = rawSlice.match(/\s*$/)?.[0].length || 0;
    const trimmedStart = sliceStart + leadingWhitespace;
    const trimmedEnd = sliceEnd - trailingWhitespace;
    if (trimmedEnd <= trimmedStart) return;
    rawEntries.push({
      text: source.slice(trimmedStart, trimmedEnd),
      char_start: baseOffset + trimmedStart,
      char_end: baseOffset + trimmedEnd
    });
  }

  for (const match of source.matchAll(SENTENCE_BOUNDARY_PATTERN)) {
    pushSlice(match.index);
    sliceStart = match.index + match[0].length;
  }
  pushSlice(source.length);

  return mergeAbbreviationSplitEntries(source, rawEntries, baseOffset);
}
