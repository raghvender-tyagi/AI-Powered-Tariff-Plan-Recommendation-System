const fs = require("fs");
const path = require("path");

// =====================================================
// PATHS
// =====================================================

const DATA_PATH = path.join(
  __dirname,
  "../../data/processed"
);

const PLAN_CATALOG_PATH = path.join(
  DATA_PATH,
  "plan_catalog.json"
);

const CLUSTER_PROFILE_PATH = path.join(
  DATA_PATH,
  "cluster_profiles.json"
);

const PLAN_MAPPING_PATH = path.join(
  DATA_PATH,
  "plan_cluster_mapping.json"
);

const OUTPUT_PATH = path.join(
  DATA_PATH,
  "recommendation_sample.json"
);

// =====================================================
// RECOMMENDATION ENGINE
// =====================================================

class RecommendationEngine {
  constructor() {
    // Group 2 scoring requirement
    this.weights = {
      usageFit: 0.40,
      budgetFit: 0.30,
      personaMatch: 0.30
    };
  }

  // ===================================================
  // LOAD JSON
  // ===================================================

  loadJson(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `File not found: ${filePath}`
      );
    }

    try {
      return JSON.parse(
        fs.readFileSync(
          filePath,
          "utf8"
        )
      );
    } catch (error) {
      throw new Error(
        `Invalid JSON: ${filePath}\n${error.message}`
      );
    }
  }

  // ===================================================
  // LOAD 25 PLANS
  // ===================================================

  loadPlanCatalog() {
    const catalog =
      this.loadJson(
        PLAN_CATALOG_PATH
      );

    if (
      !Array.isArray(
        catalog.plans
      )
    ) {
      throw new Error(
        "plan_catalog.json does not contain plans."
      );
    }

    if (
      catalog.plans.length !== 25
    ) {
      throw new Error(
        `Expected 25 plans, found ${catalog.plans.length}.`
      );
    }

    return catalog;
  }

  // ===================================================
  // LOAD CLUSTER PROFILES
  // ===================================================

  loadClusterProfiles() {
    const profiles =
      this.loadJson(
        CLUSTER_PROFILE_PATH
      );

    if (
      !profiles.clusters
    ) {
      throw new Error(
        "cluster_profiles.json does not contain clusters."
      );
    }

    return Object.values(
      profiles.clusters
    );
  }

  // ===================================================
  // LOAD PLAN → CLUSTER MAPPING
  // ===================================================

  loadPlanMapping() {
    const mapping =
      this.loadJson(
        PLAN_MAPPING_PATH
      );

    if (
      !Array.isArray(
        mapping.mappings
      )
    ) {
      throw new Error(
        "plan_cluster_mapping.json does not contain mappings."
      );
    }

    if (
      mapping.mappings.length !== 25
    ) {
      throw new Error(
        `Expected 25 mappings, found ${mapping.mappings.length}.`
      );
    }

    return mapping.mappings;
  }

  // ===================================================
  // USAGE FIT
  // ===================================================

  calculateUsageFit(
    customer,
    plan
  ) {
    const monthlyData =
      Number(
        customer.monthly_data_gb || 0
      );

    const streamingHours =
      Number(
        customer.streaming_hours || 0
      );

    const voiceMinutes =
      Number(
        customer.monthly_voice_minutes || 0
      );

    // -----------------------------------------------
    // Estimate monthly data allowance
    // -----------------------------------------------

    let monthlyAllowance = 0;

    if (
      plan.dailyDataGb !== undefined &&
      plan.dailyDataGb !== null
    ) {
      monthlyAllowance =
        Number(
          plan.dailyDataGb
        ) * 30;
    }

    if (
      plan.dailySharedPoolGb !== undefined &&
      plan.dailySharedPoolGb !== null
    ) {
      monthlyAllowance =
        Number(
          plan.dailySharedPoolGb
        ) * 30;
    }

    if (
      plan.dailyPoolGb !== undefined &&
      plan.dailyPoolGb !== null
    ) {
      monthlyAllowance =
        Number(
          plan.dailyPoolGb
        ) * 30;
    }

    // -----------------------------------------------
    // Data usage fit
    // -----------------------------------------------

    let dataFit = 70;

    if (
      monthlyData > 0 &&
      monthlyAllowance > 0
    ) {
      if (
        monthlyAllowance >=
        monthlyData
      ) {
        const coverage =
          monthlyAllowance /
          monthlyData;

        dataFit = Math.min(
          100,
          80 +
            Math.min(
              20,
              coverage * 5
            )
        );
      } else {
        dataFit =
          Math.max(
            0,
            Math.min(
              100,
              (
                monthlyAllowance /
                monthlyData
              ) * 100
            )
          );
      }
    }

    let usageFit =
      dataFit;

    // -----------------------------------------------
    // Streaming adjustment
    // -----------------------------------------------

    if (
      streamingHours >= 30
    ) {
      if (
        plan.category === "PLAY" ||
        plan.category === "PRIME"
      ) {
        usageFit += 10;
      } else {
        usageFit -= 10;
      }
    }

    // -----------------------------------------------
    // Voice adjustment
    // -----------------------------------------------

    if (
      voiceMinutes >= 300
    ) {
      if (
        plan.category === "BUSINESS" ||
        plan.category === "FAMILY"
      ) {
        usageFit += 5;
      }
    }

    return Math.max(
      0,
      Math.min(
        100,
        usageFit
      )
    );
  }

  // ===================================================
  // BUDGET FIT
  // ===================================================

  calculateBudgetFit(
    customer,
    plan
  ) {
    const budget =
      Number(
        customer.monthly_recharge ||
        customer.budget ||
        0
      );

    const price =
      Number(
        plan.price || 0
      );

    if (
      budget <= 0
    ) {
      return 70;
    }

    // Within budget
    if (
      price <= budget
    ) {
      const savingRatio =
        (
          budget - price
        ) / budget;

      return Math.min(
        100,
        80 +
          savingRatio * 20
      );
    }

    // Over budget
    const overBudget =
      (
        price - budget
      ) / budget;

    return Math.max(
      0,
      100 -
        overBudget * 100
    );
  }

  // ===================================================
  // PERSONA MATCH
  // ===================================================

  calculatePersonaMatch(
    cluster,
    mapping
  ) {
    if (
      !cluster ||
      !mapping
    ) {
      return 50;
    }

    const clusterPersona =
      String(
        cluster.preliminaryPersona ||
        ""
      ).toLowerCase();

    const mappedPersona =
      String(
        mapping.persona ||
        ""
      ).toLowerCase();

    // Exact persona match
    if (
      clusterPersona ===
      mappedPersona
    ) {
      return 100;
    }

    // Heavy data persona
    if (
      clusterPersona.includes(
        "heavy data"
      )
    ) {
      if (
        mapping.category === "PLAY" ||
        mapping.category === "PRIME"
      ) {
        return 90;
      }
    }

    // General persona
    if (
      clusterPersona.includes(
        "moderate"
      )
    ) {
      if (
        mapping.category === "FLEX" ||
        mapping.category === "FAMILY" ||
        mapping.category === "BUSINESS"
      ) {
        return 90;
      }
    }

    return 50;
  }

  // ===================================================
  // FINAL SCORE
  // ===================================================

  calculateScore(
    customer,
    plan,
    cluster,
    mapping
  ) {
    const usageFit =
      this.calculateUsageFit(
        customer,
        plan
      );

    const budgetFit =
      this.calculateBudgetFit(
        customer,
        plan
      );

    const personaMatch =
      this.calculatePersonaMatch(
        cluster,
        mapping
      );

    const finalScore =
      (
        usageFit *
        this.weights.usageFit
      ) +
      (
        budgetFit *
        this.weights.budgetFit
      ) +
      (
        personaMatch *
        this.weights.personaMatch
      );

    return {
      usageFit:
        Number(
          usageFit.toFixed(2)
        ),

      budgetFit:
        Number(
          budgetFit.toFixed(2)
        ),

      personaMatch:
        Number(
          personaMatch.toFixed(2)
        ),

      finalScore:
        Number(
          finalScore.toFixed(2)
        )
    };
  }

  // ===================================================
  // RECOMMEND TOP 3
  // ===================================================

  recommend(
    customer,
    clusterId
  ) {
    const catalog =
      this.loadPlanCatalog();

    const clusters =
      this.loadClusterProfiles();

    const mappings =
      this.loadPlanMapping();

    const cluster =
      clusters.find(
        item =>
          Number(
            item.cluster
          ) ===
          Number(clusterId)
      );

    if (!cluster) {
      throw new Error(
        `Cluster ${clusterId} not found.`
      );
    }

    // -----------------------------------------------
    // Score ALL 25 plans
    // -----------------------------------------------

    const scoredPlans =
      catalog.plans.map(
        plan => {
          const mapping =
            mappings.find(
              item =>
                item.planId ===
                plan.id
            );

          if (!mapping) {
            throw new Error(
              `No cluster mapping found for ${plan.id}.`
            );
          }

          const score =
            this.calculateScore(
              customer,
              plan,
              cluster,
              mapping
            );

          return {
            planId:
              plan.id,

            planName:
              plan.name,

            category:
              plan.category,

            price:
              plan.price,

            clusterId:
              mapping.clusterId,

            persona:
              mapping.persona,

            score:
              score.finalScore,

            usageFit:
              score.usageFit,

            budgetFit:
              score.budgetFit,

            personaMatch:
              score.personaMatch
          };
        }
      );

    // -----------------------------------------------
    // Rank highest score first
    // -----------------------------------------------

    scoredPlans.sort(
      (a, b) =>
        b.score -
        a.score
    );

    return {
      customerId:
        customer.customer_id ||
        null,

      clusterId:
        Number(clusterId),

      persona:
        cluster.preliminaryPersona,

      plansEvaluated:
        scoredPlans.length,

      top3:
        scoredPlans.slice(
          0,
          3
        ),

      // Full ranking of all 25 plans, highest score first.
      // Same array the Top-3 is sliced from — exposed so callers
      // (API, comparison, what-if) never have to re-score anything.
      ranked:
        scoredPlans,

      scoringWeights: {
        usageFit: "40%",
        budgetFit: "30%",
        personaMatch: "30%"
      }
    };
  }

  // ===================================================
  // SAVE OUTPUT
  // ===================================================

  saveResult(result) {
    fs.writeFileSync(
      OUTPUT_PATH,
      JSON.stringify(
        result,
        null,
        2
      ),
      "utf8"
    );
  }
}

// =====================================================
// TEST / DEMONSTRATION
// =====================================================

if (
  require.main === module
) {
  try {
    const engine =
      new RecommendationEngine();

    const customer = {
      customer_id:
        "CUST00001",

      monthly_data_gb:
        6.25,

      streaming_hours:
        15.46,

      monthly_voice_minutes:
        232.47,

      monthly_recharge:
        376.99
    };

    // Cluster 0:
    // Moderate / General Users
    const clusterId = 0;

    const result =
      engine.recommend(
        customer,
        clusterId
      );

    engine.saveResult(
      result
    );

    console.log(
      "========================================"
    );

    console.log(
      "       SMART TARIFF RECOMMENDATION"
    );

    console.log(
      "========================================"
    );

    console.log(
      `Customer: ${result.customerId}`
    );

    console.log(
      `Cluster: ${result.clusterId}`
    );

    console.log(
      `Persona: ${result.persona}`
    );

    console.log(
      `Plans evaluated: ${result.plansEvaluated}`
    );

    console.log("");

    console.log(
      "---------- TOP 3 ----------"
    );

    result.top3.forEach(
      (plan, index) => {
        console.log("");

        console.log(
          `${index + 1}. ${plan.planName}`
        );

        console.log(
          `   Category: ${plan.category}`
        );

        console.log(
          `   Price: ₹${plan.price}`
        );

        console.log(
          `   Score: ${plan.score}`
        );

        console.log(
          `   Usage Fit: ${plan.usageFit}`
        );

        console.log(
          `   Budget Fit: ${plan.budgetFit}`
        );

        console.log(
          `   Persona Match: ${plan.personaMatch}`
        );

        console.log(
          `   Cluster: ${plan.clusterId}`
        );
      }
    );

    console.log("");

    console.log(
      "---------- SCORING WEIGHTS ----------"
    );

    console.log(
      "Usage Fit: 40%"
    );

    console.log(
      "Budget Fit: 30%"
    );

    console.log(
      "Persona Match: 30%"
    );

    console.log("");

    console.log(
      `Output: ${OUTPUT_PATH}`
    );

    console.log("");

    console.log(
      "Top-3 recommendation scoring: PASS"
    );

    console.log(
      "========================================"
    );

  } catch (error) {
    console.error(
      "RECOMMENDATION ERROR:"
    );

    console.error(
      error.message
    );

    process.exit(1);
  }
}

module.exports =
  RecommendationEngine;