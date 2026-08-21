const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const ROOT = path.resolve(__dirname, "../..");

const ML_FEATURES_PATH = path.join(
  ROOT,
  "data",
  "processed",
  "ml_features.csv"
);

const CLUSTERS_PATH = path.join(
  ROOT,
  "data",
  "processed",
  "customer_clusters.csv"
);

const OUTPUT_HTML = path.join(
  ROOT,
  "data",
  "processed",
  "cluster_visualization.html"
);

const OUTPUT_JSON = path.join(
  ROOT,
  "data",
  "processed",
  "pca_report.json"
);

function loadCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

function dot(a, b) {
  let sum = 0;

  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }

  return sum;
}

function norm(vector) {
  return Math.sqrt(dot(vector, vector));
}

function normalize(vector) {
  const n = norm(vector);

  if (n === 0) {
    return vector.map(() => 0);
  }

  return vector.map((value) => value / n);
}

function covarianceMatrix(X) {
  const rows = X.length;
  const cols = X[0].length;

  const covariance = Array.from(
    { length: cols },
    () => Array(cols).fill(0)
  );

  for (let i = 0; i < cols; i++) {
    for (let j = i; j < cols; j++) {
      let sum = 0;

      for (let r = 0; r < rows; r++) {
        sum += X[r][i] * X[r][j];
      }

      const value = sum / (rows - 1);

      covariance[i][j] = value;
      covariance[j][i] = value;
    }
  }

  return covariance;
}

function matrixVectorMultiply(matrix, vector) {
  return matrix.map((row) => dot(row, vector));
}

function powerIteration(matrix, iterations = 500) {
  let vector = matrix[0].map((_, index) =>
    index === 0 ? 1 : 1 / (index + 1)
  );

  vector = normalize(vector);

  for (let i = 0; i < iterations; i++) {
    const next = normalize(matrixVectorMultiply(matrix, vector));

    const difference = Math.sqrt(
      next.reduce(
        (sum, value, index) =>
          sum + Math.pow(value - vector[index], 2),
        0
      )
    );

    vector = next;

    if (difference < 1e-10) {
      break;
    }
  }

  const Av = matrixVectorMultiply(matrix, vector);
  const eigenvalue = dot(vector, Av);

  return {
    vector,
    eigenvalue
  };
}

function deflate(matrix, eigenvector, eigenvalue) {
  return matrix.map((row, i) =>
    row.map(
      (value, j) =>
        value - eigenvalue * eigenvector[i] * eigenvector[j]
    )
  );
}

function centerData(X) {
  const rows = X.length;
  const cols = X[0].length;

  const means = Array(cols).fill(0);

  for (const row of X) {
    for (let j = 0; j < cols; j++) {
      means[j] += row[j];
    }
  }

  for (let j = 0; j < cols; j++) {
    means[j] /= rows;
  }

  const centered = X.map((row) =>
    row.map((value, j) => value - means[j])
  );

  return {
    centered,
    means
  };
}

function project(X, component) {
  return X.map((row) => dot(row, component));
}

function minMax(values) {
  let min = Infinity;
  let max = -Infinity;

  for (const value of values) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  return { min, max };
}

function scale(value, min, max, start, end) {
  if (max === min) {
    return (start + end) / 2;
  }

  return (
    start +
    ((value - min) / (max - min)) * (end - start)
  );
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateHTML(points, explainedVariance) {
  const width = 1100;
  const height = 700;

  const marginLeft = 80;
  const marginRight = 40;
  const marginTop = 70;
  const marginBottom = 80;

  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  const pc1 = points.map((p) => p.pc1);
  const pc2 = points.map((p) => p.pc2);

  const xRange = minMax(pc1);
  const yRange = minMax(pc2);

  const elements = [];

  for (const point of points) {
    const x = scale(
      point.pc1,
      xRange.min,
      xRange.max,
      marginLeft,
      marginLeft + plotWidth
    );

    const y = scale(
      point.pc2,
      yRange.min,
      yRange.max,
      marginTop + plotHeight,
      marginTop
    );

    const clusterClass =
      Number(point.cluster) === 0
        ? "cluster-zero"
        : "cluster-one";

    elements.push(`
      <circle
        cx="${x.toFixed(2)}"
        cy="${y.toFixed(2)}"
        r="2.4"
        class="${clusterClass}"
      >
        <title>
          Customer: ${escapeHTML(point.customer_id)}
          | Cluster: ${escapeHTML(point.cluster)}
        </title>
      </circle>
    `);
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Customer Cluster PCA Visualization</title>

<style>
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 30px;
  background: #f5f5f5;
}

.container {
  max-width: 1150px;
  margin: auto;
  background: white;
  padding: 25px;
  border-radius: 10px;
}

h1 {
  margin-top: 0;
}

.subtitle {
  color: #555;
  margin-bottom: 20px;
}

svg {
  width: 100%;
  height: auto;
  border: 1px solid #ddd;
  background: white;
}

.cluster-zero {
  fill: #2563eb;
  opacity: 0.35;
}

.cluster-one {
  fill: #dc2626;
  opacity: 0.45;
}

.axis {
  stroke: #333;
  stroke-width: 1;
}

.grid {
  stroke: #ddd;
  stroke-width: 1;
}

.legend {
  font-size: 14px;
}

.stats {
  margin-top: 20px;
  padding: 15px;
  background: #f8f8f8;
  border-radius: 6px;
}
</style>
</head>

<body>

<div class="container">

<h1>K-Means Customer Cluster Visualization</h1>

<div class="subtitle">
PCA projection of the 11 normalized ML features into two dimensions.
</div>

<svg
  viewBox="0 0 ${width} ${height}"
  xmlns="http://www.w3.org/2000/svg"
>

<!-- Grid -->
<line
  x1="${marginLeft}"
  y1="${marginTop}"
  x2="${marginLeft}"
  y2="${marginTop + plotHeight}"
  class="axis"
/>

<line
  x1="${marginLeft}"
  y1="${marginTop + plotHeight}"
  x2="${marginLeft + plotWidth}"
  y2="${marginTop + plotHeight}"
  class="axis"
/>

<!-- Points -->

${elements.join("\n")}

<!-- Labels -->

<text
  x="${marginLeft + plotWidth / 2}"
  y="${height - 25}"
  text-anchor="middle"
>
  Principal Component 1
</text>

<text
  x="20"
  y="${marginTop + plotHeight / 2}"
  text-anchor="middle"
  transform="rotate(-90 20 ${marginTop + plotHeight / 2})"
>
  Principal Component 2
</text>

<!-- Legend -->

<circle
  cx="${width - 190}"
  cy="35"
  r="6"
  class="cluster-zero"
/>

<text
  x="${width - 175}"
  y="40"
  class="legend"
>
  Cluster 0
</text>

<circle
  cx="${width - 95}"
  cy="35"
  r="6"
  class="cluster-one"
/>

<text
  x="${width - 80}"
  y="40"
  class="legend"
>
  Cluster 1
</text>

</svg>

<div class="stats">

<strong>Explained Variance</strong><br>

PC1:
${(explainedVariance[0] * 100).toFixed(2)}%

&nbsp;&nbsp;&nbsp;

PC2:
${(explainedVariance[1] * 100).toFixed(2)}%

<br><br>

<strong>Total:</strong>
${(
  (explainedVariance[0] + explainedVariance[1]) *
  100
).toFixed(2)}%

<br><br>

<strong>Customers visualized:</strong>
${points.length}

</div>

</div>

</body>
</html>`;
}

async function main() {
  console.log("========================================");
  console.log("       PCA CLUSTER VISUALIZATION");
  console.log("========================================");

  if (!fs.existsSync(ML_FEATURES_PATH)) {
    throw new Error(
      `ML features not found: ${ML_FEATURES_PATH}`
    );
  }

  if (!fs.existsSync(CLUSTERS_PATH)) {
    throw new Error(
      `Cluster assignments not found: ${CLUSTERS_PATH}`
    );
  }

  const [featureRows, clusterRows] = await Promise.all([
    loadCSV(ML_FEATURES_PATH),
    loadCSV(CLUSTERS_PATH)
  ]);

  console.log(`Customers: ${featureRows.length}`);
  console.log(`Features: ${Object.keys(featureRows[0]).length}`);

  const featureNames = Object.keys(featureRows[0]).filter(
    (name) => name !== "customer_id"
  );

  const X = featureRows.map((row) =>
    featureNames.map((feature) => Number(row[feature]))
  );

  const clusterMap = new Map();

  for (const row of clusterRows) {
    clusterMap.set(
      row.customer_id,
      Number(row.cluster)
    );
  }

  const { centered } = centerData(X);

  const covariance = covarianceMatrix(centered);

  // First principal component
  const pc1Result = powerIteration(covariance);

  // Remove PC1 contribution before finding PC2
  const deflated = deflate(
    covariance,
    pc1Result.vector,
    pc1Result.eigenvalue
  );

  // Second principal component
  const pc2Result = powerIteration(deflated);

  const totalVariance = covariance.reduce(
    (sum, row, i) => sum + row[i],
    0
  );

  const explainedVariance = [
    pc1Result.eigenvalue / totalVariance,
    pc2Result.eigenvalue / totalVariance
  ];

  const pc1Scores = project(
    centered,
    pc1Result.vector
  );

  const pc2Scores = project(
    centered,
    pc2Result.vector
  );

  const points = featureRows.map((row, index) => ({
    customer_id: row.customer_id,
    cluster: clusterMap.get(row.customer_id),
    pc1: pc1Scores[index],
    pc2: pc2Scores[index]
  }));

  const clusterCounts = {};

  for (const point of points) {
    const cluster = String(point.cluster);

    clusterCounts[cluster] =
      (clusterCounts[cluster] || 0) + 1;
  }

  const report = {
    method: "PCA",
    customers: points.length,
    input_features: featureNames,
    output_dimensions: 2,
    explained_variance: explainedVariance,
    total_explained_variance:
      explainedVariance[0] + explainedVariance[1],
    cluster_counts: clusterCounts,
    components: {
      pc1: pc1Result.vector,
      pc2: pc2Result.vector
    }
  };

  fs.writeFileSync(
    OUTPUT_JSON,
    JSON.stringify(report, null, 2)
  );

  const html = generateHTML(
    points,
    explainedVariance
  );

  fs.writeFileSync(
    OUTPUT_HTML,
    html
  );

  console.log("");
  console.log("---------- PCA RESULTS ----------");

  console.log(
    `PC1 explained variance: ${(explainedVariance[0] * 100).toFixed(2)}%`
  );

  console.log(
    `PC2 explained variance: ${(explainedVariance[1] * 100).toFixed(2)}%`
  );

  console.log(
    `Total explained variance: ${(
      (explainedVariance[0] +
        explainedVariance[1]) *
      100
    ).toFixed(2)}%`
  );

  console.log("");
  console.log("---------- CLUSTERS ----------");

  for (const [cluster, count] of Object.entries(
    clusterCounts
  )) {
    console.log(
      `Cluster ${cluster}: ${count} customers`
    );
  }

  console.log("");
  console.log(`Visualization: ${OUTPUT_HTML}`);
  console.log(`Report: ${OUTPUT_JSON}`);

  console.log("========================================");
  console.log("PCA visualization status: PASS");
  console.log("========================================");
}

main().catch((error) => {
  console.error("");
  console.error("PCA VISUALIZATION ERROR:");
  console.error(error.message);
  process.exit(1);
});