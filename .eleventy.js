const { HtmlBasePlugin } = await import("@11ty/eleventy");
import { computeBaseline } from "compute-baseline";
import { Compat } from "compute-baseline/browser-compat-data";


// Remove this hack once https://github.com/11ty/eleventy-dependency-tree-esm/issues/2 is solved.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pkg = require("./package.json");

const bcd = new Compat();
let all = [];
for (const feature of bcd.walk(["api", "css", "javascript", "html", "http", "svg", "mathml", "webassembly", "webdriver"],)) {
  let baseline = false;
  try {
    baseline = JSON.parse(computeBaseline({compatKeys: [feature.id], withAncestors: false}).toJSON());
  } catch (e) {
    // TODO(calculation fails for some features)
  }

  // Ignore sub features that are nested deeply
  // But don't do that for JavaScript as the tree is nested more deeply
  if (feature.id.split(".").length > 3 && !feature.id.startsWith("javascript")) {
    continue;
  }

  // Ignore sub features that use "_"
  // But don't do that for _event, _static, _global_attributes
  // TODO this is still somewhat bad given it will ignore things that should be checked like interfaces in the WebGL space that contain "_"
  if (feature.id.includes('_') && !feature.id.includes('_event') && !feature.id.includes('_static') && !feature.id.includes('global_attributes')) {
      continue;
  }

  // Ignore iterables for now
  // https://github.com/orgs/mdn/discussions/707
  const iterableInterfaces = [
    "AudioParamMap",
    "CSSNumericArray",
    "CSSStyleDeclaration",
    "CSSTransformValue",
    "CSSUnparsedValue",
    "CustomStateSet",
    "DOMTokenList",
    "EventCounts",
    "FileSystemDirectoryHandle",
    "FontFaceSet",
    "FormData",
    "GPUSupportedFeatures",
    "Headers",
    "Highlight",
    "HighlightRegistry",
    "KeyboardLayoutMap",
    "MIDIInputMap",
    "MIDIOutputMap",
    "MediaKeyStatusMap",
    "NodeList",
    "PaymentInstruments",
    "ReadableStream",
    "StylePropertyMapReadOnly",
    "URLSearchParams",
    "ViewTransitionTypeSet",
    "WGSLLanguageFeatures",
    "WorkletSharedStorage",
    "XRAnchorSet",
    "XRHand",
    "XRInputSourceArray"
  ]
  const iterableMembers = [
    ".@@asyncIterator", ".@@iterator",
    ".entries", ".forEach",
    ".get", ".has",
    ".keys", ".size",
    ".values", ".add",
    ".clear", ".delete"
  ];

  if (iterableInterfaces.some(iface => feature.id.includes(iface))
    && iterableMembers.some(member => feature.id.endsWith(member))) {
    continue;
  }

  // Look for missing MDN URLs
  if (!feature.mdn_url) {
    all.push({id: feature.id, compat: feature.data.__compat, status: baseline});
  }
}

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPassthroughCopy("site/assets");
 
  eleventyConfig.addGlobalData("versions", async () => {
    return {
      date: new Date().toLocaleDateString(),
      bcd: pkg.devDependencies["@mdn/browser-compat-data"].replace('^', ''),
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
      return feature.status.support.chrome > 119 || feature.status.support.firefox > 119 || feature.status.support.safari > 17;
    }).sort((a, b) => new Date(b.status.baseline_low_date) -
    new Date(a.status.baseline_low_date));
  });

  eleventyConfig.addGlobalData("chromiumFeatures", async () => {
    return all.filter(feature =>  {
      return feature.status.support.chrome ;
    }).sort((a, b) =>  b.status.support.chrome  - a.status.support.chrome )
  });

  eleventyConfig.addGlobalData("geckoFeatures", async () => {
    return all.filter(feature =>  {
      return feature.status.support.firefox ;
    }).sort((a, b) =>  b.status.support.firefox  - a.status.support.firefox )
  });

  eleventyConfig.addGlobalData("webkitFeatures", async () => {
    return all.filter(feature =>  {
      return feature.status.support.safari ;
    }).sort((a, b) =>  b.status.support.safari  - a.status.support.safari )
  });

  return {
    dir: {
      input: "site",
      output: "docs",
    },
    pathPrefix: "/web-docs-backlog/",
  };
};
