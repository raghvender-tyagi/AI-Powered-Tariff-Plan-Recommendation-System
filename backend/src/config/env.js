const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const BACKEND_ROOT = path.resolve(__dirname, "../..");
const PROJECT_ROOT = path.resolve(BACKEND_ROOT, "..");

// backend/.env wins, then the shared project-level .env (used by the
// Python chatbot too), so a single OPENAI_API_KEY can serve both.
for (const candidate of [
  path.join(BACKEND_ROOT, ".env"),
  path.join(PROJECT_ROOT, ".env")
]) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
  }
}

const CLUSTERING_MODEL_ROOT = path.join(PROJECT_ROOT, "clustering_model");
const PROCESSED_DATA_DIR = path.join(CLUSTERING_MODEL_ROOT, "data", "processed");

const toBool = (value, fallback = false) => {
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

const openAiKey = process.env.OPENAI_API_KEY || "";

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),

  corsOrigins: (process.env.CORS_ORIGIN || "*")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),

  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tariff_twin",
  mongoConnectTimeoutMs: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 4000),
  // When Mongo is unreachable the API keeps running on a durable JSON
  // file store so the whole flow stays testable. Set to false to make a
  // failed Mongo connection fatal instead.
  allowFileStoreFallback: toBool(process.env.ALLOW_FILE_STORE_FALLBACK, true),
  fileStoreDir:
    process.env.FILE_STORE_DIR || path.join(BACKEND_ROOT, "data", "filestore"),

  jwtSecret: process.env.JWT_SECRET || "tariff-twin-development-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h",
  adminUsername: process.env.ADMIN_USERNAME || "admin",
  adminPassword: process.env.ADMIN_PASSWORD || "admin123",

  // Optional LLM polish for the advisor. Everything works without it:
  // with no key the chatbot answers from the retrieval + engine output
  // directly instead of generating prose.
  openAiKey,
  llmEnabled: Boolean(openAiKey) && openAiKey !== "replace-with-your-openai-api-key",
  chatModel: (process.env.CHAT_MODEL || "openai:gpt-4o-mini").replace(/^openai:/, ""),
  openAiBaseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",

  seedCustomerLimit: Number(process.env.SEED_CUSTOMER_LIMIT || 1000),

  paths: {
    projectRoot: PROJECT_ROOT,
    backendRoot: BACKEND_ROOT,
    clusteringModelRoot: CLUSTERING_MODEL_ROOT,
    processedData: PROCESSED_DATA_DIR,
    planCatalog: path.join(PROCESSED_DATA_DIR, "plan_catalog.json"),
    planClusterMapping: path.join(PROCESSED_DATA_DIR, "plan_cluster_mapping.json"),
    clusterProfiles: path.join(PROCESSED_DATA_DIR, "cluster_profiles.json"),
    clusteringReport: path.join(PROCESSED_DATA_DIR, "clustering_report.json"),
    clusteringAlternatives: path.join(
      PROCESSED_DATA_DIR,
      "clustering_alternatives.json"
    ),
    pcaReport: path.join(PROCESSED_DATA_DIR, "pca_report.json"),
    edaReport: path.join(PROCESSED_DATA_DIR, "eda_report.json"),
    featureAnalysis: path.join(PROCESSED_DATA_DIR, "feature_analysis.json"),
    dataQualityReport: path.join(PROCESSED_DATA_DIR, "data_quality_report.json"),
    modelArtifacts: path.join(PROCESSED_DATA_DIR, "model_artifacts.json"),
    customerFeatures: path.join(PROCESSED_DATA_DIR, "customer_features.csv"),
    customerClusters: path.join(PROCESSED_DATA_DIR, "customer_clusters.csv"),
    cleanedTelecom: path.join(PROCESSED_DATA_DIR, "cleaned_telecom.csv"),
    recommendationEngine: path.join(
      CLUSTERING_MODEL_ROOT,
      "src",
      "services",
      "recommendationEngine.js"
    )
  }
};
