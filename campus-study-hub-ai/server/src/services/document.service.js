const fs = require('fs/promises');
const path = require('path');

async function extractText(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  if (ext === '.txt') return fs.readFile(filePath, 'utf8');
  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(await fs.readFile(filePath));
    return data.text || '';
  }
  if (ext === '.docx') {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  }
  if (ext === '.pptx' || ext === '.ppt') {
    // PPTX is a ZIP package; extract text from slide XML. Legacy .ppt extraction is not supported by this lightweight parser.
    if (ext === '.ppt') return '';
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(filePath);
    const slides = zip.getEntries().filter(entry => /^ppt\/slides\/slide\d+\.xml$/.test(entry.entryName));
    return slides.sort((a, b) => a.entryName.localeCompare(b.entryName)).map(entry => entry.getData().toString('utf8').replace(/<\/a:t>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')).join('\n');
  }
  return '';
}
module.exports = { extractText };
