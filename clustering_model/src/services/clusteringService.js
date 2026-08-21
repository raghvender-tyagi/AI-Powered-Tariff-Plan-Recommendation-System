const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { kmeans } = require("ml-kmeans");

const inputPath = path.join(
  __dirname,
  "../../../data/processed/ml_features.csv"
);

const outputPath = path.join(
  __dirname,
  "../../../data/processed/customer_clusters.csv"
);

const reportPath = path.join(
  __dirname,
  "../../../data/processed/clustering_report.json"
);

const rows = [];

fs.createReadStream(inputPath)
  .pipe(csv())
  .on("data", (row) => {
    rows.push(row);
  })
  .on("end", () => {
    try {
      if (rows.length === 0) {
        throw new Error("ML feature file is empty.");
      }

      const featureNames = Object.keys(rows[0]).filter(
        (column) => column !== "customer_id"
      );

      const matrix = rows.map((row) =>
        featureNames.map((feature) =>
          Number(row[feature])
        )
      );

      // ------------------------------------
      // Validate ML matrix
      // ------------------------------------

      for (const row of matrix) {
        for (const value of row) {
          if (!Number.isFinite(value)) {
            throw new Error(
              "Invalid numeric value found in ML matrix."
            );
          }
        }
      }

      // ------------------------------------
      // Euclidean distance
      // ------------------------------------

      function euclideanDistance(a, b) {
        let sum = 0;

        for (let i = 0; i < a.length; i++) {
          const difference = a[i] - b[i];
          sum += difference * difference;
        }

        return Math.sqrt(sum);
      }

      // ------------------------------------
      // Silhouette score
      // ------------------------------------

      function calculateSilhouette(
        data,
        labels,
        k
      ) {
        const n = data.length;

        if (n < 2 || k < 2) {
          return -1;
        }

        let totalScore = 0;

        for (let i = 0; i < n; i++) {
          const ownCluster = labels[i];

          const sameCluster = [];
          const otherClusters = {};

          for (let j = 0; j < n; j++) {
            if (i === j) {
              continue;
            }

            const cluster = labels[j];

            if (cluster === ownCluster) {
              sameCluster.push(j);
            } else {
              if (!otherClusters[cluster]) {
                otherClusters[cluster] = [];
              }

              otherClusters[cluster].push(j);
            }
          }

          // a(i)
          let a = 0;

          if (sameCluster.length > 0) {
            let distanceSum = 0;

            for (const j of sameCluster) {
              distanceSum += euclideanDistance(
                data[i],
                data[j]
              );
            }

            a =
              distanceSum /
              sameCluster.length;
          }

          // b(i)
          let b = Infinity;

          for (const cluster of Object.keys(
            otherClusters
          )) {
            const members =
              otherClusters[cluster];

            if (members.length === 0) {
              continue;
            }

            let distanceSum = 0;

            for (const j of members) {
              distanceSum += euclideanDistance(
                data[i],
                data[j]
              );
            }

            const averageDistance =
              distanceSum / members.length;

            if (averageDistance < b) {
              b = averageDistance;
            }
          }

          if (!Number.isFinite(b)) {
            continue;
          }

          const denominator = Math.max(a, b);

          const silhouette =
            denominator === 0
              ? 0
              : (b - a) / denominator;

          totalScore += silhouette;
        }

        return totalScore / n;
      }

      // ------------------------------------
      // Find optimal K
      // ------------------------------------

      const minK = 2;
      const maxK = Math.min(10, rows.length - 1);

      const silhouetteResults = [];

      console.log(
        "\n========================================"
      );
      console.log(
        "          K-MEANS CLUSTERING"
      );
      console.log(
        "========================================"
      );

      console.log(
        "\nCustomers:",
        rows.length
      );

      console.log(
        "Features:",
        featureNames.length
      );

      console.log(
        "\n---------- SILHOUETTE ANALYSIS ----------"
      );

      let optimalK = null;
      let bestScore = -Infinity;

      for (let k = minK; k <= maxK; k++) {
        const result = kmeans(matrix, k, {
          initialization: "kmeans++",
          maxIterations: 100,
          seed: 42
        });

        const score =
          calculateSilhouette(
            matrix,
            result.clusters,
            k
          );

        silhouetteResults.push({
          k,
          silhouette: Number(
            score.toFixed(4)
          )
        });

        console.log(
          `K = ${k} → Silhouette = ${score.toFixed(4)}`
        );

        if (score > bestScore) {
          bestScore = score;
          optimalK = k;
        }
      }

      console.log(
        "\n----------------------------------------"
      );

      console.log(
        "Optimal K:",
        optimalK
      );

      console.log(
        "Best silhouette score:",
        bestScore.toFixed(4)
      );

      // ------------------------------------
      // Final clustering
      // ------------------------------------

      const finalResult = kmeans(
        matrix,
        optimalK,
        {
          initialization: "kmeans++",
          maxIterations: 100,
          seed: 42
        }
      );

      const labels =
        finalResult.clusters;

      // ------------------------------------
      // Cluster sizes
      // ------------------------------------

      const clusterSizes = {};

      for (let i = 0; i < optimalK; i++) {
        clusterSizes[i] = 0;
      }

      for (const label of labels) {
        clusterSizes[label]++;
      }

      console.log(
        "\n---------- CLUSTER SIZES ----------"
      );

      for (let i = 0; i < optimalK; i++) {
        console.log(
          `Cluster ${i}: ${clusterSizes[i]} customers`
        );
      }

      // ------------------------------------
      // Output customer clusters
      // ------------------------------------

      const outputLines = [
        "customer_id,cluster"
      ];

      for (let i = 0; i < rows.length; i++) {
        outputLines.push(
          `${rows[i].customer_id},${labels[i]}`
        );
      }

      fs.writeFileSync(
        outputPath,
        outputLines.join("\n"),
        "utf8"
      );

      // ------------------------------------
      // Clustering report
      // ------------------------------------

      const report = {
        generatedAt:
          new Date().toISOString(),

        customers: rows.length,

        features: featureNames,

        kRange: {
          min: minK,
          max: maxK
        },

        optimalK,

        bestSilhouetteScore:
          Number(
            bestScore.toFixed(4)
          ),

        silhouetteResults,

        clusterSizes
      };

      fs.writeFileSync(
        reportPath,
        JSON.stringify(
          report,
          null,
          2
        ),
        "utf8"
      );

      console.log(
        "\nOutput:",
        outputPath
      );

      console.log(
        "Report:",
        reportPath
      );

      console.log(
        "\n========================================\n"
      );

    } catch (error) {
      console.error(
        "\nCLUSTERING ERROR:",
        error.message
      );

      process.exit(1);
    }
  })
  .on("error", (error) => {
    console.error(
      "\nFILE READ ERROR:",
      error.message
    );

    process.exit(1);
  });