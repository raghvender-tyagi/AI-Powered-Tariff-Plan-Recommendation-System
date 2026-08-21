# AI-Powered Tariff Plan Recommendation System

A MERN application that turns a 10,000-customer telecom usage dataset into
personalised tariff recommendations: Group 1 cleans and engineers the
features, Group 2 segments customers with K-Means and designs a 25-plan
catalogue, and a weighted recommendation engine ranks every plan for a
given customer.

```
React (Vite)  ──▶  Express API  ──▶  K-Means persona  ──▶  25-plan catalogue
                        │                                        │
                        └──────────▶  recommendation engine  ◀────┘
                                              │
                                          Top 3 + explanation
```

---

## Quick start

```bash
# 1. install everything (root, clustering_model, backend, frontend)
npm run install:all

# 2. extract the trained K-Means model into a portable artefact
npm run ml:artifacts

# 3. seed the database from the committed dataset + catalogue
npm run seed

# 4. run the API and the frontend together
npm run dev
```

* Frontend: http://localhost:5173
* API: http://localhost:5000/api
* Admin sign-in: `admin` / `admin123` (change in `backend/.env`)

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example`
to `frontend/.env` first if they do not already exist.

### Tests

```bash
npm run test:flow   # in-process: profile -> persona -> engine -> Top 3 -> explanation
npm run test:api    # HTTP: every endpoint the frontend calls (server must be running)
```

---

## Repository layout

| Path | What lives there |
| --- | --- |
| `clustering_model/` | Group 1 + Group 2: cleaning, feature engineering, EDA, PCA, K-Means, cluster profiling, the 25-plan catalogue, the plan→cluster mapping and **the recommendation engine** |
| `backend/` | Express API, Mongoose models, ML bridge, RAG/embeddings, chat, what-if, admin jobs |
| `frontend/` | React 19 + Vite + Tailwind v4 client |
| `chatbot/` | Optional LangGraph advisor (Python), now reading the real 25-plan catalogue |
| `src/`, `index.html`, `vite.config.js` (repo root) | An earlier standalone copy of the client, kept for reference. The live client is `frontend/`. |

---

## The machine-learning pipeline

Everything below is committed output — the app never re-derives it at
request time.

| Stage | Script | Output |
| --- | --- | --- |
| Import + clean | `clustering_model/src/jobs/importDataset.js` | `cleaned_telecom.csv`, `data_quality_report.json` |
| Feature engineering | `src/services/featureEngineering.js` | `customer_features.csv` |
| EDA / feature analysis | `src/jobs/runEDA.js`, `src/jobs/analyzeFeatures.js` | `eda_report.json`, `feature_analysis.json` |
| ML matrix | `src/services/prepareMLFeatures.js` | `ml_features.csv` (1st–99th pct clipping + min-max) |
| K-Means | `src/services/clusteringService.js` | `customer_clusters.csv`, `clustering_report.json` |
| Cluster profiling | `src/services/clusterProfiling.js` | `cluster_profiles.json` (personas) |
| Model comparison | `src/jobs/evaluateAlternatives.js` | `clustering_alternatives.json` |
| PCA visualisation | `src/jobs/runClusterVisualization.js` | `pca_report.json`, `cluster_visualization.html` |
| Plan design | `src/services/planDesignService.js` | `plan_catalog.json` (**25 plans**) |
| Plan → cluster mapping | `src/services/planClusterMapping.js` | `plan_cluster_mapping.json` |
| Model artefact extraction | `src/jobs/buildModelArtifacts.js` | `model_artifacts.json` |

Re-run the whole chain with `npm run ml:pipeline` (several minutes on 10k rows).

**Production model:** K-Means, K = 2 chosen by silhouette sweep (K = 2…10,
best silhouette 0.2999), beating the Gaussian-mixture alternative (0.2259).
PCA is used for visualisation only (60.9% variance in 2 components).

**Personas:**

| Cluster | Persona | Customers |
| --- | --- | --- |
| 0 | Moderate / General Users | 7,172 (71.7%) |
| 1 | Heavy Data & Streaming Users | 2,828 (28.3%) |

### `model_artifacts.json`

`buildModelArtifacts.js` does **not** retrain anything. It extracts the
already-trained model so a brand-new user can be scored without re-running
the pipeline:

* normalization stats recomputed with the same recipe as
  `prepareMLFeatures.js`, then verified row-by-row against the committed
  `ml_features.csv` (max delta 5e-7);
* centroids = the mean of `ml_features.csv` grouped by the committed
  `customer_clusters.csv` labels, so they are exactly the persisted K-Means
  centroids — nearest-centroid assignment reproduces 99.99% of the labels;
* population medians and usage ratios, used only to impute the features a
  new user is never asked about (every imputation is reported back through
  the API as `personaAssignment.imputedFeatures`).

---

## The recommendation engine is the single source of truth

`clustering_model/src/services/recommendationEngine.js` scores **all 25
plans** for every request:

```
score = 0.40 × usageFit + 0.30 × budgetFit + 0.30 × personaMatch
```

The backend wraps it in `backend/src/services/recommendationService.js`.
Every surface — existing-customer recommendations, new-user onboarding, the
chatbot, the what-if simulator and the comparison verdicts — calls that one
wrapper. Nothing in the frontend scores or re-orders plans; the client-side
scoring mirror that used to exist has been removed.

The only change made to the engine itself was additive: `recommend()` now
also returns `ranked` (the full sorted 25) alongside `top3`, so callers never
need to re-score anything.

---

## API

Base URL `http://localhost:5000/api`.

### Catalogue and model
| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/health` | Status, DB driver, catalogue size |
| GET | `/model` | K-Means summary, silhouette sweep, model comparison, PCA, weights |
| GET | `/plans` | All 25 plans (`?category=`, `?clusterId=`, `?maxPrice=`) |
| GET | `/plans/:id` | One plan + semantically related plans |
| GET | `/plans/search?q=` | Embedding search over the catalogue |
| POST | `/plans/compare` | Comparison rows + verdicts for 2–4 plans |
| GET | `/categories` | FLEX / PLAY / FAMILY / BUSINESS / PRIME |
| GET | `/clusters`, `/clusters/:id`, `/clusters/:id/customers` | Personas |

### Customers and recommendations
| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/customers`, `/customers/:id`, `/customers/:id/usage` | Profiles + engineered usage |
| POST | `/customers` | Create from an onboarding profile (assigns a persona) |
| PUT | `/customers/:id/current-plan` | Set the active plan |
| POST | `/recommendations/by-customer/:id` | **Existing customer** → Top 3 |
| POST | `/recommendations/by-profile` | **New user** → Top 3 |
| POST | `/recommendations/what-if` | Baseline vs scenario, both engine-scored |
| GET | `/customers/:id/recommendations` | History |

### Advisor, RAG and admin
| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/chat/start`, `/chat/message` | Slot-filling advisor → engine Top 3 |
| POST | `/rag/ask` · GET `/rag/search` · GET `/rag/corpus` | Grounded Q&A |
| POST | `/auth/login` | JWT for the admin area |
| GET | `/admin/stats` *(JWT)* | Platform + model statistics |
| POST | `/admin/clusters/run` *(JWT)* | Batch job; `{"fullPipeline": true}` re-clusters |
| GET | `/admin/clusters/run/:jobId` *(JWT)* | Job status |

---

## Embeddings, semantic search and RAG

`backend/src/services/embeddingService.js` builds sparse TF-IDF vectors
(unigrams + bigrams, sub-linear TF, smoothed IDF, L2-normalised) over a
33-document corpus generated from the project's own artefacts: the 25
plans, the 2 personas and 6 methodology documents built from the clustering,
model-comparison, PCA and data-quality reports.

Cosine similarity powers plan search, "related plans" in comparison, and
retrieval for the advisor. It is deterministic, offline and needs no API key.

Every RAG answer carries its sources, and a query that matches nothing says
so rather than guessing.

**Optional LLM polish:** set `OPENAI_API_KEY` in `backend/.env` and the
advisor will rephrase the retrieved facts and the engine's Top 3. It is
never allowed to rank, reorder or invent plans, and if the call fails the
grounded reply is used instead.

---

## Database

Mongoose models for `plans`, `clusters`, `customers`, `recommendations`,
`chatSessions` and `jobs`, behind one repository interface
(`backend/src/db/store.js`).

If `MONGO_URI` is reachable the API uses MongoDB. If it is not, it falls
back to a durable JSON file store under `backend/data/filestore/` and says
so at startup and in `GET /api/health`, so the full flow stays runnable on a
machine without `mongod`. Set `ALLOW_FILE_STORE_FALLBACK=false` to make a
failed connection fatal instead.

---

## Python chatbot (optional)

`chatbot/bot.py` is a LangGraph advisor kept from the original work. It now
loads the real 25-plan catalogue from `plan_catalog.json` instead of a
placeholder list, so it cannot recommend a plan that does not exist.

```bash
pip install -r chatbot/requirements.txt
# needs OPENAI_API_KEY in .env
python chatbot/bot.py
```

The in-app advisor does not depend on it — the Node chat service at
`/api/chat/*` is the one the frontend uses.
