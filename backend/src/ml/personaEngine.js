const fs = require("fs");
const env = require("../config/env");

/**
 * Persona assignment for the Group 2 K-Means model.
 *
 * For an EXISTING customer the cluster label is the one K-Means already
 * assigned during the batch run (customer_clusters.csv, mirrored into the
 * customers collection) — this module is not consulted.
 *
 * For a NEW user we only know what the onboarding wizard / advisor asked
 * for. The remaining usage features are imputed from the dataset itself
 * (population medians and median usage ratios) and every imputed feature is
 * returned to the caller so nothing is silently invented, then the profile
 * is scaled with the model's own normalization stats and assigned to the
 * nearest persisted centroid.
 */

let artifacts = null;

function loadArtifacts() {
  if (artifacts) return artifacts;

  if (!fs.existsSync(env.paths.modelArtifacts)) {
    throw new Error(
      `model_artifacts.json not found at ${env.paths.modelArtifacts}. Run: npm --prefix clustering_model run artifacts`
    );
  }

  artifacts = JSON.parse(fs.readFileSync(env.paths.modelArtifacts, "utf8"));
  return artifacts;
}

// Onboarding need levels -> concrete monthly figures taken from the
// dataset's own distribution rather than from arbitrary constants.
function needLevelToValue(level, stats) {
  if (!stats) return 0;
  if (level === "low") return stats.p10;
  if (level === "medium") return stats.median;
  if (level === "high") return stats.p90;
  return stats.median;
}

/**
 * Turns an API profile into the 11-feature vector the model expects.
 *
 * Accepted profile fields (all optional):
 *   dataNeedGB | dataNeed ('low'|'medium'|'high')
 *   callNeedMin | callingNeed
 *   smsNeed | smsCount
 *   budget | monthlyRecharge
 *   roamingRequired (boolean)
 *   tenureMonths
 *   streamingHours, hotspotDataGb, internationalMinutes, ... (if known)
 */
function buildFeatureRecord(profile = {}) {
  const model = loadArtifacts();
  const population = model.population;

  const imputed = [];
  const provided = [];

  const take = (value, feature, fallback) => {
    if (value !== undefined && value !== null && Number.isFinite(Number(value))) {
      provided.push(feature);
      return Number(value);
    }
    imputed.push(feature);
    return fallback;
  };

  // --- what the user actually tells us -------------------------------
  const monthlyData = take(
    profile.dataNeedGB ?? profile.monthly_data_gb,
    "monthly_data_gb",
    needLevelToValue(profile.dataNeed, population.monthly_data_gb)
  );

  const voiceMinutes = take(
    profile.callNeedMin ?? profile.monthly_voice_minutes,
    "monthly_voice_minutes",
    needLevelToValue(profile.callingNeed, population.monthly_voice_minutes)
  );

  const sms = take(
    profile.smsCount ?? profile.monthly_sms,
    "monthly_sms",
    needLevelToValue(profile.smsNeed, population.monthly_sms)
  );

  const recharge = take(
    profile.budget ?? profile.monthly_recharge ?? profile.monthlySpend,
    "monthly_recharge",
    population.monthly_recharge.median
  );

  const tenure = take(
    profile.tenureMonths ?? profile.tenure_months,
    "tenure_months",
    population.tenure_months.median
  );

  // --- imputed from the dataset's own usage ratios --------------------
  const streaming = take(
    profile.streamingHours ?? profile.streaming_hours,
    "streaming_hours",
    monthlyData * population.streaming_data_ratio.median
  );

  const hotspot = take(
    profile.hotspotDataGb ?? profile.hotspot_data_gb,
    "hotspot_data_gb",
    monthlyData * population.hotspot_data_ratio.median
  );

  const avgMinutesPerCall = take(
    profile.avgMinutesPerCall ?? profile.avg_minutes_per_call,
    "avg_minutes_per_call",
    population.avg_minutes_per_call.median
  );

  const international = take(
    profile.internationalMinutes ?? profile.international_minutes,
    "international_minutes",
    voiceMinutes * population.international_voice_ratio.median
  );

  // A user who says they do not need roaming is taken at their word.
  const roams = profile.roamingRequired === undefined ? true : Boolean(profile.roamingRequired);

  const roamingVoice = take(
    profile.roamingVoiceMinutes ?? profile.roaming_voice_minutes,
    "roaming_voice_minutes",
    roams ? voiceMinutes * population.roaming_voice_ratio.median : 0
  );

  const roamingData = take(
    profile.roamingDataGb ?? profile.roaming_data_gb,
    "roaming_data_gb",
    roams ? monthlyData * population.roaming_data_ratio.median : 0
  );

  const record = {
    monthly_data_gb: monthlyData,
    streaming_hours: streaming,
    hotspot_data_gb: hotspot,
    monthly_voice_minutes: voiceMinutes,
    avg_minutes_per_call: avgMinutesPerCall,
    monthly_sms: sms,
    international_minutes: international,
    roaming_voice_minutes: roamingVoice,
    roaming_data_gb: roamingData,
    monthly_recharge: recharge,
    tenure_months: tenure
  };

  return { record, imputedFeatures: imputed, providedFeatures: provided };
}

/** Applies the model's own clipping + min-max scaling. */
function scaleRecord(record) {
  const model = loadArtifacts();

  return model.featureOrder.map((feature) => {
    const stats = model.normalization[feature];
    const raw = Number(record[feature] ?? 0);
    const clipped = Math.min(Math.max(raw, stats.clipLower), stats.clipUpper);
    if (stats.max === stats.min) return 0;
    return (clipped - stats.min) / (stats.max - stats.min);
  });
}

function euclidean(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/** Nearest-centroid assignment against the persisted K-Means solution. */
function assignCluster(record) {
  const model = loadArtifacts();
  const vector = scaleRecord(record);

  const distances = Object.entries(model.centroids)
    .map(([label, centroid]) => ({
      clusterId: Number(label),
      distance: euclidean(vector, centroid)
    }))
    .sort((a, b) => a.distance - b.distance);

  const best = distances[0];
  const runnerUp = distances[1];

  // Confidence = relative margin between the best and second-best centroid.
  const confidence =
    runnerUp && runnerUp.distance > 0
      ? Math.max(0, Math.min(1, (runnerUp.distance - best.distance) / runnerUp.distance))
      : 1;

  return {
    clusterId: best.clusterId,
    persona: model.personas[String(best.clusterId)]?.persona ?? null,
    distance: Number(best.distance.toFixed(6)),
    confidence: Number(confidence.toFixed(4)),
    distances: distances.map((d) => ({
      clusterId: d.clusterId,
      distance: Number(d.distance.toFixed(6))
    })),
    vector
  };
}

/** Full new-user path: profile -> features -> scaled -> cluster + persona. */
function profileToPersona(profile) {
  const { record, imputedFeatures, providedFeatures } = buildFeatureRecord(profile);
  const assignment = assignCluster(record);

  return {
    ...assignment,
    features: record,
    imputedFeatures,
    providedFeatures
  };
}

/** 2-D PCA projection of a scaled vector, using the committed pca_report. */
let pca = null;

function projectToPca(vector) {
  if (!pca) {
    if (!fs.existsSync(env.paths.pcaReport)) return null;
    pca = JSON.parse(fs.readFileSync(env.paths.pcaReport, "utf8"));
  }

  const dot = (components) =>
    components.reduce((sum, weight, index) => sum + weight * (vector[index] ?? 0), 0);

  return { pc1: dot(pca.components.pc1), pc2: dot(pca.components.pc2) };
}

module.exports = {
  loadArtifacts,
  buildFeatureRecord,
  scaleRecord,
  assignCluster,
  profileToPersona,
  projectToPca
};
