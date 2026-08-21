const crypto = require("crypto");
const { spawn } = require("child_process");
const path = require("path");

const env = require("../config/env");
const store = require("../db/store");
const catalog = require("./catalogService");
const ragService = require("./ragService");

/**
 * Admin operations: platform statistics and the batch clustering job.
 *
 * The batch job shells out to the existing clustering_model pipeline —
 * it does not contain a second copy of the clustering code.
 */

async function stats() {
  const [totalCustomers, recommendationCount, chatSessions, jobs] = await Promise.all([
    store.count("customers"),
    store.count("recommendations"),
    store.count("chatSessions"),
    store.find("jobs", { type: "clustering" }, { sort: { startedAt: -1 }, limit: 1 })
  ]);

  const model = catalog.modelSummary();
  const clusters = catalog.getClusters();

  const recentRecommendations = await store.find(
    "recommendations",
    {},
    { sort: { generatedAt: -1 }, limit: 500 }
  );

  const scores = recentRecommendations
    .flatMap((doc) => doc.recommendedPlans.map((plan) => plan.matchPercent))
    .filter((value) => Number.isFinite(value));

  const avgMatchScore =
    scores.length > 0
      ? Number((scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(1))
      : null;

  const lastJob = jobs[0] ?? null;

  return {
    totalCustomers,
    customersInDataset: model.customers,
    totalPlans: catalog.getPlans().length,
    totalClusters: clusters.length,
    recommendationsGenerated: recommendationCount,
    chatSessions,
    avgMatchScore,
    lastClusteringRun: lastJob?.finishedAt ?? null,
    lastBatchJobStatus: lastJob?.status ?? "never_run",
    model,
    database: store.status(),
    knowledgeBaseDocuments: ragService.buildCorpus().length
  };
}

function runScript(scriptRelativePath) {
  return new Promise((resolve) => {
    const scriptPath = path.join(env.paths.clusteringModelRoot, scriptRelativePath);

    const child = spawn(process.execPath, [scriptPath], {
      cwd: env.paths.clusteringModelRoot,
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      resolve({ ok: false, stdout, stderr: `${stderr}${error.message}`, code: -1 });
    });

    child.on("close", (code) => {
      resolve({ ok: code === 0, stdout, stderr, code });
    });
  });
}

/**
 * Re-runs the persisted-model artefact extraction and refreshes every cached
 * catalogue/knowledge-base view, then re-syncs cluster labels onto the stored
 * customers. Full re-clustering (which rewrites customer_clusters.csv) is
 * opt-in via `fullPipeline` because it takes several minutes on 10k rows.
 */
async function runClusteringJob(options = {}) {
  const job = {
    _id: `job_${crypto.randomUUID()}`,
    type: "clustering",
    status: "running",
    result: null,
    error: null,
    startedAt: new Date().toISOString(),
    finishedAt: null
  };

  await store.upsert("jobs", job);

  const steps = options.fullPipeline
    ? [
        "src/services/prepareMLFeatures.js",
        "src/services/clusteringService.js",
        "src/services/clusterProfiling.js",
        "src/services/planClusterMapping.js",
        "src/jobs/buildModelArtifacts.js"
      ]
    : ["src/jobs/buildModelArtifacts.js"];

  // Deliberately not awaited by the caller — the client polls for status.
  (async () => {
    const logs = [];

    try {
      for (const step of steps) {
        const outcome = await runScript(step);
        logs.push({ step, ok: outcome.ok, code: outcome.code, tail: outcome.stdout.slice(-500) });

        if (!outcome.ok) {
          throw new Error(`${step} exited with code ${outcome.code}: ${outcome.stderr.slice(-400)}`);
        }
      }

      catalog.invalidate();
      ragService.invalidate();

      const { syncClusterLabels } = require("../scripts/syncClusters");
      const synced = await syncClusterLabels();

      await store.updateById("jobs", job._id, {
        status: "success",
        finishedAt: new Date().toISOString(),
        result: {
          steps: logs,
          clustersUpdated: catalog.getClusters().length,
          customersProcessed: synced.customersUpdated,
          fullPipeline: Boolean(options.fullPipeline)
        }
      });
    } catch (error) {
      await store.updateById("jobs", job._id, {
        status: "failed",
        finishedAt: new Date().toISOString(),
        error: error.message,
        result: { steps: logs }
      });
    }
  })();

  return { jobId: job._id, status: "running" };
}

async function jobStatus(jobId) {
  const job = await store.findById("jobs", jobId);

  if (!job) {
    const error = new Error(`Job ${jobId} not found.`);
    error.status = 404;
    throw error;
  }

  return job;
}

module.exports = { stats, runClusteringJob, jobStatus };
