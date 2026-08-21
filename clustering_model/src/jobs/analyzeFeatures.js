const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const inputPath = path.join(
  __dirname,
  "../../data/processed/customer_features.csv"
);

const outputPath = path.join(
  __dirname,
  "../../data/processed/feature_analysis.json"
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
        throw new Error("Customer feature file is empty.");
      }

      // ------------------------------------
      // Numeric features
      // ------------------------------------

      const excludedFeatures = [
        "customer_id",
        "churn"
      ];

      const numericFeatures = Object.keys(rows[0])
        .filter(
          (column) =>
            !excludedFeatures.includes(column)
        );

      // ------------------------------------
      // Convert data to numeric matrix
      // ------------------------------------

      const data = {};

      for (const feature of numericFeatures) {
        data[feature] = rows.map((row) =>
          Number(row[feature])
        );
      }

      // ------------------------------------
      // Mean
      // ------------------------------------

      function mean(values) {
        return (
          values.reduce(
            (sum, value) => sum + value,
            0
          ) / values.length
        );
      }

      // ------------------------------------
      // Pearson correlation
      // ------------------------------------

      function correlation(x, y) {
        const meanX = mean(x);
        const meanY = mean(y);

        let numerator = 0;
        let denominatorX = 0;
        let denominatorY = 0;

        for (let i = 0; i < x.length; i++) {
          const dx = x[i] - meanX;
          const dy = y[i] - meanY;

          numerator += dx * dy;
          denominatorX += dx * dx;
          denominatorY += dy * dy;
        }

        const denominator = Math.sqrt(
          denominatorX * denominatorY
        );

        if (denominator === 0) {
          return 0;
        }

        return numerator / denominator;
      }

      // ------------------------------------
      // Correlation analysis
      // ------------------------------------

      const highlyCorrelatedPairs = [];

      for (
        let i = 0;
        i < numericFeatures.length;
        i++
      ) {
        for (
          let j = i + 1;
          j < numericFeatures.length;
          j++
        ) {
          const featureA = numericFeatures[i];
          const featureB = numericFeatures[j];

          const r = correlation(
            data[featureA],
            data[featureB]
          );

          if (Math.abs(r) >= 0.80) {
            highlyCorrelatedPairs.push({
              featureA,
              featureB,
              correlation: Number(r.toFixed(4))
            });
          }
        }
      }

      // ------------------------------------
      // IQR outlier analysis
      // ------------------------------------

      function percentile(values, p) {
        const sorted = [...values].sort(
          (a, b) => a - b
        );

        const index =
          (sorted.length - 1) * p;

        const lower = Math.floor(index);
        const upper = Math.ceil(index);

        if (lower === upper) {
          return sorted[lower];
        }

        return (
          sorted[lower] +
          (sorted[upper] - sorted[lower]) *
            (index - lower)
        );
      }

      const outlierAnalysis = {};

      for (const feature of numericFeatures) {
        const values = data[feature];

        const q1 = percentile(values, 0.25);
        const q3 = percentile(values, 0.75);

        const iqr = q3 - q1;

        const lowerBound =
          q1 - 1.5 * iqr;

        const upperBound =
          q3 + 1.5 * iqr;

        const outlierCount =
          values.filter(
            (value) =>
              value < lowerBound ||
              value > upperBound
          ).length;

        outlierAnalysis[feature] = {
          q1: Number(q1.toFixed(4)),
          q3: Number(q3.toFixed(4)),
          iqr: Number(iqr.toFixed(4)),
          lowerBound: Number(
            lowerBound.toFixed(4)
          ),
          upperBound: Number(
            upperBound.toFixed(4)
          ),
          outlierCount,
          outlierPercentage: Number(
            (
              (outlierCount / values.length) *
              100
            ).toFixed(2)
          )
        };
      }

      // ------------------------------------
      // Feature variance
      // ------------------------------------

      const featureVariance = {};

      for (const feature of numericFeatures) {
        const values = data[feature];
        const avg = mean(values);

        const variance =
          values.reduce(
            (sum, value) =>
              sum + Math.pow(value - avg, 2),
            0
          ) / values.length;

        featureVariance[feature] =
          Number(variance.toFixed(6));
      }

      // ------------------------------------
      // Low-variance features
      // ------------------------------------

      const lowVarianceFeatures =
        numericFeatures.filter(
          (feature) =>
            featureVariance[feature] < 0.000001
        );

      // ------------------------------------
      // Analysis report
      // ------------------------------------

      const report = {
        generatedAt:
          new Date().toISOString(),

        customers: rows.length,

        excludedFromClustering: [
          "customer_id",
          "churn"
        ],

        numericFeatures,

        highlyCorrelatedPairs,

        outlierAnalysis,

        featureVariance,

        lowVarianceFeatures
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
      // Console report
      // ------------------------------------

      console.log(
        "\n========================================"
      );
      console.log(
        "        FEATURE ANALYSIS"
      );
      console.log(
        "========================================"
      );

      console.log(
        "\nCustomers:",
        rows.length
      );

      console.log(
        "Clustering candidates:",
        numericFeatures.length
      );

      console.log(
        "\n---------- HIGH CORRELATIONS ----------"
      );

      if (
        highlyCorrelatedPairs.length === 0
      ) {
        console.log(
          "No highly correlated pairs found."
        );
      } else {
        for (const pair of highlyCorrelatedPairs) {
          console.log(
            `${pair.featureA} <-> ${pair.featureB}: ${pair.correlation}`
          );
        }
      }

      console.log(
        "\n---------- OUTLIER ANALYSIS ----------"
      );

      for (const feature of numericFeatures) {
        const result =
          outlierAnalysis[feature];

        console.log(
          `${feature}: ${result.outlierCount} outliers (${result.outlierPercentage}%)`
        );
      }

      console.log(
        "\n---------- LOW VARIANCE ----------"
      );

      if (
        lowVarianceFeatures.length === 0
      ) {
        console.log(
          "No low-variance features."
        );
      } else {
        console.log(
          lowVarianceFeatures
        );
      }

      console.log(
        "\nAnalysis report:",
        outputPath
      );

      console.log(
        "\n========================================\n"
      );

    } catch (error) {
      console.error(
        "\nFEATURE ANALYSIS ERROR:",
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