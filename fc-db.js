const fs = require("fs");
const path = require("path");
const { nextReview, updateEF } = require("./fc-sm2");

const DB_PATH = path.join(
  process.env.VERCEL ? "/tmp" : __dirname,
  "flashcards.json"
);

let state = { nextId: { sets: 1, cards: 1, reviews: 1 }, sets: {}, cards: {}, reviews: {} };

function save() {
  try { fs.writeFileSync(DB_PATH, JSON.stringify(state)); } catch (e) {}
}

async function initDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    state = JSON.parse(raw);
  } catch {}
  save();
}

function now() {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}

function createSet(title, source) {
  const id = state.nextId.sets++;
  const ts = now();
  state.sets[id] = { id, title: title || "Untitled", source: source || "", created_at: ts, updated_at: ts };
  save();
  return id;
}

function getSets() {
  return Object.values(state.sets).map(s => ({
    ...s,
    card_count: Object.values(state.cards).filter(c => c.set_id === s.id).length,
  })).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

function getSet(setId) {
  return state.sets[setId] || null;
}

function deleteSet(setId) {
  delete state.sets[setId];
  for (const [cid, card] of Object.entries(state.cards)) {
    if (card.set_id === setId) delete state.cards[cid];
  }
  for (const [rid, rev] of Object.entries(state.reviews)) {
    if (!state.cards[rev.card_id]) delete state.reviews[rid];
  }
  save();
}

function addCards(setId, cards) {
  const ts = now();
  for (const card of cards) {
    const cid = state.nextId.cards++;
    const ct = card.card_type || "term";
    state.cards[cid] = { id: cid, set_id: setId, term: card.term, definition: card.definition, card_type: ct, created_at: ts };
    const rid = state.nextId.reviews++;
    state.reviews[rid] = { id: rid, card_id: cid, ease_factor: 2.5, interval_seconds: 0, repetitions: 0, last_review: null, next_review: ts };
  }
  state.sets[setId].updated_at = ts;
  save();
}

function getCards(setId) {
  return Object.values(state.cards).filter(c => c.set_id === setId).map(c => {
    const r = Object.values(state.reviews).find(rv => rv.card_id === c.id) || { ease_factor: 2.5, interval_seconds: 0, repetitions: 0, last_review: null, next_review: c.created_at };
    return { ...c, ...r };
  }).sort((a, b) => a.id - b.id);
}

function getDueCards(setId) {
  const n = now();
  return Object.values(state.cards).filter(c => c.set_id === setId).map(c => {
    const r = Object.values(state.reviews).find(rv => rv.card_id === c.id);
    if (!r) return null;
    if (r.next_review > n) return null;
    return { ...c, ...r, review_id: r.id };
  }).filter(Boolean).sort((a, b) => a.next_review.localeCompare(b.next_review));
}

function recordReview(cardId, quality) {
  const r = Object.values(state.reviews).find(rv => rv.card_id === cardId);
  if (!r) return;
  const now_ts = now();
  const currentInterval = r.interval_seconds || 0;
  const ef = r.ease_factor || 2.5;
  const reps = r.repetitions || 0;
  const newIntervalMs = nextReview(currentInterval * 1000, ef, quality);
  const newIntervalSec = newIntervalMs / 1000;
  const newEF = updateEF(ef, quality);
  const newReps = quality >= 2 ? reps + 1 : 0;
  const nextTime = new Date(new Date().getTime() + newIntervalMs).toISOString().replace("T", " ").substring(0, 19);
  r.ease_factor = newEF;
  r.interval_seconds = newIntervalSec;
  r.repetitions = newReps;
  r.last_review = now_ts;
  r.next_review = nextTime;
  save();
}

function getStats(setId) {
  const cards = Object.values(state.cards).filter(c => c.set_id === setId);
  const studied = cards.filter(c => {
    const r = Object.values(state.reviews).find(rv => rv.card_id === c.id);
    return r && r.repetitions > 0;
  }).length;
  const n = now();
  const due = cards.filter(c => {
    const r = Object.values(state.reviews).find(rv => rv.card_id === c.id);
    return r && r.next_review <= n;
  }).length;
  return { total: cards.length, studied, due };
}

module.exports = { initDb, createSet, getSets, getSet, deleteSet, addCards, getCards, getDueCards, recordReview, getStats };