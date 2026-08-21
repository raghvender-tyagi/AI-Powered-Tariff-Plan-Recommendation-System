const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(
  __dirname,
  "../../data/processed"
);

const CLUSTER_PROFILE_PATH = path.join(
  DATA_PATH,
  "cluster_profiles.json"
);

const PLAN_CATALOG_PATH = path.join(
  DATA_PATH,
  "plan_catalog.json"
);

const OUTPUT_PATH = path.join(
  DATA_PATH,
  "plan_cluster_mapping.json"
);

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  return JSON.parse(
    fs.readFileSync(filePath, "utf8")
  );
}

function validatePlanCatalog(catalog) {
  if (!Array.isArray(catalog.plans)) {
    throw new Error(
      "plan_catalog.json does not contain a plans array."
    );
  }

  if (catalog.plans.length !== 25) {
    throw new Error(
      `Expected 25 plans, found ${catalog.plans.length}.`
    );
  }

  const categories = [
    "FLEX",
    "PLAY",
    "FAMILY",
    "BUSINESS",
    "PRIME"
  ];

  for (const category of categories) {
    const count = catalog.plans.filter(
      plan =>
        String(plan.category).toUpperCase() ===
        category
    ).length;

    if (count !== 5) {
      throw new Error(
        `${category} must contain 5 plans. Found ${count}.`
      );
    }
  }
}

function getClusters(clusterProfiles) {
  if (!clusterProfiles.clusters) {
    throw new Error(
      "cluster_profiles.json does not contain clusters."
    );
  }

  return Object.values(
    clusterProfiles.clusters
  );
}

function findModerateCluster(clusters) {
  return clusters.find(cluster =>
    String(
      cluster.preliminaryPersona || ""
    )
      .toLowerCase()
      .includes("moderate")
  );
}

function findHeavyDataCluster(clusters) {
  return clusters.find(cluster =>
    String(
      cluster.preliminaryPersona || ""
    )
      .toLowerCase()
      .includes("heavy data")
  );
}

function getClusterForCategory(
  category,
  clusters
) {
  const moderate =
    findModerateCluster(clusters);

  const heavy =
    findHeavyDataCluster(clusters);

  switch (
    String(category).toUpperCase()
  ) {
    case "PLAY":
    case "PRIME":
      return heavy || clusters[0];

    case "FLEX":
    case "FAMILY":
    case "BUSINESS":
      return moderate || clusters[0];

    default:
      return clusters[0];
  }
}

function createMapping(
  planCatalog,
  clusterProfiles
) {
  validatePlanCatalog(planCatalog);

  const clusters =
    getClusters(clusterProfiles);

  if (clusters.length === 0) {
    throw new Error(
      "No clusters found."
    );
  }

  return planCatalog.plans.map(plan => {
    const cluster =
      getClusterForCategory(
        plan.category,
        clusters
      );

    return {
      planId: plan.id,
      planName: plan.name,
      category: plan.category,
      price: plan.price,
      clusterId: Number(cluster.cluster),
      persona: cluster.preliminaryPersona,
      customerCount:
        cluster.customerCount,
      customerPercentage:
        cluster.customerPercentage
    };
  });
}

function validateMapping(
  mapping,
  planCatalog
) {
  if (mapping.length !== 25) {
    throw new Error(
      `Expected 25 mappings, found ${mapping.length}.`
    );
  }

  const ids = new Set(
    mapping.map(item => item.planId)
  );

  if (ids.size !== 25) {
    throw new Error(
      "Duplicate plan IDs found."
    );
  }

  for (const plan of planCatalog.plans) {
    if (!ids.has(plan.id)) {
      throw new Error(
        `Plan not mapped: ${plan.id}`
      );
    }
  }

  const categories = [
    "FLEX",
    "PLAY",
    "FAMILY",
    "BUSINESS",
    "PRIME"
  ];

  for (const category of categories) {
    const count = mapping.filter(
      item =>
        item.category === category
    ).length;

    if (count !== 5) {
      throw new Error(
        `${category}: expected 5 mappings, found ${count}.`
      );
    }
  }
}

function main() {
  console.log(
    "========================================"
  );

  console.log(
    "       PLAN → CLUSTER MAPPING"
  );

  console.log(
    "========================================"
  );

  try {
    console.log(
      `Data directory: ${DATA_PATH}`
    );

    console.log("");

    const clusterProfiles =
      loadJson(
        CLUSTER_PROFILE_PATH
      );

    const planCatalog =
      loadJson(
        PLAN_CATALOG_PATH
      );

    const clusters =
      getClusters(clusterProfiles);

    console.log(
      `Clusters: ${clusters.length}`
    );

    console.log(
      `Plans: ${planCatalog.plans.length}`
    );

    const mapping =
      createMapping(
        planCatalog,
        clusterProfiles
      );

    validateMapping(
      mapping,
      planCatalog
    );

    const output = {
      generatedAt:
        new Date().toISOString(),

      totalPlans: 25,

      totalClusters:
        clusters.length,

      categories: [
        "FLEX",
        "PLAY",
        "FAMILY",
        "BUSINESS",
        "PRIME"
      ],

      mappings: mapping
    };

    fs.writeFileSync(
      OUTPUT_PATH,
      JSON.stringify(
        output,
        null,
        2
      ),
      "utf8"
    );

    console.log("");
    console.log(
      "---------- VALIDATION ----------"
    );

    console.log(
      "All plans mapped: YES"
    );

    console.log(
      "Mapped plans: 25"
    );

    console.log(
      "Unmapped plans: 0"
    );

    console.log(
      "FLEX: 5/5"
    );

    console.log(
      "PLAY: 5/5"
    );

    console.log(
      "FAMILY: 5/5"
    );

    console.log(
      "BUSINESS: 5/5"
    );

    console.log(
      "PRIME: 5/5"
    );

    console.log("");

    console.log(
      `Output: ${OUTPUT_PATH}`
    );

    console.log("");

    console.log(
      "Plan-cluster mapping: PASS"
    );

    console.log(
      "========================================"
    );
  } catch (error) {
    console.error(
      "PLAN MAPPING ERROR:"
    );

    console.error(
      error.message
    );

    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  createMapping,
  validateMapping,
  getClusterForCategory
};