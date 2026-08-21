const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const inputPath = path.join(
  __dirname,
  "../../../data/raw/telecom_customer_usage_dummy_dataset_corrected.csv"
);

const outputPath = path.join(
  __dirname,
  "../../../data/processed/cleaned_telecom.csv"
);

const reportPath = path.join(
  __dirname,
  "../../../data/processed/data_quality_report.json"
);

// ------------------------------------
// Expected columns
// ------------------------------------

const numericColumns = [
  "age",
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
  "monthly_recharge"
];

const categoricalColumns = [
  "city",
  "operator",
  "network_type",
  "account_type"
];

const requiredColumns = [
  "customer_id",
  ...numericColumns,
  ...categoricalColumns,
  "churn"
];

// ------------------------------------
// Read CSV
// ------------------------------------

function readCSV() {
  return new Promise((resolve, reject) => {
    const rows = [];

    fs.createReadStream(inputPath)
      .pipe(csv())
      .on("data", (row) => {
        rows.push(row);
      })
      .on("end", () => {
        resolve(rows);
      })
      .on("error", reject);
  });
}

// ------------------------------------
// Numeric validation
// ------------------------------------

function isValidNumber(value) {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  return Number.isFinite(Number(value));
}

// ------------------------------------
// Main cleaning process
// ------------------------------------

async function cleanDataset() {
  console.log("\n========================================");
  console.log("       TELECOM DATA QUALITY CHECK");
  console.log("========================================");

  if (!fs.existsSync(inputPath)) {
    throw new Error(
      `Input dataset not found: ${inputPath}`
    );
  }

  const rows = await readCSV();

  const rawRows = rows.length;

  // ----------------------------------
  // Check required columns
  // ----------------------------------

  if (rawRows === 0) {
    throw new Error("Dataset contains no rows.");
  }

  const actualColumns = Object.keys(rows[0]);

  const missingColumns = requiredColumns.filter(
    (column) => !actualColumns.includes(column)
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `Missing required columns: ${missingColumns.join(", ")}`
    );
  }

  // ----------------------------------
  // Counters
  // ----------------------------------

  let duplicatesRemoved = 0;
  let invalidRowsRemoved = 0;
  let missingValues = 0;
  let invalidNumericValues = 0;
  let negativeValues = 0;
  let invalidCategoricalValues = 0;
  let invalidChurnValues = 0;

  const seenRows = new Set();
  const seenCustomers = new Set();

  const cleanedRows = [];

  // ----------------------------------
  // Allowed categorical values
  // ----------------------------------

  const allowedNetworkTypes = [
    "4G",
    "5G"
  ];

  const allowedAccountTypes = [
    "Individual",
    "Family",
    "Business"
  ];

  // ----------------------------------
  // Process rows
  // ----------------------------------

  for (const originalRow of rows) {

    // Exact duplicate detection
    const rowSignature = JSON.stringify(originalRow);

    if (seenRows.has(rowSignature)) {
      duplicatesRemoved++;
      continue;
    }

    seenRows.add(rowSignature);

    let invalid = false;

    // -------------------------------
    // Customer ID
    // -------------------------------

    const customerId =
      String(originalRow.customer_id || "").trim();

    if (!customerId) {
      missingValues++;
      invalid = true;
    }

    // -------------------------------
    // Required categorical fields
    // -------------------------------

    for (const column of categoricalColumns) {
      const value =
        String(originalRow[column] || "").trim();

      if (!value) {
        missingValues++;
        invalid = true;
      }
    }

    // -------------------------------
    // Numeric fields
    // -------------------------------

    const numericValues = {};

    for (const column of numericColumns) {

      const rawValue = originalRow[column];

      if (
        rawValue === null ||
        rawValue === undefined ||
        String(rawValue).trim() === ""
      ) {
        missingValues++;
        invalid = true;
        continue;
      }

      if (!isValidNumber(rawValue)) {
        invalidNumericValues++;
        invalid = true;
        continue;
      }

      const value = Number(rawValue);

      numericValues[column] = value;

      if (value < 0) {
        negativeValues++;
        invalid = true;
      }
    }

    // -------------------------------
    // Churn validation
    // -------------------------------

    const churn = Number(originalRow.churn);

    if (
      !Number.isInteger(churn) ||
      (churn !== 0 && churn !== 1)
    ) {
      invalidChurnValues++;
      invalid = true;
    }

    // -------------------------------
    // Network validation
    // -------------------------------

    if (
      !allowedNetworkTypes.includes(
        String(originalRow.network_type).trim()
      )
    ) {
      invalidCategoricalValues++;
      invalid = true;
    }

    // -------------------------------
    // Account type validation
    // -------------------------------

    if (
      !allowedAccountTypes.includes(
        String(originalRow.account_type).trim()
      )
    ) {
      invalidCategoricalValues++;
      invalid = true;
    }

    // -------------------------------
    // Customer ID uniqueness
    // -------------------------------

    if (seenCustomers.has(customerId)) {
      // A duplicate customer ID is not
      // automatically treated as a bad row.
      // We handle this as a separate quality
      // metric below.
    }

    seenCustomers.add(customerId);

    // -------------------------------
    // Remove invalid row
    // -------------------------------

    if (invalid) {
      invalidRowsRemoved++;
      continue;
    }

    // -------------------------------
    // Build normalized clean row
    // -------------------------------

    const cleanRow = {
      customer_id: customerId,
      age: numericValues.age,
      city: String(originalRow.city).trim(),
      operator: String(originalRow.operator).trim(),
      network_type:
        String(originalRow.network_type).trim(),
      account_type:
        String(originalRow.account_type).trim(),
      tenure_months:
        numericValues.tenure_months,
      monthly_data_gb:
        numericValues.monthly_data_gb,
      avg_daily_data_gb:
        numericValues.avg_daily_data_gb,
      streaming_hours:
        numericValues.streaming_hours,
      hotspot_data_gb:
        numericValues.hotspot_data_gb,
      monthly_voice_minutes:
        numericValues.monthly_voice_minutes,
      total_calls:
        numericValues.total_calls,
      incoming_calls:
        numericValues.incoming_calls,
      outgoing_calls:
        numericValues.outgoing_calls,
      international_minutes:
        numericValues.international_minutes,
      roaming_voice_minutes:
        numericValues.roaming_voice_minutes,
      monthly_sms:
        numericValues.monthly_sms,
      roaming_data_gb:
        numericValues.roaming_data_gb,
      monthly_recharge:
        numericValues.monthly_recharge,
      churn
    };

    cleanedRows.push(cleanRow);
  }

  // ----------------------------------
  // Validate relationships
  // ----------------------------------

  let logicalErrors = 0;

  for (const row of cleanedRows) {

    // Daily average should not exceed
    // monthly usage / approximately 1 day
    if (row.avg_daily_data_gb > row.monthly_data_gb) {
      logicalErrors++;
    }

    // Roaming usage cannot exceed total
    // corresponding usage
    if (
      row.roaming_data_gb >
      row.monthly_data_gb
    ) {
      logicalErrors++;
    }

    if (
      row.roaming_voice_minutes >
      row.monthly_voice_minutes
    ) {
      logicalErrors++;
    }

    if (
      row.international_minutes >
      row.monthly_voice_minutes
    ) {
      logicalErrors++;
    }

    if (
      row.incoming_calls +
        row.outgoing_calls <
      row.total_calls
    ) {
      logicalErrors++;
    }
  }

  // ----------------------------------
  // Write cleaned CSV
  // ----------------------------------

  const headers = requiredColumns;

  const csvLines = [
    headers.join(","),
    ...cleanedRows.map((row) =>
      headers
        .map((column) => {
          const value = row[column];

          if (
            typeof value === "string" &&
            value.includes(",")
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }

          return value;
        })
        .join(",")
    )
  ];

  fs.mkdirSync(
    path.dirname(outputPath),
    { recursive: true }
  );

  fs.writeFileSync(
    outputPath,
    csvLines.join("\n"),
    "utf8"
  );

  // ----------------------------------
  // Quality report
  // ----------------------------------

  const report = {
    dataset: "telecom_customer_usage_dummy_dataset.csv",

    rawRows,

    exactDuplicatesRemoved:
      duplicatesRemoved,

    invalidRowsRemoved,

    finalCleanRows:
      cleanedRows.length,

    uniqueCustomers:
      new Set(
        cleanedRows.map(
          (row) => row.customer_id
        )
      ).size,

    qualityChecks: {
      missingValues,
      invalidNumericValues,
      negativeValues,
      invalidCategoricalValues,
      invalidChurnValues,
      logicalErrors
    },

    validationStatus:
      invalidRowsRemoved === 0 &&
      missingValues === 0 &&
      invalidNumericValues === 0 &&
      negativeValues === 0 &&
      invalidCategoricalValues === 0 &&
      invalidChurnValues === 0 &&
      logicalErrors === 0
        ? "PASS"
        : "REVIEW REQUIRED",

    output:
      outputPath,

    generatedAt:
      new Date().toISOString()
  };

  fs.writeFileSync(
    reportPath,
    JSON.stringify(report, null, 2),
    "utf8"
  );

  // ----------------------------------
  // Console report
  // ----------------------------------

  console.log("\nRaw rows:", rawRows);

  console.log(
    "Exact duplicates removed:",
    duplicatesRemoved
  );

  console.log(
    "Invalid rows removed:",
    invalidRowsRemoved
  );

  console.log(
    "Final clean rows:",
    cleanedRows.length
  );

  console.log(
    "Unique customers:",
    report.uniqueCustomers
  );

  console.log("\n---------- QUALITY CHECKS ----------");

  console.log(
    "Missing values:",
    missingValues
  );

  console.log(
    "Invalid numeric values:",
    invalidNumericValues
  );

  console.log(
    "Negative values:",
    negativeValues
  );

  console.log(
    "Invalid categorical values:",
    invalidCategoricalValues
  );

  console.log(
    "Invalid churn values:",
    invalidChurnValues
  );

  console.log(
    "Logical errors:",
    logicalErrors
  );

  console.log(
    "\nValidation status:",
    report.validationStatus
  );

  console.log(
    "\nCleaned file:",
    outputPath
  );

  console.log(
    "Quality report:",
    reportPath
  );

  console.log(
    "\n========================================\n"
  );
}

cleanDataset().catch((error) => {
  console.error(
    "\nDATA CLEANING ERROR:",
    error.message
  );

  process.exit(1);
});