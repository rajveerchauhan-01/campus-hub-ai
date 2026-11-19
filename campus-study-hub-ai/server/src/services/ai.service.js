const { GoogleGenAI } = require('@google/genai');
const AppError = require('../utils/AppError');

function getClient() {
  if (!process.env.GEMINI_API_KEY) throw new AppError('Gemini is not configured. Add GEMINI_API_KEY to server/.env.', 503, 'AI_NOT_CONFIGURED');
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}
async function generate(prompt) {
  const ai = getClient();
  const response = await ai.models.generateContent({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash', contents: prompt });
  return response.text || '';
}
function parseJson(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try { return JSON.parse(cleaned); } catch { const start = cleaned.indexOf('{'); const end = cleaned.lastIndexOf('}'); if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)); throw new Error('AI returned an unexpected format. Please try again.'); }
}
async function summarize(text) { return generate(`Summarize the following academic study material. Use headings, concise bullet points, definitions, and a short revision takeaway. Do not invent facts.\n\n${text.slice(0, 45000)}`); }
async function explain(text, concept) { return generate(`You are a patient college tutor. Explain the concept "${concept}" in simple language, then give an analogy and one example. Use only the following source when relevant and say when it does not contain enough information.\n\nSOURCE:\n${text.slice(0, 35000)}`); }
async function chat(text, history, question) {
  const transcript = (history || []).slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');
  return generate(`Answer the student's question using the supplied study material. Be clear and educational. If the material does not answer the question, say so.\n\nSTUDY MATERIAL:\n${text.slice(0, 30000)}\n\nCONVERSATION:\n${transcript}\n\nSTUDENT QUESTION: ${question}`);
}
async function makeQuiz(text, count = 8, difficulty = 'mixed') {
  const raw = await generate(`Create ${Math.min(20, Math.max(3, Number(count) || 8))} multiple-choice quiz questions from the material. Difficulty: ${difficulty}. Return ONLY valid JSON: {"title":"...","questions":[{"question":"...","options":["A...","B...","C...","D..."],"correctAnswer":"exact option text","explanation":"...","difficulty":"easy|medium|hard"}]}.\n\nMATERIAL:\n${text.slice(0, 35000)}`);
  return parseJson(raw);
}
async function makeFlashcards(text, count = 10) {
  const raw = await generate(`Create ${Math.min(30, Math.max(3, Number(count) || 10))} useful revision flashcards from this material. Return ONLY valid JSON: {"title":"...","cards":[{"front":"Question or term","back":"Concise answer"}]}.\n\nMATERIAL:\n${text.slice(0, 35000)}`);
  return parseJson(raw);
}
async function importantTopics(text) { return generate(`Identify the most important topics in this academic material. Return a ranked list with a one-sentence reason and suggested revision priority. Do not claim exam certainty.\n\n${text.slice(0, 35000)}`); }
async function studyRecommendations(profile, resources) { return generate(`Act as a thoughtful academic study coach. Based on this student profile and the available campus resources, recommend a realistic 7-day study plan, priority topics, and 3 resources to open next. Avoid claiming exam predictions.\nSTUDENT: ${JSON.stringify(profile)}\nAVAILABLE RESOURCES: ${JSON.stringify(resources).slice(0, 12000)}\nReturn clear headings and actionable steps.`); }
module.exports = { summarize, explain, chat, makeQuiz, makeFlashcards, importantTopics, studyRecommendations };
