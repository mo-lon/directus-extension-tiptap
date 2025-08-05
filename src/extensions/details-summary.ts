import DetailsSummary from "@tiptap/extension-details-summary";
import type { ExtensionMeta } from "./index";

const extension: ExtensionMeta = {
  name: "detailsSummary",
  title: "Details Summary",
  package: "@tiptap/extension-details-summary",
  group: "node",
  defaults: {},
  options: [],
  load() {
    return DetailsSummary;
  },
};

export default extension;
