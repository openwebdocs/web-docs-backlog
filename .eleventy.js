const { HtmlBasePlugin } = await import("@11ty/eleventy");
import { computeBaseline } from "compute-baseline";
import { Compat } from "compute-baseline/browser-compat-data";

const bcd = new Compat();
let all = [];
for (const feature of bcd.walk()) {
  let baseline = false;
  try {
    baseline = JSON.parse(computeBaseline({compatKeys: [feature.id], withAncestors: false}).toJSON());
  } catch (e) {
    // TODO(calculation fails for some features)
  }

  // Ignore sub features
  // JavaScript is more nested so don't ignore there
  // Might need to redo this and ignore the trees less eagerly
  if (feature.id.split(".").length > 3 && !feature.id.startsWith("javascript") || feature.id.includes('_') ) {
    continue;
  }
  // Look for missing MDN URLs
  if (!feature.mdn_url
      && !feature.deprecated
      && feature.data.__compat.status.standard_track ) {
    all.push({id: feature.id, compat: feature.data.__compat, status: baseline});
  }
}

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPassthroughCopy("site/assets");
 
  eleventyConfig.addGlobalData("versions", async () => {
    return {
      date: new Date().toLocaleDateString(),
    // bcd: ???.__meta.version, TODO: Fix this
    };
  });

  eleventyConfig.addGlobalData("allFeatures", async () => {
    return all;
  });

  eleventyConfig.addGlobalData("baselineFeatures", async () => {
    return all.filter(feature => feature.status.baseline === "high")
    .sort((a, b) => new Date(b.status.baseline_high_date) -
    new Date(a.status.baseline_high_date));
  });

  eleventyConfig.addGlobalData("recentBaselineFeatures", async () => {
    return all.filter(feature => feature.status.baseline === "low")
              .sort((a, b) => new Date(b.status.baseline_low_date) -
              new Date(a.status.baseline_low_date));
  });

  eleventyConfig.addGlobalData("limitedFeatures", async () => {
    return all.filter(feature =>  {
      return feature.status.baseline === false;
    }).sort((a, b) => Object.keys(b.status.support).length - Object.keys(a.status.support).length);
  });

  eleventyConfig.addGlobalData("freshFeatures", async () => {
    return all.filter(feature =>  {
      return feature.status.support.chrome > 120 || feature.status.support.firefox > 120 || feature.status.support.safari > 17;
    }).sort((a, b) => new Date(b.status.baseline_low_date) -
    new Date(a.status.baseline_low_date)).sort((a, b) => Object.keys(b.status.support).length - Object.keys(a.status.support).length);
  });

  return {
    dir: {
      input: "site",
      output: "docs",
    },
    pathPrefix: "/web-docs-backlog/",
  };
};
