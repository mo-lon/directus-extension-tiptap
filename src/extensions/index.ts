import type { AnyExtension, Extensions } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import type { DeepPartial, Field } from "@directus/types";
import underline from "./underline";
import textAlign, { type TextAlignProps } from "./text-align";
import characterCount, { type CharacterCountProps } from "./character-count";
import subscript from "./subscript";
import superscript from "./superscript";
import highlight from "./highlight";
import typography from "./typography";
import placeholder, { type PlaceholderProps } from "./placeholder";
import link from "./link";
import focus, { type FocusProps } from "./focus";
import table, { type TableProps } from "./table";
import image, { type ImageProps } from "./image";
import paragraph from "./paragraph";
import uniqueId, { type UniqueIDProps } from "./unique-id";
import color, { type ColorProps } from "./color";
import textStyle from "./text-style";
import heading from "./heading";
import details from "./details";
import detailsContent from "./details-content";
import detailsSummary from "./details-summary";
import spacer from "./spacer";
import bulletList from "./bullet-list";
import orderedList from "./ordered-list";
import layout from "./layout";
import layoutColumn from "./layout-column";

type ExtensionGroup = "mark" | "node" | "editor";

export const extensionsGroups: { group: ExtensionGroup; label: string }[] = [
  { group: "mark", label: "Marks" },
  { group: "node", label: "Nodes" },
  { group: "editor", label: "Editor" },
];

export type ExtensionsProps = {
  extensions: string[] | null;
} & TableProps &
  ImageProps &
  TextAlignProps &
  PlaceholderProps &
  FocusProps &
  CharacterCountProps &
  UniqueIDProps &
  ColorProps;

export interface ExtensionMeta<
  Options extends object = object,
  Props extends object = object,
> {
  name: string;
  title: string;
  package: string;
  group: ExtensionGroup;
  options: DeepPartial<Field>[];
  defaults: Options;
  load(props: Props): AnyExtension;
}

export const extensionsMeta: ExtensionMeta[] = [
  // marks
  highlight,
  link,
  superscript,
  subscript,
  underline,
  textStyle,
  color,
  // nodes
  layout,
  layoutColumn,
  bulletList,
  orderedList,
  table,
  paragraph,
  heading,
  image,
  spacer,
  textAlign,
  details,
  detailsContent,
  detailsSummary,
  // editor
  placeholder,
  focus,
  typography,
  characterCount,
  uniqueId,
];

export function loadExtensions(props: ExtensionsProps): Extensions {
  const extensions: Extensions = [
    // @ts-ignore
    StarterKit.configure({
      paragraph: false,
      heading: false,
      bulletList: false,
      orderedList: false,
    }),
  ];

  const exts = extensionsMeta
    .filter((ext) => props.extensions?.includes(ext.name))
    .map((ext) => ext.load(props));

  extensions.push(...exts);

  return extensions;
}
