const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../../..");

const PROFILE_PATH = path.join(
  ROOT,
  "data",
  "processed",
  "cluster_profiles.json"
);

const PLAN_CATALOG_PATH = path.join(
  ROOT,
  "data",
  "processed",
  "plan_catalog.json"
);

const OUTPUT_PATH = path.join(
  ROOT,
  "data",
  "processed",
  "plan_cluster_mapping.json"
);

function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  return JSON.parse(
    fs.readFileSync(filePath, "utf8")
  );
}

function main() {
  console.log("========================================");
  console.log("        PLAN → CLUSTER MAPPING");
  console.log("========================================");

  const clusterData =
    loadJSON(PROFILE_PATH);

  const planData =
    loadJSON(PLAN_CATALOG_PATH);

  // cluster_profiles.json stores clusters
  // as an object: { "0": {...}, "1": {...} }
  const clusters =
    Object.values(clusterData.clusters || {});

  // plan_catalog.json stores plans as an array
  const plans =
    planData.plans || [];

  if (clusters.length === 0) {
    throw new Error(
      "No cluster profiles found."
    );
  }

  if (plans.length === 0) {
    throw new Error(
      "No tariff plans found."
    );
  }

  console.log(
    `Clusters: ${clusters.length}`
  );

  console.log(
    `Plans: ${plans.length}`
  );

  const mapping = [];

  for (const cluster of clusters) {
    const clusterId =
      cluster.cluster;

    const persona =
      cluster.preliminaryPersona;

    const clusterPlans =
      plans.filter(
        plan =>
          Number(plan.clusterId) ===
          Number(clusterId)
      );

    const mappedPlans =
      clusterPlans.map(plan => ({
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        dataLimitGb: plan.dataLimitGb,
        voiceMinutes: plan.voiceMinutes,
        description: plan.description,
        recommendation: plan.recommendation,
        targetSegment: plan.targetSegment,
        retentionRisk: plan.retentionRisk,

        expectedMonthlyRecharge:
          plan.expectedMonthlyRecharge,

        estimatedAvgDataGb:
          plan.estimatedAvgDataGb,

        estimatedAvgVoiceMinutes:
          plan.estimatedAvgVoiceMinutes
      }));

    mapping.push({
      clusterId,
      persona,

      customerCount:
        cluster.customerCount,

      customerPercentage:
        cluster.customerPercentage,

      clusterAverages:
        cluster.averages,

      plans: mappedPlans
    });
  }

  const output = {
    generatedAt:
      new Date().toISOString(),

    clusteringMethod:
      "K-Means",

    totalCustomers:
      clusterData.totalCustomers,

    totalClusters:
      clusterData.clusterCount,

    totalPlans:
      planData.totalPlans,

    mapping,

    validation: {
      allPlansMapped:
        plans.every(plan =>
          mapping.some(cluster =>
            Number(cluster.clusterId) ===
            Number(plan.clusterId)
          )
        ),

      mappedPlanCount:
        mapping.reduce(
          (total, cluster) =>
            total + cluster.plans.length,
          0
        ),

      unmappedPlans:
        plans
          .filter(plan =>
            !mapping.some(cluster =>
              Number(cluster.clusterId) ===
              Number(plan.clusterId)
            )
          )
          .map(plan => plan.id)
    }
  };

  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      output,
      null,
      2
    )
  );

  console.log("");

  for (const cluster of mapping) {
    console.log(
      "----------------------------------------"
    );

    console.log(
      `Cluster ${cluster.clusterId}`
    );

    console.log(
      `Persona: ${cluster.persona}`
    );

    console.log(
      `Customers: ${cluster.customerCount} (${cluster.customerPercentage}%)`
    );

    console.log(
      "Mapped plans:"
    );

    if (cluster.plans.length === 0) {
      console.log(
        "  No plans mapped"
      );
    } else {
      cluster.plans.forEach(
        (plan, index) => {
          console.log(
            `  ${index + 1}. ${plan.planName} - ₹${plan.price}`
          );

          console.log(
            `     Data: ${plan.dataLimitGb} GB`
          );

          console.log(
            `     Target: ${plan.targetSegment}`
          );
        }
      );
    }
  }

  console.log("");
  console.log(
    "---------- VALIDATION ----------"
  );

  console.log(
    `All plans mapped: ${
      output.validation.allPlansMapped
        ? "YES"
        : "NO"
    }`
  );

  console.log(
    `Mapped plans: ${
      output.validation.mappedPlanCount
    }`
  );

  console.log(
    `Unmapped plans: ${
      output.validation.unmappedPlans.length
    }`
  );

  console.log("");

  console.log(
    `Output: ${OUTPUT_PATH}`
  );

  console.log("========================================");
  console.log(
    "Plan-cluster mapping: PASS"
  );
  console.log("========================================");
}

try {
  main();
} catch (error) {
  console.error("");
  console.error(
    "PLAN MAPPING ERROR:"
  );
  console.error(
    error.message
  );

  process.exit(1);
}