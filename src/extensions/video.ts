import { Node, mergeAttributes } from "@tiptap/core";
import type { ExtensionMeta } from "./index";
import { NodeSelection } from "@tiptap/pm/state";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      setVideo: (attrs: {
        src: string;
        controls?: boolean;
        autoplay?: boolean;
        loop?: boolean;
        muted?: boolean;
        captionsSrc?: string;
        captionsLang?: string;
        captionsLabel?: string;
      }) => ReturnType;
    };
  }
}

const Video = Node.create({
  name: "video",
  group: "block",
  draggable: true,

  addOptions() {
    return {
      allowBase64: false,
      HTMLAttributes: {
        controls: true,
      },
    };
  },

  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
      autoplay: { default: false },
      loop: { default: false },
      muted: { default: false },
      captionsSrc: { default: null },
      captionsLang: { default: "en" },
      captionsLabel: { default: "English" },
      captionsDefault: { default: false },
    };
  },

  parseHTML() {
    const selector = this.options.allowBase64
      ? "video[src]"
      : 'video[src]:not([src^="data:"])';
    return [{ tag: selector }];
  },

  renderHTML({ HTMLAttributes }) {
    const {
      captionsSrc,
      captionsLang,
      captionsLabel,
      captionsDefault,
      ...videoAttrs
    } = HTMLAttributes;
    return [
      "video",
      mergeAttributes(this.options.HTMLAttributes, videoAttrs),
      captionsSrc
        ? [
            "track",
            {
              kind: "captions",
              src: captionsSrc,
              srclang: captionsLang,
              label: captionsLabel,
              ...(captionsDefault ? { default: "" } : {}),
            },
          ]
        : "",
    ];
  },

  addCommands() {
    return {
      setVideo:
        (attrs) =>
        ({ state, commands }) => {
          const { selection } = state;
          if (
            selection instanceof NodeSelection &&
            selection.node?.type.name === this.name
          ) {
            return commands.updateAttributes(this.name, attrs);
          }
          return commands.insertContent({ type: this.name, attrs });
        },
    };
  },
});

const extension: ExtensionMeta = {
  name: "video",
  title: "Video",
  package: "custom/video",
  group: "node",
  defaults: {},
  options: [],
  load() {
    return Video;
  },
};

export default extension;
