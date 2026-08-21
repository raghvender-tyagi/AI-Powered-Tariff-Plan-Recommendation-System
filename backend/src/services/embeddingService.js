/**
 * Local, dependency-free text embeddings.
 *
 * Each document is embedded as a sparse TF-IDF vector over the corpus's own
 * vocabulary (unigrams + bigrams, sub-linear term frequency, smoothed IDF),
 * L2-normalised so cosine similarity is a plain dot product.
 *
 * Exact rather than hashed, because the corpus is small enough that an
 * explicit vocabulary is both cheaper and collision-free. It is fully
 * deterministic and runs offline, so semantic search and RAG need no API key.
 */

const STOPWORDS = new Set([
  "a", "about", "an", "and", "any", "are", "as", "at", "be", "been", "but",
  "by", "can", "do", "does", "for", "from", "get", "had", "has", "have", "i",
  "if", "in", "is", "it", "its", "just", "me", "more", "most", "my", "of",
  "on", "or", "our", "out", "so", "some", "than", "that", "the", "their",
  "them", "then", "there", "these", "they", "this", "to", "up", "us", "was",
  "we", "were", "will", "with", "would", "you", "your"
]);

// Query-side vocabulary bridging. Every expansion maps a word a user is
// likely to type onto wording that actually appears in the corpus, which is
// generated from the project's own data files.
const SYNONYMS = {
  cheap: ["budget", "low", "price"],
  cheapest: ["budget", "low", "price"],
  affordable: ["budget", "price"],
  inexpensive: ["budget", "price"],
  costly: ["premium", "price"],
  expensive: ["premium", "price"],
  kids: ["family", "members"],
  household: ["family", "members"],
  team: ["business", "employees"],
  company: ["business", "employees"],
  office: ["business", "employees"],
  enterprise: ["business", "employees"],
  netflix: ["ott", "entertainment", "streaming"],
  movies: ["ott", "entertainment", "streaming"],
  video: ["streaming", "entertainment"],
  music: ["entertainment"],
  gaming: ["heavy", "data"],
  gamer: ["heavy", "data"],
  travelling: ["roaming"],
  traveling: ["roaming"],
  travel: ["roaming"],
  abroad: ["roaming", "international"],
  segment: ["cluster", "persona"],
  segments: ["cluster", "persona"],
  segmentation: ["cluster", "persona"],
  grouped: ["cluster"],
  recommend: ["recommendation", "score"],
  recommended: ["recommendation", "score"],
  ranking: ["score", "scored"],
  rank: ["score", "scored"],
  scoring: ["score", "scored"],
  algorithm: ["kmeans", "clustering"],
  model: ["kmeans", "clustering"]
};

function words(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/k-means/g, "kmeans")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word));
}

function tokenize(text, { expand = false } = {}) {
  let base = words(text);

  if (expand) {
    const extra = [];
    for (const word of base) {
      if (SYNONYMS[word]) extra.push(...SYNONYMS[word]);
    }
    base = [...base, ...extra];
  }

  const tokens = [...base];

  for (let i = 0; i < base.length - 1; i++) {
    tokens.push(`${base[i]}_${base[i + 1]}`);
  }

  return tokens;
}

function termFrequencies(tokens) {
  const counts = new Map();
  for (const token of tokens) counts.set(token, (counts.get(token) || 0) + 1);
  return counts;
}

function normalise(weights) {
  let norm = 0;
  for (const weight of weights.values()) norm += weight * weight;
  norm = Math.sqrt(norm);

  if (norm === 0) return weights;

  const scaled = new Map();
  for (const [term, weight] of weights) scaled.set(term, weight / norm);
  return scaled;
}

function dot(a, b) {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let score = 0;

  for (const [term, weight] of small) {
    const other = large.get(term);
    if (other !== undefined) score += weight * other;
  }

  return score;
}

/**
 * @param {Array<{id:string,text:string,[key:string]:any}>} documents
 */
function buildIndex(documents) {
  const tokenised = documents.map((doc) => tokenize(doc.text));

  const documentFrequency = new Map();

  for (const tokens of tokenised) {
    for (const token of new Set(tokens)) {
      documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
    }
  }

  const total = documents.length;

  const idf = (token) => {
    const df = documentFrequency.get(token) || 0;
    return Math.log((total + 1) / (df + 1)) + 1;
  };

  const weigh = (counts) => {
    const weights = new Map();
    for (const [token, count] of counts) {
      weights.set(token, (1 + Math.log(count)) * idf(token));
    }
    return normalise(weights);
  };

  const embed = (text, options = {}) => weigh(termFrequencies(tokenize(text, options)));

  const vectors = documents.map((doc, index) => {
    const weights = weigh(termFrequencies(tokenised[index]));
    return {
      ...doc,
      weights,
      // Serialisable form, sorted strongest-first (used when persisting).
      vector: [...weights.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([term, weight]) => [term, Number(weight.toFixed(6))])
    };
  });

  return {
    dimensions: documentFrequency.size,
    vocabulary: documentFrequency.size,
    documents: vectors,
    embed,

    /** Cosine-similarity search. Queries are synonym-expanded. */
    search(query, topK = 5, filter = null) {
      const queryWeights = embed(query, { expand: true });

      return vectors
        .filter((doc) => (filter ? filter(doc) : true))
        .map((doc) => ({
          ...doc,
          similarity: Number(dot(doc.weights, queryWeights).toFixed(4))
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
    },

    similarityBetween(idA, idB) {
      const a = vectors.find((doc) => doc.id === idA);
      const b = vectors.find((doc) => doc.id === idB);
      if (!a || !b) return null;
      return Number(dot(a.weights, b.weights).toFixed(4));
    }
  };
}

module.exports = { buildIndex, tokenize, dot, SYNONYMS };
