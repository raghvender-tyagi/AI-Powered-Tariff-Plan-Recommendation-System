const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const featuresPath = path.join(
  __dirname,
  "../../data/processed/customer_features.csv"
);

const clustersPath = path.join(
  __dirname,
  "../../data/processed/customer_clusters.csv"
);

const outputPath = path.join(
  __dirname,
  "../../data/processed/cluster_profiles.json"
);

const featureRows = [];
const clusterRows = [];

// ------------------------------------
// Read customer features
// ------------------------------------

function readCSV(filePath, destination) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        destination.push(row);
      })
      .on("end", resolve)
      .on("error", reject);
  });
}

// ------------------------------------
// Main
// ------------------------------------

async function profileClusters() {
  try {
    console.log("\n========================================");
    console.log("          CLUSTER PROFILING");
    console.log("========================================");

    await readCSV(featuresPath, featureRows);
    await readCSV(clustersPath, clusterRows);

    if (featureRows.length === 0) {
      throw new Error("Customer feature file is empty.");
    }

    if (clusterRows.length === 0) {
      throw new Error("Customer cluster file is empty.");
    }

    // ------------------------------------
    // Create cluster lookup
    // ------------------------------------

    const clusterMap = new Map();

    for (const row of clusterRows) {
      clusterMap.set(
        row.customer_id,
        Number(row.cluster)
      );
    }

    // ------------------------------------
    // Join features + cluster
    // ------------------------------------

    const customers = [];

    for (const row of featureRows) {
      const cluster =
        clusterMap.get(row.customer_id);

      if (cluster === undefined) {
        continue;
      }

      customers.push({
        ...row,
        cluster
      });
    }

    if (customers.length === 0) {
      throw new Error(
        "No customers could be matched with clusters."
      );
    }

    const clusterIds = [
      ...new Set(
        customers.map(
          (customer) => customer.cluster
        )
      )
    ].sort((a, b) => a - b);

    // ------------------------------------
    // Features to profile
    // ------------------------------------

    const profileFeatures = [
      "age",
      "tenure_months",

      "monthly_data_gb",
      "streaming_hours",
      "hotspot_data_gb",

      "monthly_voice_minutes",
      "total_calls",
      "avg_minutes_per_call",

      "monthly_sms",

      "international_minutes",
      "roaming_voice_minutes",
      "roaming_data_gb",

      "monthly_recharge",

      "streaming_data_ratio",
      "hotspot_data_ratio",
      "international_voice_ratio",
      "roaming_voice_ratio",
      "roaming_data_ratio",

      "calls_per_rupee",
      "data_per_rupee",

      "churn"
    ];

    // ------------------------------------
    // Mean helper
    // ------------------------------------

    function average(values) {
      if (values.length === 0) {
        return 0;
      }

      return (
        values.reduce(
          (sum, value) => sum + value,
          0
        ) / values.length
      );
    }

    // ------------------------------------
    // Build profiles
    // ------------------------------------

    const profiles = {};

    for (const clusterId of clusterIds) {
      const members = customers.filter(
        (customer) =>
          customer.cluster === clusterId
      );

      const profile = {
        cluster: clusterId,
        customerCount: members.length,
        customerPercentage: Number(
          (
            (members.length /
              customers.length) *
            100
          ).toFixed(2)
        ),
        averages: {}
      };

      for (const feature of profileFeatures) {
        const values = members
          .map((customer) =>
            Number(customer[feature])
          )
          .filter((value) =>
            Number.isFinite(value)
          );

        profile.averages[feature] =
          Number(
            average(values).toFixed(4)
          );
      }

      profiles[clusterId] = profile;
    }

    // ------------------------------------
    // Determine relative behavior
    // ------------------------------------

    const overall = {};

    for (const feature of profileFeatures) {
      const values = customers
        .map((customer) =>
          Number(customer[feature])
        )
        .filter((value) =>
          Number.isFinite(value)
        );

      overall[feature] =
        average(values);
    }

    // ------------------------------------
    // Generate preliminary personas
    // ------------------------------------

    function relativeScore(
      clusterAverage,
      overallAverage
    ) {
      if (overallAverage === 0) {
        return 1;
      }

      return (
        clusterAverage /
        overallAverage
      );
    }

    for (const clusterId of clusterIds) {
      const profile =
        profiles[clusterId];

      const avg = profile.averages;

      const dataScore =
        relativeScore(
          avg.monthly_data_gb,
          overall.monthly_data_gb
        );

      const voiceScore =
        relativeScore(
          avg.monthly_voice_minutes,
          overall.monthly_voice_minutes
        );

      const roamingScore =
        relativeScore(
          avg.roaming_data_gb,
          overall.roaming_data_gb
        ) +
        relativeScore(
          avg.roaming_voice_minutes,
          overall.roaming_voice_minutes
        );

      const streamingScore =
        relativeScore(
          avg.streaming_hours,
          overall.streaming_hours
        );

      const spendingScore =
        relativeScore(
          avg.monthly_recharge,
          overall.monthly_recharge
        );

      if (
        dataScore >= 1.25 &&
        streamingScore >= 1.20
      ) {
        profile.preliminaryPersona =
          "Heavy Data & Streaming Users";
      } else if (
        roamingScore >= 2.0
      ) {
        profile.preliminaryPersona =
          "Roaming / International Users";
      } else if (
        voiceScore >= 1.25
      ) {
        profile.preliminaryPersona =
          "Heavy Voice Users";
      } else if (
        spendingScore >= 1.20
      ) {
        profile.preliminaryPersona =
          "High Value Users";
      } else {
        profile.preliminaryPersona =
          "Moderate / General Users";
      }
    }

    // ------------------------------------
    // Report
    // ------------------------------------

    const report = {
      generatedAt:
        new Date().toISOString(),

      totalCustomers:
        customers.length,

      clusterCount:
        clusterIds.length,

      overallAverages: overall,

      clusters: profiles
    };

    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        report,
        null,
        2
      ),
      "utf8"
    );

    // ------------------------------------
    // Console output
    // ------------------------------------

    console.log(
      "\nClusters:",
      clusterIds.length
    );

    console.log(
      "Customers:",
      customers.length
    );

    for (const clusterId of clusterIds) {
      const profile =
        profiles[clusterId];

      const avg =
        profile.averages;

      console.log(
        "\n----------------------------------------"
      );

      console.log(
        `Cluster ${clusterId}`
      );

      console.log(
        `Customers: ${profile.customerCount} (${profile.customerPercentage}%)`
      );

      console.log(
        `Preliminary persona: ${profile.preliminaryPersona}`
      );

      console.log(
        `Data: ${avg.monthly_data_gb} GB`
      );

      console.log(
        `Streaming: ${avg.streaming_hours} hours`
      );

      console.log(
        `Hotspot: ${avg.hotspot_data_gb} GB`
      );

      console.log(
        `Voice: ${avg.monthly_voice_minutes} minutes`
      );

      console.log(
        `Calls: ${avg.total_calls}`
      );

      console.log(
        `SMS: ${avg.monthly_sms}`
      );

      console.log(
        `International: ${avg.international_minutes} minutes`
      );

      console.log(
        `Roaming voice: ${avg.roaming_voice_minutes} minutes`
      );

      console.log(
        `Roaming data: ${avg.roaming_data_gb} GB`
      );

      console.log(
        `Recharge: ₹${avg.monthly_recharge}`
      );

      console.log(
        `Tenure: ${avg.tenure_months} months`
      );

      console.log(
        `Churn rate: ${(avg.churn * 100).toFixed(2)}%`
      );
    }

    console.log(
      "\nProfile report:",
      outputPath
    );

    console.log(
      "\n========================================\n"
    );

  } catch (error) {
    console.error(
      "\nCLUSTER PROFILING ERROR:",
      error.message
    );

    process.exit(1);
  }
}

profileClusters();