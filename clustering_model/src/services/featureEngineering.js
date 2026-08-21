const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const inputPath = path.join(
  __dirname,
  "../../data/processed/cleaned_telecom.csv"
);

const outputPath = path.join(
  __dirname,
  "../../data/processed/customer_features.csv"
);

const rows = [];

fs.createReadStream(inputPath)
  .pipe(csv())
  .on("data", (row) => {
    rows.push(row);
  })
  .on("end", () => {
    try {
      const features = rows.map((row) => {
        const monthlyData = Number(row.monthly_data_gb);
        const monthlyVoice = Number(row.monthly_voice_minutes);
        const totalCalls = Number(row.total_calls);
        const monthlySms = Number(row.monthly_sms);
        const recharge = Number(row.monthly_recharge);

        return {
          customer_id: row.customer_id,

          // Customer profile
          age: Number(row.age),
          tenure_months: Number(row.tenure_months),

          // Data usage
          monthly_data_gb: monthlyData,
          avg_daily_data_gb: Number(row.avg_daily_data_gb),
          streaming_hours: Number(row.streaming_hours),
          hotspot_data_gb: Number(row.hotspot_data_gb),

          // Derived data behavior
          streaming_data_ratio:
            monthlyData > 0
              ? Number(
                  (
                    Number(row.streaming_hours) /
                    monthlyData
                  ).toFixed(4)
                )
              : 0,

          hotspot_data_ratio:
            monthlyData > 0
              ? Number(
                  (
                    Number(row.hotspot_data_gb) /
                    monthlyData
                  ).toFixed(4)
                )
              : 0,

          // Voice usage
          monthly_voice_minutes: monthlyVoice,
          total_calls: totalCalls,
          incoming_calls: Number(row.incoming_calls),
          outgoing_calls: Number(row.outgoing_calls),

          // Derived voice behavior
          avg_minutes_per_call:
            totalCalls > 0
              ? Number(
                  (
                    monthlyVoice /
                    totalCalls
                  ).toFixed(4)
                )
              : 0,

          // SMS
          monthly_sms: monthlySms,

          // International / roaming
          international_minutes:
            Number(row.international_minutes),

          roaming_voice_minutes:
            Number(row.roaming_voice_minutes),

          roaming_data_gb:
            Number(row.roaming_data_gb),

          // Derived roaming behavior
          international_voice_ratio:
            monthlyVoice > 0
              ? Number(
                  (
                    Number(row.international_minutes) /
                    monthlyVoice
                  ).toFixed(4)
                )
              : 0,

          roaming_voice_ratio:
            monthlyVoice > 0
              ? Number(
                  (
                    Number(row.roaming_voice_minutes) /
                    monthlyVoice
                  ).toFixed(4)
                )
              : 0,

          roaming_data_ratio:
            monthlyData > 0
              ? Number(
                  (
                    Number(row.roaming_data_gb) /
                    monthlyData
                  ).toFixed(4)
                )
              : 0,

          // Spending
          monthly_recharge: recharge,

          // Usage intensity
          total_usage_events:
            totalCalls + monthlySms,

          calls_per_rupee:
            recharge > 0
              ? Number(
                  (
                    totalCalls /
                    recharge
                  ).toFixed(4)
                )
              : 0,

          data_per_rupee:
            recharge > 0
              ? Number(
                  (
                    monthlyData /
                    recharge
                  ).toFixed(6)
                )
              : 0,

          // Target retained for analysis
          churn: Number(row.churn)
        };
      });

      // ------------------------------------
      // Validate generated features
      // ------------------------------------

      let invalidValues = 0;
      let negativeValues = 0;

      for (const customer of features) {
        for (const [key, value] of Object.entries(customer)) {

          if (
            typeof value === "number" &&
            !Number.isFinite(value)
          ) {
            invalidValues++;
          }

          if (
            typeof value === "number" &&
            value < 0
          ) {
            negativeValues++;
          }
        }
      }

      // ------------------------------------
      // Write CSV
      // ------------------------------------

      if (features.length === 0) {
        throw new Error(
          "No customer features were generated."
        );
      }

      const headers = Object.keys(features[0]);

      const csvLines = [
        headers.join(","),
        ...features.map((customer) =>
          headers
            .map((header) => customer[header])
            .join(",")
        )
      ];

      fs.writeFileSync(
        outputPath,
        csvLines.join("\n"),
        "utf8"
      );

      // ------------------------------------
      // Console report
      // ------------------------------------

      console.log(
        "\n========================================"
      );
      console.log(
        "       CUSTOMER FEATURE ENGINEERING"
      );
      console.log(
        "========================================"
      );

      console.log(
        "\nInput customers:",
        rows.length
      );

      console.log(
        "Output customers:",
        features.length
      );

      console.log(
        "Features created:",
        headers.length
      );

      console.log(
        "Invalid generated values:",
        invalidValues
      );

      console.log(
        "Negative generated values:",
        negativeValues
      );

      console.log(
        "\n========== GENERATED FEATURES =========="
      );

      headers.forEach((header, index) => {
        console.log(
          `${index + 1}. ${header}`
        );
      });

      console.log(
        "\nOutput:",
        outputPath
      );

      console.log(
        "\n========================================\n"
      );

      if (
        invalidValues > 0 ||
        negativeValues > 0
      ) {
        console.log(
          "WARNING: Review generated features."
        );
      } else {
        console.log(
          "Feature engineering status: PASS"
        );
      }

    } catch (error) {
      console.error(
        "\nFEATURE ENGINEERING ERROR:",
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