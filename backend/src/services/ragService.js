const fs = require("fs");

const env = require("../config/env");
const catalog = require("./catalogService");
const { buildIndex } = require("./embeddingService");

/**
 * Retrieval-Augmented Generation knowledge base.
 *
 * The corpus is built entirely from this project's own committed artefacts:
 * the 25-plan catalogue, the plan -> cluster mapping, the cluster profiles,
 * the clustering / PCA / model-comparison reports and the documented scoring
 * weights. Answers therefore cite real project facts and never invent plans,
 * prices or statistics.
 */

let index = null;

const readJson = (filePath) =>
  fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;

function planDocuments() {
  return catalog.getPlans().map((plan) => ({
    id: `plan:${plan._id}`,
    type: "plan",
    planId: plan._id,
    title: plan.planName,
    source: "plan_catalog.json + plan_cluster_mapping.json",
    text:
      `${plan.planName} is a ${plan.categoryLabel} plan priced at Rs ${plan.price} ` +
      `with ${plan.dailyDataGb} GB per day (about ${plan.monthlyDataGb} GB a month) ` +
      `and ${plan.validityDays} days validity. ` +
      `Within this 25-plan portfolio it sits in the ${plan.priceTier} price tier ` +
      `and suits ${plan.dataTier} data usage. ` +
      (plan.members ? `It covers up to ${plan.members} family members on a shared pool. ` : "") +
      (plan.employees ? `It covers up to ${plan.employees} employees on a pooled allowance. ` : "") +
      (plan.differentiator ? `Its differentiator is: ${plan.differentiator}. ` : "") +
      `${plan.categoryLabel} category: ${plan.searchText}. ` +
      `It is mapped to cluster ${plan.clusterId}, the "${plan.persona}" persona, ` +
      `which covers ${plan.personaCustomerCount} customers ` +
      `(${plan.personaCustomerPercentage}% of the base).`
  }));
}

function clusterDocuments() {
  return catalog.getClusters().map((cluster) => ({
    id: `cluster:${cluster.clusterLabel}`,
    type: "persona",
    clusterId: cluster.clusterLabel,
    title: cluster.personaName,
    source: "cluster_profiles.json",
    text:
      `Cluster ${cluster.clusterLabel} is the "${cluster.personaName}" persona. ` +
      `${cluster.description} ` +
      `Trait summary: data ${cluster.traits.data}, streaming ${cluster.traits.streaming}, ` +
      `calling ${cluster.traits.calling}, SMS ${cluster.traits.sms}, ` +
      `roaming ${cluster.traits.roaming}, spend ${cluster.traits.spend}.`
  }));
}

function methodDocuments() {
  const docs = [];

  const clustering = readJson(env.paths.clusteringReport);
  const alternatives = readJson(env.paths.clusteringAlternatives);
  const pca = readJson(env.paths.pcaReport);
  const quality = readJson(env.paths.dataQualityReport);

  if (clustering) {
    docs.push({
      id: "method:clustering",
      type: "method",
      title: "Customer segmentation with K-Means",
      source: "clustering_report.json",
      text:
        `Customers were segmented with K-Means over ${clustering.features.length} usage features ` +
        `(${clustering.features.join(", ")}) across ${clustering.customers} customers. ` +
        `K was swept from ${clustering.kRange.min} to ${clustering.kRange.max} and chosen by silhouette score. ` +
        `The optimal K is ${clustering.optimalK} with a silhouette of ${clustering.bestSilhouetteScore}. ` +
        `Cluster sizes are ` +
        Object.entries(clustering.clusterSizes)
          .map(([id, size]) => `cluster ${id}: ${size} customers`)
          .join(", ") +
        "."
    });
  }

  if (alternatives) {
    docs.push({
      id: "method:model-comparison",
      type: "method",
      title: "Model comparison: K-Means vs Gaussian mixture",
      source: "clustering_alternatives.json",
      text:
        `${alternatives.evaluation_method} was run on a ${alternatives.evaluation_sample}-customer sample ` +
        `with ${alternatives.feature_count} features. ` +
        `K-Means scored a silhouette of ${alternatives.kmeans.silhouette}; ` +
        `the ${alternatives.gaussian_alternative.method} scored ${alternatives.gaussian_alternative.silhouette}. ` +
        `${alternatives.conclusion} The production method is ${alternatives.production_method}.`
    });
  }

  if (pca) {
    docs.push({
      id: "method:pca",
      type: "method",
      title: "PCA visualisation of the clusters",
      source: "pca_report.json",
      text:
        `PCA reduces the ${pca.input_features.length} clustering features to ` +
        `${pca.output_dimensions} components for visualisation. ` +
        `PC1 explains ${(pca.explained_variance[0] * 100).toFixed(1)}% of variance and ` +
        `PC2 explains ${(pca.explained_variance[1] * 100).toFixed(1)}%, ` +
        `for ${(pca.total_explained_variance * 100).toFixed(1)}% in total. ` +
        `PCA is used only for visualising the segmentation, not for scoring plans.`
    });
  }

  if (quality) {
    docs.push({
      id: "method:data-quality",
      type: "method",
      title: "Dataset cleaning and quality",
      source: "data_quality_report.json",
      text:
        `The raw telecom usage dataset was cleaned and validated before feature engineering. ` +
        `Report summary: ${JSON.stringify(quality)}.`
    });
  }

  docs.push({
    id: "method:scoring",
    type: "method",
    title: "How plans are scored",
    source: "clustering_model/src/services/recommendationEngine.js",
    text:
      "Every recommendation scores all 25 plans with the formula " +
      "score = 0.40 x usageFit + 0.30 x budgetFit + 0.30 x personaMatch. " +
      "usageFit compares the plan's monthly data allowance (daily GB x 30) against the customer's " +
      "monthly data usage, with adjustments for heavy streaming and heavy voice usage. " +
      "budgetFit compares the plan price against the customer's monthly recharge or stated budget. " +
      "personaMatch compares the customer's K-Means persona against the persona the plan is mapped to. " +
      "The three highest scoring plans become the Top 3 recommendations."
  });

  docs.push({
    id: "method:new-user",
    type: "method",
    title: "How a brand-new user is matched",
    source: "backend/src/ml/personaEngine.js",
    text:
      "A new user without usage history answers a short profile wizard covering data need, calling need, " +
      "SMS need, budget, roaming need and whether the plan is individual or family. " +
      "Those answers are converted into the 11 model features, with any feature the user was not asked about " +
      "imputed from the dataset's own medians and usage ratios. " +
      "The profile is then scaled with the model's own min-max statistics and assigned to the nearest " +
      "K-Means centroid, giving the persona that drives personaMatch. " +
      "Every imputed feature is reported back in the API response."
  });

  return docs;
}

function buildCorpus() {
  return [...planDocuments(), ...clusterDocuments(), ...methodDocuments()];
}

function getIndex() {
  if (!index) index = buildIndex(buildCorpus());
  return index;
}

/** Semantic search over the knowledge base. */
function search(query, topK = 5, type = null) {
  const filter = type ? (doc) => doc.type === type : null;

  return getIndex()
    .search(query, topK, filter)
    .map(({ vector, ...rest }) => rest);
}

/** Plans semantically closest to a free-text description of a need. */
function similarPlans(query, topK = 5) {
  return search(query, topK, "plan").map((doc) => ({
    planId: doc.planId,
    planName: doc.title,
    similarity: doc.similarity,
    snippet: doc.text
  }));
}

/** Plans semantically closest to another plan (used by comparison). */
function relatedPlans(planId, topK = 4) {
  const source = getIndex().documents.find((doc) => doc.id === `plan:${planId}`);
  if (!source) return [];

  return getIndex()
    .search(source.text, topK + 1, (doc) => doc.type === "plan")
    .filter((doc) => doc.planId !== planId)
    .slice(0, topK)
    .map((doc) => ({
      planId: doc.planId,
      planName: doc.title,
      similarity: doc.similarity
    }));
}

/**
 * Grounded answer: retrieve, then compose a reply strictly from the
 * retrieved passages. Every answer carries its sources.
 */
function answer(question, topK = 4) {
  const passages = search(question, topK);

  if (passages.length === 0 || passages[0].similarity <= 0.02) {
    return {
      answer:
        "I could not find anything about that in the plan catalogue or the segmentation reports. " +
        "Try asking about a specific plan, a persona, pricing, or how the recommendations are scored.",
      grounded: false,
      passages: []
    };
  }

  const body = passages
    .filter((passage) => passage.similarity > 0.02)
    .map((passage) => passage.text)
    .join(" ");

  return {
    answer: body,
    grounded: true,
    passages: passages.map((passage) => ({
      id: passage.id,
      type: passage.type,
      title: passage.title,
      source: passage.source,
      similarity: passage.similarity
    }))
  };
}

module.exports = {
  getIndex,
  buildCorpus,
  search,
  similarPlans,
  relatedPlans,
  answer,
  invalidate() {
    index = null;
  }
};
