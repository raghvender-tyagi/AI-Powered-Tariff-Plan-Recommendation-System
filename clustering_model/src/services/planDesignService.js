const fs = require("fs");
const path = require("path");

class PlanDesignService {
  constructor(options = {}) {
    this.clusterProfilesPath =
      options.clusterProfilesPath ||
      path.resolve(
        __dirname,
        "../../../data/processed/cluster_profiles.json"
      );

    this.outputPath =
      options.outputPath ||
      path.resolve(
        __dirname,
        "../../../data/processed/plan_catalog.json"
      );
  }

  getClusterProfiles(clusterData = null) {
    if (clusterData) {
      return clusterData;
    }

    const raw = fs.readFileSync(
      this.clusterProfilesPath,
      "utf8"
    );

    return JSON.parse(raw);
  }

  buildPlan(clusterId, clusterProfile) {
    const averages = clusterProfile.averages || {};
    const monthlyData = Number(averages.monthly_data_gb || 0);
    const monthlyVoice = Number(averages.monthly_voice_minutes || 0);
    const monthlyRecharge = Number(averages.monthly_recharge || 0);
    const churnRate = Number(averages.churn || 0);

    let planName = "Essential Plan";
    let price = 199;
    let dataLimit = 10;
    let voiceLimit = 400;
    let description = "Balanced plan for everyday users.";
    let recommendation = "Best for light to moderate usage households.";

    if (monthlyData >= 25 || monthlyRecharge >= 700) {
      planName = "Ultra Data Plus";
      price = 699;
      dataLimit = 40;
      voiceLimit = 2000;
      description =
        "High-volume data and streaming plan designed for power users.";
      recommendation =
        "Recommended for customers with intensive streaming, hotspot, and heavy mobile data behavior.";
    } else if (monthlyData >= 12 || monthlyVoice >= 220) {
      planName = "Smart Unlimited";
      price = 399;
      dataLimit = 25;
      voiceLimit = 1200;
      description =
        "Balanced value plan for regular broadband and voice users.";
      recommendation =
        "Recommended for customers with steady data use and moderate-to-heavy calling habits.";
    } else if (monthlyData < 8) {
      planName = "Lite Access";
      price = 149;
      dataLimit = 5;
      voiceLimit = 300;
      description =
        "Cost-efficient plan for low-volume, budget-focused users.";
      recommendation =
        "Recommended for customers with limited usage and a strong focus on affordability.";
    }

    const retentionRisk = churnRate > 0.13 ? "High" : churnRate > 0.11 ? "Medium" : "Low";

    return {
      id: `plan-${clusterId}`,
      clusterId: Number(clusterId),
      name: planName,
      price,
      dataLimitGb: dataLimit,
      voiceMinutes: voiceLimit,
      description,
      recommendation,
      targetSegment: clusterProfile.preliminaryPersona || "General users",
      retentionRisk,
      expectedMonthlyRecharge: Number(
        monthlyRecharge.toFixed(2)
      ),
      estimatedAvgDataGb: Number(
        monthlyData.toFixed(2)
      ),
      estimatedAvgVoiceMinutes: Number(
        monthlyVoice.toFixed(2)
      )
    };
  }

  designPlan(clusterData = null) {
    const source = this.getClusterProfiles(clusterData);

    const clusterList = source && source.clusters
      ? Object.values(source.clusters)
      : Array.isArray(source)
        ? source
        : [];

    if (clusterList.length === 0) {
      throw new Error("No cluster data was provided to design plans.");
    }

    const plans = clusterList.map((clusterProfile) =>
      this.buildPlan(clusterProfile.cluster, clusterProfile)
    );

    const catalog = {
      generatedAt: new Date().toISOString(),
      totalPlans: plans.length,
      plans
    };

    fs.mkdirSync(path.dirname(this.outputPath), {
      recursive: true
    });

    fs.writeFileSync(
      this.outputPath,
      JSON.stringify(catalog, null, 2),
      "utf8"
    );

    return catalog;
  }
}

module.exports = PlanDesignService;
