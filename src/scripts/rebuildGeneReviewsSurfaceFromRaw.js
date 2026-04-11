import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildClinicalTextStructure,
  buildClinicalTextStructureFromSections,
  ensureDir,
  extractNbkId,
  parseArgs,
  parseGeneReviewsChapterHtml,
  writeJson,
  writeText
} from '../lib/genereviewsPipeline.js';

function inferOutputStem(rawHtmlPath, parsed, explicitStem) {
  if (explicitStem) return String(explicitStem).trim();
  const parsedNbkId = extractNbkId(parsed?.resolvedNbkId || '');
  if (parsedNbkId) return parsedNbkId;
  const baseName = path.basename(rawHtmlPath).replace(/_raw\.html$/i, '').replace(/\.html$/i, '');
  return baseName || 'NBK_UNKNOWN';
}

function flattenSentenceIndex(structure) {
  const sentenceIndex = [];
  for (const paragraph of structure?.paragraphs || []) {
    for (const sentence of paragraph?.sentences || []) {
      sentenceIndex.push({
        sentence_id: sentence.sentence_id,
        section: sentence.section_heading || paragraph.section_heading || '',
        section_id: sentence.section_id || paragraph.section_id || '',
        paragraph_id: paragraph.paragraph_id,
        text: sentence.text
      });
    }
  }
  return sentenceIndex;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const rawHtmlPath = String(flags.rawHtml || flags.raw || '').trim();
  if (!rawHtmlPath) {
    throw new Error('Pass --rawHtml /abs/path/to/NBKxxxx_raw.html');
  }

  const outputDir = String(flags.outputDir || flags.outdir || path.dirname(rawHtmlPath)).trim();
  const mondoId = flags.mondoId ? String(flags.mondoId).trim() : null;
  const sectionProfile = String(flags.sectionProfile || 'expanded').trim();
  const rawHtml = await fs.readFile(rawHtmlPath, 'utf8');

  const parsed = parseGeneReviewsChapterHtml(
    {
      nbkId: flags.nbkId || '',
      chapterTitle: flags.chapterTitle || ''
    },
    rawHtml,
    { sectionProfile }
  );
  const structure =
    Array.isArray(parsed.clinicalSections) && parsed.clinicalSections.length
      ? buildClinicalTextStructureFromSections(parsed.clinicalSections)
      : buildClinicalTextStructure(parsed.clinicalText);

  const outputStem = inferOutputStem(rawHtmlPath, parsed, flags.outputStem);
  await ensureDir(outputDir);

  const structurePayload = {
    created_at: new Date().toISOString(),
    nbk_id: parsed.resolvedNbkId || null,
    chapter_title: parsed.chapterTitle,
    provenance_url: parsed.provenanceUrl,
    heading_inventory: parsed.headingInventory || [],
    chapter_domains: parsed.chapterDomains || [],
    source_surface_profile: sectionProfile,
    ...structure
  };
  const tablesPayload = {
    created_at: new Date().toISOString(),
    nbk_id: parsed.resolvedNbkId || null,
    chapter_title: parsed.chapterTitle,
    tables: parsed.tables || [],
    source_surface_profile: sectionProfile
  };
  const fetchMetaPayload = {
    created_at: new Date().toISOString(),
    nbk_id: parsed.resolvedNbkId || null,
    chapter_title: parsed.chapterTitle,
    provenance_url: parsed.provenanceUrl,
    prose_chars: parsed.clinicalText.length,
    raw_html_chars: parsed.rawHtml.length,
    table_count: Array.isArray(parsed.tables) ? parsed.tables.length : 0,
    source_surface_profile: sectionProfile,
    rebuilt_from_raw_html: rawHtmlPath
  };
  const wrapperPayload = {
    chapter: {
      nbk_id: parsed.resolvedNbkId || null,
      title: parsed.chapterTitle,
      mondo_id: mondoId,
      mode: 'discovery',
      source: 'GeneReviews',
      source_url: parsed.provenanceUrl || null,
      source_date: null
    },
    sentence_index: flattenSentenceIndex(structure)
  };

  await writeText(path.join(outputDir, `${outputStem}_clinical_text.txt`), parsed.clinicalText);
  await writeJson(path.join(outputDir, `${outputStem}_clinical_structure.json`), structurePayload);
  await writeJson(path.join(outputDir, `${outputStem}_tables.json`), tablesPayload);
  await writeJson(path.join(outputDir, `${outputStem}_fetch_meta.json`), fetchMetaPayload);
  await writeJson(path.join(outputDir, `${outputStem}_opus_input.json`), wrapperPayload);

  console.log(
    JSON.stringify(
      {
        output_dir: outputDir,
        output_stem: outputStem,
        nbk_id: parsed.resolvedNbkId || null,
        chapter_title: parsed.chapterTitle,
        section_profile: sectionProfile,
        section_count: structure.section_count || 0,
        paragraph_count: structure.paragraph_count || 0,
        sentence_count: structure.sentence_count || 0
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
