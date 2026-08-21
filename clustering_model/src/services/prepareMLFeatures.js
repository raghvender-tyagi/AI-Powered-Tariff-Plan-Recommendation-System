const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const inputPath = path.join(
  __dirname,
  "../../../data/processed/customer_features.csv"
);

const outputPath = path.join(
  __dirname,
  "../../../data/processed/ml_features.csv"
);

// These are the features we decided to use for clustering.
// customer_id and churn are deliberately excluded.
const selectedFeatures = [
  "monthly_data_gb",
  "streaming_hours",
  "hotspot_data_gb",

  "monthly_voice_minutes",
  "avg_minutes_per_call",

  "monthly_sms",

  "international_minutes",

  "roaming_voice_minutes",
  "roaming_data_gb",

  "monthly_recharge",

  "tenure_months"
];

const rows = [];

fs.createReadStream(inputPath)
  .pipe(csv())
  .on("data", (row) => {
    rows.push(row);
  })
  .on("end", () => {
    try {
      if (rows.length === 0) {
        throw new Error(
          "customer_features.csv is empty."
        );
      }

      // ------------------------------------
      // Verify selected features exist
      // ------------------------------------

      const availableColumns =
        Object.keys(rows[0]);

      const missingFeatures =
        selectedFeatures.filter(
          (feature) =>
            !availableColumns.includes(feature)
        );

      if (missingFeatures.length > 0) {
        throw new Error(
          `Missing ML features: ${missingFeatures.join(", ")}`
        );
      }

      // ------------------------------------
      // Convert values to numbers
      // ------------------------------------

      const numericData = {};

      for (const feature of selectedFeatures) {
        numericData[feature] = rows.map((row) =>
          Number(row[feature])
        );

        const invalid = numericData[
          feature
        ].some(
          (value) =>
            !Number.isFinite(value)
        );

        if (invalid) {
          throw new Error(
            `Invalid numeric value found in ${feature}`
          );
        }
      }

      // ------------------------------------
      // Calculate percentile bounds
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

      // ------------------------------------
      // Robust clipping
      //
      // We don't delete outliers.
      // We cap extreme values at the
      // 1st and 99th percentiles.
      // ------------------------------------

      const bounds = {};

      for (const feature of selectedFeatures) {
        const values = numericData[feature];

        bounds[feature] = {
          lower: percentile(values, 0.01),
          upper: percentile(values, 0.99)
        };
      }

      // ------------------------------------
      // Clip values
      // ------------------------------------

      const clippedData = {};

      for (const feature of selectedFeatures) {
        const lower =
          bounds[feature].lower;

        const upper =
          bounds[feature].upper;

        clippedData[feature] =
          numericData[feature].map(
            (value) =>
              Math.min(
                Math.max(value, lower),
                upper
              )
          );
      }

      // ------------------------------------
      // Min-Max normalization
      // ------------------------------------

      const normalizedData = {};

      const normalizationStats = {};

      for (const feature of selectedFeatures) {
        const values =
          clippedData[feature];

        const min = Math.min(...values);
        const max = Math.max(...values);

        normalizationStats[feature] = {
          min: Number(min.toFixed(6)),
          max: Number(max.toFixed(6))
        };

        normalizedData[feature] =
          values.map((value) => {
            if (max === min) {
              return 0;
            }

            return Number(
              (
                (value - min) /
                (max - min)
              ).toFixed(6)
            );
          });
      }

      // ------------------------------------
      // Build ML dataset
      // ------------------------------------

      const mlRows = rows.map(
        (row, index) => {
          const result = {
            customer_id:
              row.customer_id
          };

          for (const feature of selectedFeatures) {
            result[feature] =
              normalizedData[feature][
                index
              ];
          }

          return result;
        }
      );

      // ------------------------------------
      // Validate normalized data
      // ------------------------------------

      let invalidValues = 0;
      let outOfRangeValues = 0;

      for (const row of mlRows) {
        for (const feature of selectedFeatures) {
          const value = row[feature];

          if (!Number.isFinite(value)) {
            invalidValues++;
          }

          if (
            value < 0 ||
            value > 1
          ) {
            outOfRangeValues++;
          }
        }
      }

      // ------------------------------------
      // Write ML CSV
      // ------------------------------------

      const headers = [
        "customer_id",
        ...selectedFeatures
      ];

      const csvLines = [
        headers.join(","),
        ...mlRows.map((row) =>
          headers
            .map(
              (header) =>
                row[header]
            )
            .join(",")
        )
      ];

      fs.writeFileSync(
        outputPath,
        csvLines.join("\n"),
        "utf8"
      );

      // ------------------------------------
      // Report
      // ------------------------------------

      console.log(
        "\n========================================"
      );
      console.log(
        "          ML FEATURE PREPARATION"
      );
      console.log(
        "========================================"
      );

      console.log(
        "\nCustomers:",
        mlRows.length
      );

      console.log(
        "Selected features:",
        selectedFeatures.length
      );

      console.log(
        "Outlier treatment:",
        "1st–99th percentile clipping"
      );

      console.log(
        "Normalization:",
        "Min-Max"
      );

      console.log(
        "Normalized range:",
        "[0, 1]"
      );

      console.log(
        "Invalid normalized values:",
        invalidValues
      );

      console.log(
        "Out-of-range values:",
        outOfRangeValues
      );

      console.log(
        "\n---------- FEATURES ----------"
      );

      selectedFeatures.forEach(
        (feature, index) => {
          console.log(
            `${index + 1}. ${feature}`
          );
        }
      );

      console.log(
        "\nOutput:",
        outputPath
      );

      console.log(
        "\n========================================"
      );

      if (
        invalidValues === 0 &&
        outOfRangeValues === 0
      ) {
        console.log(
          "ML feature preparation: PASS"
        );
      } else {
        console.log(
          "ML feature preparation: REVIEW REQUIRED"
        );
      }

      console.log(
        "========================================\n"
      );

    } catch (error) {
      console.error(
        "\nML FEATURE PREPARATION ERROR:",
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