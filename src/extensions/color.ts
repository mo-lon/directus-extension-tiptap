import type { ExtensionMeta } from "./index";

type Options = {
  types: string[];
};

export type ColorProps = {
  colorTypes: Options["types"];
};

const defaults: Options = {
  types: ["textStyle"], // usually paired with TextStyle
};

const extension: ExtensionMeta<Options, ColorProps> = {
  name: "color",
  title: "Color",
  package: "@tiptap/extension-color",
  group: "mark",
  defaults,
  options: [
    {
      field: "colorTypes",
      name: "Target types",
      type: "json",
      meta: {
        interface: "input-code",
        width: "full",
        note: "Node or mark types where color should be applied (usually textStyle).",
      },
      schema: {
        default_value: defaults.types,
      },
    },
  ],
  load: async (props) => {
    const { Color } = await import("@tiptap/extension-color");
    return Color.configure({
      types: props.colorTypes ?? ["textStyle"],
    });
  },
};

export default extension;
