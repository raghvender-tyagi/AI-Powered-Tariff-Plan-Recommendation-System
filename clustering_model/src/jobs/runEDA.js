const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const inputPath = path.join(
  __dirname,
  "../../data/processed/customer_features.csv"
);

const outputPath = path.join(
  __dirname,
  "../../data/processed/eda_report.json"
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

      const columns = Object.keys(rows[0]);

      const numericColumns = columns.filter(
        (column) => column !== "customer_id"
      );

      const statistics = {};

      // ------------------------------------
      // Basic statistics
      // ------------------------------------

      for (const column of numericColumns) {
        const values = rows
          .map((row) => Number(row[column]))
          .filter((value) => Number.isFinite(value));

        if (values.length === 0) {
          continue;
        }

        values.sort((a, b) => a - b);

        const mean =
          values.reduce((sum, value) => sum + value, 0) /
          values.length;

        const median =
          values.length % 2 === 0
            ? (values[values.length / 2 - 1] +
                values[values.length / 2]) /
              2
            : values[Math.floor(values.length / 2)];

        const min = values[0];
        const max = values[values.length - 1];

        const variance =
          values.reduce(
            (sum, value) =>
              sum + Math.pow(value - mean, 2),
            0
          ) / values.length;

        const stdDev = Math.sqrt(variance);

        statistics[column] = {
          count: values.length,
          mean: Number(mean.toFixed(4)),
          median: Number(median.toFixed(4)),
          min: Number(min.toFixed(4)),
          max: Number(max.toFixed(4)),
          stdDev: Number(stdDev.toFixed(4))
        };
      }

      // ------------------------------------
      // Data quality
      // ------------------------------------

      let missingValues = 0;
      let invalidValues = 0;
      let negativeValues = 0;

      for (const row of rows) {
        for (const column of numericColumns) {
          const value = row[column];

          if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
          ) {
            missingValues++;
            continue;
          }

          const number = Number(value);

          if (!Number.isFinite(number)) {
            invalidValues++;
            continue;
          }

          if (number < 0) {
            negativeValues++;
          }
        }
      }

      // ------------------------------------
      // Constant features
      // ------------------------------------

      const constantFeatures = [];

      for (const column of numericColumns) {
        const values = rows.map((row) =>
          Number(row[column])
        );

        const uniqueValues = new Set(values);

        if (uniqueValues.size <= 1) {
          constantFeatures.push(column);
        }
      }

      // ------------------------------------
      // Zero-heavy features
      // ------------------------------------

      const zeroHeavyFeatures = [];

      for (const column of numericColumns) {
        const values = rows.map((row) =>
          Number(row[column])
        );

        const zeroCount = values.filter(
          (value) => value === 0
        ).length;

        const zeroPercentage =
          (zeroCount / values.length) * 100;

        if (zeroPercentage >= 50) {
          zeroHeavyFeatures.push({
            feature: column,
            zeroCount,
            zeroPercentage: Number(
              zeroPercentage.toFixed(2)
            )
          });
        }
      }

      // ------------------------------------
      // Outlier analysis using IQR
      // ------------------------------------

      const outlierAnalysis = {};

      for (const column of numericColumns) {
        const values = rows
          .map((row) => Number(row[column]))
          .filter((value) => Number.isFinite(value))
          .sort((a, b) => a - b);

        if (values.length < 4) {
          continue;
        }

        const q1Index =
          Math.floor((values.length - 1) * 0.25);

        const q3Index =
          Math.floor((values.length - 1) * 0.75);

        const q1 = values[q1Index];
        const q3 = values[q3Index];

        const iqr = q3 - q1;

        const lowerBound =
          q1 - 1.5 * iqr;

        const upperBound =
          q3 + 1.5 * iqr;

        const outliers = values.filter(
          (value) =>
            value < lowerBound ||
            value > upperBound
        );

        outlierAnalysis[column] = {
          q1: Number(q1.toFixed(4)),
          q3: Number(q3.toFixed(4)),
          iqr: Number(iqr.toFixed(4)),
          lowerBound: Number(
            lowerBound.toFixed(4)
          ),
          upperBound: Number(
            upperBound.toFixed(4)
          ),
          outlierCount: outliers.length,
          outlierPercentage: Number(
            (
              (outliers.length / values.length) *
              100
            ).toFixed(2)
          )
        };
      }

      // ------------------------------------
      // Customer-level categorical summary
      // ------------------------------------

      const categoricalColumns = [
        "city",
        "operator",
        "network_type",
        "account_type"
      ];

      const categoricalSummary = {};

      for (const column of categoricalColumns) {
        const counts = {};

        for (const row of rows) {
          const value = row[column];

          counts[value] =
            (counts[value] || 0) + 1;
        }

        categoricalSummary[column] = counts;
      }

      // ------------------------------------
      // Churn summary
      // ------------------------------------

      const churnValues = rows.map((row) =>
        Number(row.churn)
      );

      const churned = churnValues.filter(
        (value) => value === 1
      ).length;

      const notChurned = churnValues.filter(
        (value) => value === 0
      ).length;

      const churnRate =
        churnValues.length > 0
          ? (churned / churnValues.length) * 100
          : 0;

      const churnSummary = {
        churned,
        notChurned,
        churnRatePercentage: Number(
          churnRate.toFixed(2)
        )
      };

      // ------------------------------------
      // Final EDA report
      // ------------------------------------

      const report = {
        generatedAt: new Date().toISOString(),

        dataset: {
          customers: rows.length,
          totalColumns: columns.length,
          numericFeatures: numericColumns.length
        },

        statistics,

        dataQuality: {
          missingValues,
          invalidValues,
          negativeValues,
          constantFeatures
        },

        zeroHeavyFeatures,

        outlierAnalysis,

        categoricalSummary,

        churnSummary
      };

      fs.writeFileSync(
        outputPath,
        JSON.stringify(report, null, 2),
        "utf8"
      );

      // ------------------------------------
      // Console output
      // ------------------------------------

      console.log(
        "\n========================================"
      );
      console.log(
        "          CUSTOMER FEATURE EDA"
      );
      console.log(
        "========================================"
      );

      console.log(
        "\nCustomers:",
        rows.length
      );

      console.log(
        "Total columns:",
        columns.length
      );

      console.log(
        "Numeric features:",
        numericColumns.length
      );

      console.log(
        "\n---------- FEATURE STATISTICS ----------"
      );

      for (const column of numericColumns) {
        const stat = statistics[column];

        console.log(
          `\n${column}`
        );

        console.log(
          `  Mean: ${stat.mean}`
        );

        console.log(
          `  Median: ${stat.median}`
        );

        console.log(
          `  Min: ${stat.min}`
        );

        console.log(
          `  Max: ${stat.max}`
        );

        console.log(
          `  Std Dev: ${stat.stdDev}`
        );
      }

      console.log(
        "\n---------- DATA QUALITY ----------"
      );

      console.log(
        "Missing values:",
        missingValues
      );

      console.log(
        "Invalid values:",
        invalidValues
      );

      console.log(
        "Negative values:",
        negativeValues
      );

      console.log(
        "Constant features:",
        constantFeatures.length
      );

      console.log(
        "\n---------- CHURN ----------"
      );

      console.log(
        "Churned customers:",
        churned
      );

      console.log(
        "Non-churned customers:",
        notChurned
      );

      console.log(
        "Churn rate:",
        `${churnRate.toFixed(2)}%`
      );

      console.log(
        "\nEDA report:",
        outputPath
      );

      console.log(
        "\n========================================\n"
      );

    } catch (error) {
      console.error(
        "\nEDA ERROR:",
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