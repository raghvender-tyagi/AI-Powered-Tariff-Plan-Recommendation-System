const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const inputPath = path.join(
  __dirname,
  "../../data/raw/telecom_customer_usage_dummy_dataset_corrected.csv"
);

const expectedColumns = [
  "customer_id",
  "age",
  "city",
  "operator",
  "network_type",
  "account_type",
  "tenure_months",
  "monthly_data_gb",
  "avg_daily_data_gb",
  "streaming_hours",
  "hotspot_data_gb",
  "monthly_voice_minutes",
  "total_calls",
  "incoming_calls",
  "outgoing_calls",
  "international_minutes",
  "roaming_voice_minutes",
  "monthly_sms",
  "roaming_data_gb",
  "monthly_recharge",
  "churn"
];

let rowCount = 0;
let firstRow = null;

fs.createReadStream(inputPath)
  .pipe(csv())
  .on("data", (row) => {
    rowCount++;

    if (!firstRow) {
      firstRow = row;
    }
  })
  .on("end", () => {
    if (!firstRow) {
      console.error("Dataset is empty.");
      process.exit(1);
    }

    const actualColumns = Object.keys(firstRow);

    const missingColumns = expectedColumns.filter(
      (column) => !actualColumns.includes(column)
    );

    const unexpectedColumns = actualColumns.filter(
      (column) => !expectedColumns.includes(column)
    );

    console.log("\n========================================");
    console.log("        DATASET INSPECTION");
    console.log("========================================");

    console.log("\nFile:");
    console.log(inputPath);

    console.log("\nTotal rows:", rowCount);
    console.log("Total columns:", actualColumns.length);

    console.log("\n========== ACTUAL COLUMNS ==========");

    actualColumns.forEach((column, index) => {
      console.log(`${index + 1}. ${column}`);
    });

    console.log("\n========== FIRST ROW ==========");

    console.log(firstRow);

    console.log("\n========== SCHEMA VALIDATION ==========");

    if (missingColumns.length === 0) {
      console.log("Missing expected columns: 0");
    } else {
      console.log(
        "Missing expected columns:",
        missingColumns
      );
    }

    if (unexpectedColumns.length === 0) {
      console.log("Unexpected columns: 0");
    } else {
      console.log(
        "Unexpected columns:",
        unexpectedColumns
      );
    }

    console.log("\n========================================");

    if (
      missingColumns.length === 0 &&
      unexpectedColumns.length === 0
    ) {
      console.log("SCHEMA STATUS: PASS");
    } else {
      console.log("SCHEMA STATUS: REVIEW REQUIRED");
    }

    console.log("========================================\n");
  })
  .on("error", (error) => {
    console.error(
      "DATASET INSPECTION ERROR:",
      error.message
    );

    process.exit(1);
  });