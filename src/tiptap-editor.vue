<script setup lang="ts">
import { BubbleMenu, Editor, EditorContent } from "@tiptap/vue-3";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { translateShortcut } from "./utils/translate-shortcut";
import type { TypeType, ValueType } from "./types";
import { type ExtensionsProps, loadExtensions } from "./extensions";
import messages from "./messages.json";
import textAlign from "./extensions/text-align";
import characterCount from "./extensions/character-count";
import placeholder from "./extensions/placeholder";
import { useLink } from "./composables/link";
import focus from "./extensions/focus";
import table from "./extensions/table";
import icons from "./icons";
import { useImage } from "./composables/image";
import uniqueId from "./extensions/unique-id";

const { t } = useI18n({ messages });

type Props = {
  value: ValueType | null;
  type: TypeType;
  disabled: boolean;
  autofocus: boolean;
} & ExtensionsProps;

const props = withDefaults(defineProps<Props>(), {
  value: null,
  disabled: false,
  autofocus: false,
  extensions: null,
  cdnURL: null,
  placeholder: () => placeholder.defaults.placeholder,
  textAlignTypes: () => textAlign.defaults.types,
  characterCountMode: () => characterCount.defaults.mode,
  focusMode: () => focus.defaults.mode,
  tableResizable: () => table.defaults.resizable,
  uniqueIdAttributeName: () => uniqueId.defaults.attributeName,
  uniqueIdTypes: () => uniqueId.defaults.types,
});

const emit = defineEmits<{
  (e: "input", value: ValueType): void;
}>();

const alignOptions = [
  {
    align: "left",
    icon: icons.AlignLeft,
    text: t("wysiwyg_options.alignleft"),
    shortcut: translateShortcut(["meta", "shift", "l"]),
  },
  {
    align: "center",
    icon: icons.AlignCenter,
    text: t("wysiwyg_options.aligncenter"),
    shortcut: translateShortcut(["meta", "shift", "e"]),
  },
  {
    align: "right",
    icon: icons.AlignRight,
    text: t("wysiwyg_options.alignright"),
    shortcut: translateShortcut(["meta", "shift", "r"]),
  },
  {
    align: "justify",
    icon: icons.AlignJustify,
    text: t("wysiwyg_options.alignjustify"),
    shortcut: translateShortcut(["meta", "shift", "j"]),
  },
];

const editorInitiated = ref<boolean>(false);

const extensions = loadExtensions(props);

const editor = new Editor({
  editable: !props.disabled,
  content: props.value,
  extensions,
  autofocus: props.autofocus,
  onUpdate: ({ editor }) => {
    if (editor.isEmpty && !editorInitiated.value) {
      return;
    }
    switch (props.type) {
      case "json":
        emit("input", editor.getJSON());
        break;
      case "text":
        emit("input", editor.getHTML());
        break;
    }
  },
});

const editorExtensions = editor.extensionManager.extensions.map(
  (ext) => ext.name
);

const {
  linkHref,
  linkTarget,
  linkRel,
  linkTitle,
  linkAriaLabel,
  linkFileSelection,
  linkType,
  linkTypes,
  selectedLinkType,
  linkDrawerOpen,
  openLinkDialog,
  applyLink,
  removeLink,
  linkSelect,
} = useLink(editor);

const {
  imageDrawerOpen,
  imageSelection,
  imageSelect,
  imageOpen,
  imageClose,
  imageSave,
} = useImage(editor);

const textAlignActive = computed(() => {
  const types = props.textAlignTypes ?? ["paragraph", "heading"];

  return ["left", "center", "right", "justify"].find((align) =>
    types.some((type) => editor.isActive(type, { textAlign: align }))
  );
});

const setColor = (color: string) => {
  editor?.chain().focus().setColor(color).run();
};

const unsetColor = () => {
  editor?.chain().focus().unsetColor().run();
};

const setParagraphVariant = (variant: string | null) => {
  editor?.chain().focus().setParagraphVariant(variant).run();
};

const setHeadingLevel = (level: number) => {
  editor
    ?.chain()
    .focus()
    .toggleHeading({ level })
    .setHeadingVariant(`heading${level}`)
    .run();
};

const spacingScale = [
  "none",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
  "7xl",
];

const beforeIndex = ref(0);
const afterIndex = ref(0);

const clampIndex = (i: number) => {
  return Math.max(0, Math.min(spacingScale.length - 1, i));
};

const getActiveBlock = () => {
  const { state } = editor;
  const { $from } = state.selection;
  for (let d = $from.depth; d >= 0; d--) {
    const n = $from.node(d);
    if (n.isBlock) return { node: n, depth: d };
  }
  return null;
};

const syncSlidersFromSelection = () => {
  const active = getActiveBlock();
  if (!active) return;

  const attrs = active.node.attrs ?? {};
  const b = attrs.spaceBefore ?? "none";
  const a = attrs.spaceAfter ?? "none";

  beforeIndex.value = clampIndex(
    spacingScale.indexOf(b === undefined ? "none" : b)
  );
  if (beforeIndex.value === -1) beforeIndex.value = 0;

  afterIndex.value = clampIndex(
    spacingScale.indexOf(a === undefined ? "none" : a)
  );
  if (afterIndex.value === -1) afterIndex.value = 0;
};

const applySpacing = (which: "before" | "after", index: number) => {
  const active = getActiveBlock();
  if (!active) return;

  const nodeTypeName = active.node.type.name; // e.g. 'paragraph','heading','bulletList', etc.
  const value = spacingScale[clampIndex(index)];

  const update =
    which === "before" ? { spaceBefore: value } : { spaceAfter: value };

  editor.chain().focus().updateAttributes(nodeTypeName, update).run();
};

const resetSpacing = () => {
  const active = getActiveBlock();
  if (!active) return;
  const nodeTypeName = active.node.type.name;
  editor
    .chain()
    .focus()
    .updateAttributes(nodeTypeName, {
      spaceBefore: "none",
      spaceAfter: "none",
    })
    .run();
  beforeIndex.value = 0;
  afterIndex.value = 0;
};

const onSelectionUpdate = () => {
  syncSlidersFromSelection();
};

const bulletListVariants = [
  { label: "Default", value: "default" },
  { label: "Check Icon", value: "icon-check" },
  { label: "Arrow Icon", value: "icon-arrow" },
  { label: "Pass Icon", value: "icon-pass" },
  { label: "Cross Icon", value: "icon-cross" },
];

const orderedListVariants = [
  { label: "Decimal", value: "decimal" },
  { label: "Roman Numerals", value: "roman" },
  { label: "Lower Alpha", value: "lower-alpha" },
];

const toggleBulletListVariant = (variant: string) => {
  const isActive = editor?.isActive("bulletList");

  const chain = editor?.chain().focus();

  if (!isActive) {
    chain?.toggleBulletList();
  }

  chain
    ?.updateAttributes("bulletList", {
      variant: variant === "default" ? null : variant,
    })
    .run();
};

const toggleOrderedListVariant = (variant: string) => {
  const isActive = editor?.isActive("orderedList");

  const chain = editor?.chain().focus();

  if (!isActive) {
    chain?.toggleOrderedList();
  }

  chain
    ?.updateAttributes("orderedList", {
      variant: variant === "decimal" ? null : variant,
    })
    .run();
};

const layoutColumnCount = ref(2);

function insertLayoutColumns() {
  if (layoutColumnCount.value >= 1) {
    editor.chain().focus().insertLayout(layoutColumnCount.value).run();
  }
}

watch(
  () => props.value,
  (value) => {
    if (!value) {
      return;
    }

    const isSame =
      props.type === "json"
        ? JSON.stringify(editor.getJSON()) === JSON.stringify(value)
        : editor.getHTML() === value;

    if (isSame) {
      return;
    }

    editor.commands.setContent(value, false);
    editorInitiated.value = true;
  },
  {
    immediate: true,
  }
);

watch(
  () => props.disabled,
  (disabled) => editor.setEditable(!disabled)
);

onMounted(() => {
  syncSlidersFromSelection();
  editor.on("selectionUpdate", onSelectionUpdate);
  editor.on("transaction", onSelectionUpdate);
});

onBeforeUnmount(() => {
  editor.off("selectionUpdate", onSelectionUpdate);
  editor.off("transaction", onSelectionUpdate);
  editor.destroy();
});
</script>

<template>
  <div class="tiptap-editor" :class="{ disabled: props.disabled }">
    <bubble-menu
      class="tiptap-editor__bubble"
      :editor="editor"
      :tippy-options="{ duration: 100 }"
    >
      <v-chip
        v-if="editorExtensions.includes('bold') && editor.can().toggleBold()"
        v-tooltip="t('wysiwyg_options.bold')"
        :outlined="!editor.isActive('bold')"
        clickable
        small
        @click="editor.chain().focus().toggleBold().run()"
      >
        <icons.Bold class="icon" />
      </v-chip>
      <v-chip
        v-if="
          editorExtensions.includes('italic') && editor.can().toggleItalic()
        "
        v-tooltip="t('wysiwyg_options.italic')"
        :outlined="!editor.isActive('italic')"
        clickable
        small
        @click="editor.chain().focus().toggleItalic().run()"
      >
        <icons.Italic class="icon" />
      </v-chip>
      <v-chip
        v-if="
          editorExtensions.includes('underline') &&
          editor.can().toggleUnderline()
        "
        v-tooltip="t('wysiwyg_options.underline')"
        :outlined="!editor.isActive('underline')"
        clickable
        small
        @click="editor.chain().focus().toggleUnderline().run()"
      >
        <icons.Underline class="icon" />
      </v-chip>
      <v-chip
        v-if="
          editorExtensions.includes('strike') && editor.can().toggleStrike()
        "
        v-tooltip="t('wysiwyg_options.strikethrough')"
        :outlined="!editor.isActive('strike')"
        clickable
        small
        @click="editor.chain().focus().toggleStrike().run()"
      >
        <icons.Strikethrough class="icon" />
      </v-chip>
    </bubble-menu>

    <div class="tiptap-editor__toolbar">
      <!-- marks -->

      <v-button
        v-if="editorExtensions.includes('bold')"
        v-tooltip="
          t('wysiwyg_options.bold') + ' - ' + translateShortcut(['meta', 'b'])
        "
        small
        icon
        :disabled="props.disabled || !editor.can().toggleBold()"
        :active="editor.isActive('bold')"
        @click="editor.chain().focus().toggleBold().run()"
      >
        <icons.Bold />
      </v-button>

      <v-button
        v-if="editorExtensions.includes('italic')"
        v-tooltip="
          t('wysiwyg_options.italic') + ' - ' + translateShortcut(['meta', 'i'])
        "
        small
        icon
        :disabled="props.disabled || !editor.can().toggleItalic()"
        :active="editor.isActive('italic')"
        @click="editor.chain().focus().toggleItalic().run()"
      >
        <icons.Italic />
      </v-button>

      <v-button
        v-if="editorExtensions.includes('underline')"
        v-tooltip="
          t('wysiwyg_options.underline') +
          ' - ' +
          translateShortcut(['meta', 'u'])
        "
        small
        icon
        :disabled="props.disabled || !editor.can().toggleUnderline()"
        :active="editor.isActive('underline')"
        @click="editor.chain().focus().toggleUnderline().run()"
      >
        <icons.Underline />
      </v-button>

      <v-button
        v-if="editorExtensions.includes('strike')"
        v-tooltip="
          t('wysiwyg_options.strikethrough') +
          ' - ' +
          translateShortcut(['meta', 'shift', 'x'])
        "
        small
        icon
        :disabled="props.disabled || !editor.can().toggleStrike()"
        :active="editor.isActive('strike')"
        @click="editor.chain().focus().toggleStrike().run()"
      >
        <icons.Strikethrough />
      </v-button>

      <v-button
        v-if="editorExtensions.includes('subscript')"
        v-tooltip="
          t('wysiwyg_options.subscript') +
          ' - ' +
          translateShortcut(['meta', ','])
        "
        small
        icon
        :disabled="props.disabled || !editor.can().toggleSubscript()"
        :active="editor.isActive('subscript')"
        @click="editor.chain().focus().toggleSubscript().run()"
      >
        <icons.Subscript />
      </v-button>

      <v-button
        v-if="editorExtensions.includes('superscript')"
        v-tooltip="
          t('wysiwyg_options.superscript') +
          ' - ' +
          translateShortcut(['meta', '.'])
        "
        small
        icon
        :disabled="props.disabled || !editor.can().toggleSuperscript()"
        :active="editor.isActive('superscript')"
        @click="editor.chain().focus().toggleSuperscript().run()"
      >
        <icons.Superscript />
      </v-button>

      <v-button
        v-if="editorExtensions.includes('code')"
        v-tooltip="t('code') + ' - ' + translateShortcut(['meta', 'e'])"
        small
        icon
        :disabled="props.disabled || !editor.can().toggleCode()"
        :active="editor.isActive('code')"
        @click="editor.chain().focus().toggleCode().run()"
      >
        <icons.CodeLine />
      </v-button>

      <v-button
        v-if="editorExtensions.includes('highlight')"
        v-tooltip="
          t('tiptap.highlight') +
          ' - ' +
          translateShortcut(['meta', 'shift', 'h'])
        "
        small
        icon
        :disabled="props.disabled || !editor.can().toggleHighlight()"
        :active="editor.isActive('highlight')"
        @click="editor.chain().focus().toggleHighlight().run()"
      >
        <icons.MarkPenLine />
      </v-button>

      <!-- Text color picker -->
      <v-button
        v-if="editorExtensions.includes('color')"
        v-tooltip="t('tiptap.color')"
        small
        icon
        :active="!!editor?.getAttributes('textStyle').color"
        :disabled="props.disabled || !editor?.can().setColor('#000000')"
      >
        <template #default>
          <icons.Color />
          <input
            type="color"
            :value="editor?.getAttributes('textStyle')?.color || '#000000'"
            @input="(e) => setColor(e.target.value)"
            style="
              position: absolute;
              opacity: 0;
              width: 100%;
              height: 100%;
              cursor: pointer;
            "
          />
        </template>
      </v-button>

      <!-- Clear color -->
      <v-button
        v-if="editorExtensions.includes('color')"
        v-tooltip="t('tiptap.unset_color')"
        small
        icon
        :disabled="props.disabled"
        @click="unsetColor"
      >
        <icons.DeleteColor />
      </v-button>

      <div class="divider" />

      <!-- nodes -->

      <v-menu
        v-if="editor?.can().insertLayout"
        show-arrow
        placement="bottom-start"
      >
        <template #activator="{ toggle }">
          <v-button v-tooltip="'Layout'" icon small @click="toggle">
            <icons.Columns />
          </v-button>
        </template>

        <v-list>
          <!-- Insert Layout Block with dynamic column count -->
          <v-list-item>
            <v-list-item-content>
              <div class="pa-2" style="min-width: 200px">
                <div class="text-caption mb-2">Number of columns</div>
                <v-slider
                  v-model="layoutColumnCount"
                  :min="2"
                  :max="6"
                  step="1"
                  ticks="always"
                  tick-size="4"
                  class="mb-2"
                  hide-details
                  dense
                />
                <v-btn block small @click="insertLayoutColumns">
                  Insert {{ layoutColumnCount }} column layout
                </v-btn>
              </div>
            </v-list-item-content>
          </v-list-item>

          <!-- Unset layout block -->
          <v-list-item>
            <v-btn
              block
              small
              @click="editor.chain().focus().unsetLayout().run()"
            >
              Remove layout block
            </v-btn>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-menu
        v-if="editorExtensions.includes('heading')"
        show-arrow
        placement="bottom-start"
      >
        <template #activator="{ toggle }">
          <v-button
            v-tooltip="t('wysiwyg_options.heading')"
            :disabled="props.disabled"
            small
            icon
            :active="editor.isActive('heading')"
            @click="toggle"
          >
            <icons.HMega
              v-if="editor.isActive('heading', { variant: 'heading-mega' })"
            />
            <icons.H1
              v-if="
                editor.isActive('heading', { level: 1, variant: 'heading1' })
              "
            />
            <icons.H2 v-if="editor.isActive('heading', { level: 2 })" />
            <icons.H3 v-if="editor.isActive('heading', { level: 3 })" />
            <icons.H4 v-if="editor.isActive('heading', { level: 4 })" />
            <icons.H5 v-if="editor.isActive('heading', { level: 5 })" />
            <icons.H6 v-if="editor.isActive('heading', { level: 6 })" />
            <icons.Heading v-if="!editor.isActive('heading')" />
          </v-button>
        </template>
        <v-list>
          <v-list-item
            v-for="n in 6"
            :key="n"
            clickable
            :active="
              editor.isActive('heading', { level: n }) &&
              editor.getAttributes('heading').variant === `heading${n}`
            "
            @click="setHeadingLevel(n)"
          >
            <v-list-item-content
              ><v-text-overflow :text="t(`wysiwyg_options.h${n}`)"
            /></v-list-item-content>
            <v-list-item-hint
              >{{ translateShortcut(["meta", "alt"]) }}
              {{ n }}</v-list-item-hint
            >
          </v-list-item>
          <v-list-item
            clickable
            :active="
              editor.isActive('heading', { level: 1 }) &&
              editor.getAttributes('heading').variant === 'heading-mega'
            "
            @click="
              editor
                .chain()
                .focus()
                .toggleHeading({ level: 1 })
                .setHeadingVariant('heading-mega')
                .run()
            "
          >
            <v-list-item-content>
              <v-text-overflow :text="'Heading Mega'" />
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Paragraph Variant Dropdown -->
      <v-menu
        v-if="editorExtensions.includes('paragraph')"
        show-arrow
        placement="bottom-start"
      >
        <template #activator="{ toggle }">
          <v-button
            v-tooltip="t('tiptap.paragraph')"
            small
            icon
            :active="editor.isActive('paragraph')"
            @click="toggle"
          >
            <icons.Paragraph />
          </v-button>
        </template>

        <v-list>
          <v-list-item
            clickable
            :active="!editor.getAttributes('paragraph').variant"
            @click="setParagraphVariant(null)"
          >
            <v-list-item-content>
              <v-text-overflow text="Default" />
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            clickable
            :active="editor.getAttributes('paragraph').variant === 'body1'"
            @click="setParagraphVariant('body1')"
          >
            <v-list-item-content>
              <v-text-overflow text="Body 1" />
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            clickable
            :active="editor.getAttributes('paragraph').variant === 'body2'"
            @click="setParagraphVariant('body2')"
          >
            <v-list-item-content>
              <v-text-overflow text="Body 2" />
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            clickable
            :active="editor.getAttributes('paragraph').variant === 'body1-bold'"
            @click="setParagraphVariant('body1-bold')"
          >
            <v-list-item-content>
              <v-text-overflow text="Body 1 Bold" />
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            clickable
            :active="editor.getAttributes('paragraph').variant === 'body2-bold'"
            @click="setParagraphVariant('body2-bold')"
          >
            <v-list-item-content>
              <v-text-overflow text="Body 2 Bold" />
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            clickable
            :active="editor.getAttributes('paragraph').variant === 'label'"
            @click="setParagraphVariant('label')"
          >
            <v-list-item-content>
              <v-text-overflow text="Label" />
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-menu
        v-if="editorExtensions.includes('bulletList')"
        show-arrow
        placement="bottom-start"
      >
        <template #activator="{ toggle }">
          <v-button
            v-tooltip="t('wysiwyg_options.bullist')"
            :disabled="props.disabled"
            small
            icon
            :active="editor.isActive('bulletList')"
            @click="toggle"
          >
            <icons.ListUnordered />
          </v-button>
        </template>

        <v-list>
          <v-list-item
            v-for="variant in bulletListVariants"
            :key="variant.value"
            clickable
            :active="
              editor.isActive('bulletList', { variant: variant.value }) ||
              (variant.value === 'default' &&
                editor.isActive('bulletList') &&
                !editor.getAttributes('bulletList').variant)
            "
            @click="toggleBulletListVariant(variant.value)"
          >
            <v-list-item-content>
              <v-text-overflow :text="variant.label" />
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-menu
        v-if="editorExtensions.includes('orderedList')"
        show-arrow
        placement="bottom-start"
      >
        <template #activator="{ toggle }">
          <v-button
            v-tooltip="t('wysiwyg_options.numlist')"
            :disabled="props.disabled"
            small
            icon
            :active="editor.isActive('orderedList')"
            @click="toggle"
          >
            <icons.ListOrdered />
          </v-button>
        </template>

        <v-list>
          <v-list-item
            v-for="variant in orderedListVariants"
            :key="variant.value"
            clickable
            :active="
              editor.isActive('orderedList', { variant: variant.value }) ||
              (variant.value === 'decimal' &&
                editor.isActive('orderedList') &&
                !editor.getAttributes('orderedList').variant)
            "
            @click="toggleOrderedListVariant(variant.value)"
          >
            <v-list-item-content>
              <v-text-overflow :text="variant.label" />
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-button
        v-if="editorExtensions.includes('blockquote')"
        v-tooltip="
          t('wysiwyg_options.blockquote') +
          ' - ' +
          translateShortcut(['meta', 'shift', 'b'])
        "
        small
        icon
        :disabled="props.disabled"
        :active="editor.isActive('blockquote')"
        @click="editor.chain().focus().toggleBlockquote().run()"
      >
        <icons.QuoteText />
      </v-button>

      <v-button
        v-if="editorExtensions.includes('codeBlock')"
        v-tooltip="
          t('wysiwyg_options.codeblock') +
          ' - ' +
          translateShortcut(['meta', 'alt', 'c'])
        "
        small
        icon
        :disabled="props.disabled"
        :active="editor.isActive('codeBlock')"
        @click="editor.chain().focus().toggleCodeBlock().run()"
      >
        <icons.CodeBoxLine />
      </v-button>

      <div class="divider" />

      <v-menu
        v-if="editorExtensions.includes('textAlign')"
        show-arrow
        placement="bottom-start"
      >
        <template #activator="{ toggle }">
          <v-button
            v-tooltip="t('tiptap.text_align')"
            :disabled="props.disabled || !editor.can().setTextAlign('left')"
            small
            icon
            :active="textAlignActive !== undefined"
            @click="toggle"
          >
            <template v-for="opt in alignOptions" :key="opt.align">
              <component
                :is="opt.icon"
                v-if="editor.isActive({ textAlign: opt.align })"
              />
            </template>
            <icons.AlignLeft v-if="textAlignActive === undefined" />
          </v-button>
        </template>
        <v-list>
          <v-list-item
            v-for="opt in alignOptions"
            :key="opt.align"
            clickable
            :active="editor.isActive({ textAlign: opt.align })"
            @click="
              editor.isActive({ textAlign: opt.align })
                ? editor.chain().focus().unsetTextAlign().run()
                : editor.chain().focus().setTextAlign(opt.align).run()
            "
          >
            <v-list-item-icon>
              <component :is="opt.icon" />
            </v-list-item-icon>
            <v-list-item-content>
              <v-text-overflow :text="opt.text" />
            </v-list-item-content>
            <v-list-item-hint>{{ opt.shortcut }}</v-list-item-hint>
          </v-list-item>
          <v-list-item
            clickable
            :active="textAlignActive === undefined"
            @click="editor.chain().focus().unsetTextAlign().run()"
          >
            <v-list-item-content>
              <v-text-overflow :text="t('wysiwyg_options.alignnone')" />
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-menu v-if="editor" show-arrow placement="bottom-start">
        <template #activator="{ toggle }">
          <v-button
            icon
            small
            :disabled="props.disabled"
            @click="toggle"
            v-tooltip="'Spacing'"
          >
            <icons.Spacer />
          </v-button>
        </template>

        <v-list>
          <v-list-item>
            <v-list-item-content>
              <div class="pa-3" style="min-width: 240px">
                <div class="text-caption mb-1">Space before</div>
                <v-slider
                  v-model="beforeIndex"
                  :min="0"
                  :max="spacingScale.length - 1"
                  :step="1"
                  show-ticks
                  tick-size="2"
                  :label="spacingScale[beforeIndex]"
                  hide-details
                  @change="applySpacing('before', beforeIndex)"
                />

                <div class="text-caption mt-4 mb-1">Space after</div>
                <v-slider
                  v-model="afterIndex"
                  :min="0"
                  :max="spacingScale.length - 1"
                  :step="1"
                  show-ticks
                  tick-size="2"
                  :label="spacingScale[afterIndex]"
                  hide-details
                  @change="applySpacing('after', afterIndex)"
                />

                <v-btn block small class="mt-3" @click="resetSpacing">
                  Reset spacing
                </v-btn>
              </div>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-button
        v-if="editorExtensions.includes('horizontalRule')"
        v-tooltip="t('wysiwyg_options.hr')"
        small
        icon
        :disabled="props.disabled"
        @click="editor.chain().focus().setHorizontalRule().run()"
      >
        <icons.Separator />
      </v-button>

      <v-button
        v-if="editorExtensions.includes('link')"
        v-tooltip="t('wysiwyg_options.link')"
        small
        icon
        :disabled="props.disabled || !editor.can().setLink({ href: '' })"
        :active="editor.isActive('link')"
        @click="openLinkDialog"
      >
        <icons.Link />
      </v-button>

      <v-button
        v-if="editorExtensions.includes('link')"
        v-tooltip="t('wysiwyg_options.unlink')"
        small
        icon
        :disabled="props.disabled || !editor.isActive('link')"
        @click="removeLink"
      >
        <icons.Unlink />
      </v-button>

      <v-button
        v-if="editorExtensions.includes('image')"
        v-tooltip="t('wysiwyg_options.image')"
        small
        icon
        :disabled="props.disabled || !editor.can().setImage({ id: '' })"
        @click="imageOpen"
      >
        <icons.Image />
      </v-button>

      <v-menu
        v-if="editorExtensions.includes('table')"
        show-arrow
        placement="bottom-start"
      >
        <template #activator="{ toggle }">
          <v-button
            v-tooltip="t('wysiwyg_options.table')"
            :disabled="props.disabled"
            small
            icon
            :active="editor.isActive('table')"
            @click="toggle"
          >
            <icons.Table />
          </v-button>
        </template>
        <v-list>
          <v-list-item
            clickable
            @click="editor.chain().focus().insertTable().run()"
          >
            <v-list-item-icon>
              <icons.Table />
            </v-list-item-icon>
            <v-list-item-content
              ><v-text-overflow :text="t(`tiptap.table_insert`)"
            /></v-list-item-content>
          </v-list-item>
          <v-list-item
            clickable
            :disabled="!editor.isActive('table')"
            @click="editor.chain().focus().addColumnBefore().run()"
          >
            <v-list-item-icon>
              <icons.InsertColumnLeft />
            </v-list-item-icon>
            <v-list-item-content
              ><v-text-overflow :text="t(`tiptap.table_add_column_before`)"
            /></v-list-item-content>
          </v-list-item>
          <v-list-item
            clickable
            :disabled="!editor.isActive('table')"
            @click="editor.chain().focus().addColumnAfter().run()"
          >
            <v-list-item-icon>
              <icons.InsertColumnRight />
            </v-list-item-icon>
            <v-list-item-content
              ><v-text-overflow :text="t(`tiptap.table_add_column_after`)"
            /></v-list-item-content>
          </v-list-item>
          <v-list-item
            clickable
            :disabled="!editor.isActive('table')"
            @click="editor.chain().focus().deleteColumn().run()"
          >
            <v-list-item-icon>
              <icons.DeleteColumn />
            </v-list-item-icon>
            <v-list-item-content
              ><v-text-overflow :text="t(`tiptap.table_delete_column`)"
            /></v-list-item-content>
          </v-list-item>

          <v-list-item
            clickable
            :disabled="!editor.isActive('table')"
            @click="editor.chain().focus().addRowBefore().run()"
          >
            <v-list-item-icon>
              <icons.InsertRowTop />
            </v-list-item-icon>
            <v-list-item-content
              ><v-text-overflow :text="t(`tiptap.table_add_row_before`)"
            /></v-list-item-content>
          </v-list-item>
          <v-list-item
            clickable
            :disabled="!editor.isActive('table')"
            @click="editor.chain().focus().addRowAfter().run()"
          >
            <v-list-item-icon>
              <icons.InsertRowBottom />
            </v-list-item-icon>
            <v-list-item-content
              ><v-text-overflow :text="t(`tiptap.table_add_row_after`)"
            /></v-list-item-content>
          </v-list-item>
          <v-list-item
            clickable
            :disabled="!editor.isActive('table')"
            @click="editor.chain().focus().deleteRow().run()"
          >
            <v-list-item-icon>
              <icons.DeleteRow />
            </v-list-item-icon>
            <v-list-item-content
              ><v-text-overflow :text="t(`tiptap.table_delete_row`)"
            /></v-list-item-content>
          </v-list-item>
          <v-list-item
            clickable
            :disabled="!editor.isActive('table')"
            @click="editor.chain().focus().mergeCells().run()"
          >
            <v-list-item-icon>
              <icons.MergeCells />
            </v-list-item-icon>
            <v-list-item-content
              ><v-text-overflow :text="t(`tiptap.table_merge_cells`)"
            /></v-list-item-content>
          </v-list-item>
          <v-list-item
            clickable
            :disabled="!editor.isActive('table')"
            @click="editor.chain().focus().splitCell().run()"
          >
            <v-list-item-icon>
              <icons.SplitCell />
            </v-list-item-icon>
            <v-list-item-content
              ><v-text-overflow :text="t(`tiptap.table_split_cell`)"
            /></v-list-item-content>
          </v-list-item>
          <v-list-item
            clickable
            :disabled="!editor.isActive('table')"
            @click="editor.chain().focus().toggleHeaderRow().run()"
          >
            <v-list-item-icon>
              <icons.LayoutTop />
            </v-list-item-icon>
            <v-list-item-content
              ><v-text-overflow :text="t(`tiptap.table_toggle_header_row`)"
            /></v-list-item-content>
          </v-list-item>
          <v-list-item
            clickable
            :disabled="!editor.isActive('table')"
            @click="editor.chain().focus().toggleHeaderColumn().run()"
          >
            <v-list-item-icon>
              <icons.LayoutLeft />
            </v-list-item-icon>
            <v-list-item-content
              ><v-text-overflow :text="t(`tiptap.table_toggle_header_column`)"
            /></v-list-item-content>
          </v-list-item>
          <v-list-item
            clickable
            :disabled="!editor.isActive('table')"
            @click="editor.chain().focus().toggleHeaderCell().run()"
          >
            <v-list-item-icon>
              <icons.LayoutGrid />
            </v-list-item-icon>
            <v-list-item-content
              ><v-text-overflow :text="t(`tiptap.table_toggle_header_cell`)"
            /></v-list-item-content>
          </v-list-item>
          <v-list-item
            clickable
            :disabled="!editor.isActive('table')"
            @click="editor.chain().focus().deleteTable().run()"
          >
            <v-list-item-icon>
              <icons.DeleteBin />
            </v-list-item-icon>
            <v-list-item-content
              ><v-text-overflow :text="t(`tiptap.table_delete`)"
            /></v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-button
        v-tooltip="'Details'"
        :disabled="props.disabled"
        icon
        small
        :active="editor?.isActive('details')"
        @click="editor?.chain().focus().toggleDetails().run()"
      >
        <icons.Details />
      </v-button>

      <v-button
        v-if="editorExtensions.includes('hardBreak')"
        v-tooltip="
          t('tiptap.br') + ' - ' + translateShortcut(['shift', 'enter'])
        "
        small
        icon
        :disabled="props.disabled || !editor.can().setHardBreak()"
        @click="editor.chain().focus().setHardBreak().run()"
      >
        <icons.TextWrap />
      </v-button>

      <v-button
        v-tooltip="t('tiptap.clear_format')"
        small
        icon
        :disabled="props.disabled"
        @click="editor.chain().focus().unsetAllMarks().run()"
      >
        <icons.FormatClear />
      </v-button>

      <div class="spacer" />

      <!-- history -->

      <v-button
        v-if="editorExtensions.includes('history')"
        v-tooltip="
          t('wysiwyg_options.undo') + ' - ' + translateShortcut(['meta', 'z'])
        "
        small
        icon
        :disabled="props.disabled || !editor.can().undo()"
        @click="editor.chain().focus().undo().run()"
      >
        <icons.ArrowGoBackLine />
      </v-button>

      <v-button
        v-if="editorExtensions.includes('history')"
        v-tooltip="
          t('wysiwyg_options.redo') +
          ' - ' +
          translateShortcut(['meta', 'shift', 'z'])
        "
        small
        icon
        :disabled="props.disabled || !editor.can().redo()"
        @click="editor.chain().focus().redo().run()"
      >
        <icons.ArrowGoForwardLine />
      </v-button>
    </div>

    <editor-content class="tiptap-editor__content" :editor="editor" />

    <div
      v-if="editorExtensions.includes('characterCount')"
      class="tiptap-editor__info"
    >
      <div v-if="editorExtensions.includes('characterCount')">
        <template
          v-if="
            !editor.storage.characterCount.characters() &&
            !editor.storage.characterCount.words()
          "
        >
          ∅
        </template>
        <template v-else>
          {{ t("tiptap.count_words", editor.storage.characterCount.words()) }},
          {{
            t("tiptap.count_chars", editor.storage.characterCount.characters())
          }}
          <template v-if="props.characterCountLimit">
            / {{ props.characterCountLimit }}</template
          >
        </template>
      </div>
    </div>

    <v-drawer
      v-model="linkDrawerOpen"
      :title="t('wysiwyg_options.link')"
      icon="link"
      @cancel="linkDrawerOpen = false"
    >
      <div class="content">
        <div class="grid">
          <div class="field">
            <div class="type-label">{{ t("tiptap.link_type") }}</div>
            <v-select
              v-model="linkType"
              :items="linkTypes"
              item-title="text"
              item-value="value"
            />
          </div>

          <div class="field" v-if="linkType !== 'file'">
            <div class="type-label">{{ t("url") }}</div>
            <v-input
              v-model="linkHref"
              :placeholder="selectedLinkType?.placeholder || ''"
            />
          </div>

          <div class="field" v-if="linkType === 'file'">
            <div class="type-label">{{ t("tiptap.link_select_file") }}</div>
            <v-upload
              :multiple="false"
              from-library
              from-url
              @input="linkSelect"
            />
          </div>

          <div
            v-if="linkType === 'file' && linkFileSelection?.filename"
            class="field"
          >
            <div class="type-label">{{ t("tiptap.link_selected_file") }}</div>
            <v-input :model-value="linkFileSelection.filename" readonly />
          </div>

          <div class="field" v-if="!selectedLinkType?.noTarget">
            <div class="type-label">{{ t("tiptap.link_open_link_in") }}</div>
            <v-select
              v-model="linkTarget"
              :items="[
                { text: 'Same Tab', value: '_self' },
                { text: 'New Tab', value: '_blank' },
              ]"
              item-title="text"
              item-value="value"
            />
          </div>

          <div class="field">
            <div class="type-label">{{ t("tiptap.link_title") }}</div>
            <v-input v-model="linkTitle" />
          </div>

          <div class="field">
            <div class="type-label">{{ t("tiptap.link_aria_label") }}</div>
            <v-input v-model="linkAriaLabel" />
          </div>

          <div class="field">
            <div class="type-label">{{ t("tiptap.link_rel") }}</div>
            <v-input v-model="linkRel" />
          </div>
        </div>
      </div>

      <template #actions>
        <v-button
          v-tooltip.bottom="t('save')"
          icon
          rounded
          :disabled="!linkHref && !linkFileId"
          @click="applyLink"
        >
          <v-icon name="check" />
        </v-button>
      </template>
    </v-drawer>

    <v-drawer
      v-model="imageDrawerOpen"
      :title="t('wysiwyg_options.image')"
      icon="image"
      @cancel="imageClose"
    >
      <div class="content">
        <template v-if="imageSelection">
          <img class="image-preview" :src="`/assets/${imageSelection.id}`" />
          <div class="grid">
            <div class="field">
              <div class="type-label">
                {{ t("fields.directus_files.filename_download") }}
              </div>
              <v-input v-model="imageSelection.filename" nullable />
            </div>
            <div class="field">
              <div class="type-label">{{ t("alt_text") }}</div>
              <v-input v-model="imageSelection.alt" :nullable="false" />
            </div>
            <div class="field half">
              <div class="type-label">{{ t("width") }}</div>
              <v-input v-model="imageSelection.width" />
            </div>
            <div class="field half-right">
              <div class="type-label">{{ t("height") }}</div>
              <v-input v-model="imageSelection.height" />
            </div>
          </div>
        </template>
        <v-upload
          v-else
          :multiple="false"
          from-library
          from-url
          @input="imageSelect"
        />
      </div>

      <template #actions>
        <v-button
          v-tooltip.bottom="t('save_image')"
          icon
          rounded
          @click="imageSave"
        >
          <v-icon name="check" />
        </v-button>
      </template>
    </v-drawer>
  </div>
</template>

<style scoped lang="scss">
@import "./styles/mixins/form-grid";
.v-menu-content {
  svg {
    fill: var(--v-input-color);
  }

  [disabled] svg,
  .disabled svg {
    fill: var(--foreground-subdued);
  }
}

.v-drawer {
  .grid {
    @include form-grid;
  }

  .content {
    padding: var(--content-padding);
    padding-top: 0;
  }

  .image-preview,
  .media-preview {
    width: 100%;
    height: var(--input-height-tall);
    margin-bottom: 24px;
    object-fit: cover;
    border-radius: var(--border-radius);
  }
}
</style>

<style lang="scss">
.tiptap-editor {
  font-family: var(--theme--fonts--sans--font-family);
  border: var(--theme--border-width) solid
    var(--theme--form--field--input--border-color);
  border-radius: var(--theme--border-radius);
  box-shadow: var(--theme--form--field--input--box-shadow);
  transition-duration: var(--fast);
  transition-timing-function: var(--transition);
  transition-property: box-shadow, border-color;

  --v-button-color: var(--theme--form--field--input--foreground);
  --v-button-background-color-hover: var(
    --theme--form--field--input--border-color
  );
  --v-button-color-hover: var(--theme--form--field--input--foreground);

  &:hover {
    border-color: var(--theme--form--field--input--border-color-hover);
    box-shadow: var(--theme--form--field--input--box-shadow-hover);
  }

  &:focus-within,
  &.active {
    border-color: var(--theme--form--field--input--border-color-focus);
    box-shadow: var(--theme--form--field--input--box-shadow-focus);
  }

  &.disabled {
    background-color: var(--theme--form--field--input--background-subdued);
  }

  .paragraph-body1 {
    font-size: 1.25rem;
  }

  .paragraph-body2 {
    font-size: 0.875rem;
  }

  .paragraph-body1-bold {
    font-size: 1.25rem;
    font-weight: 700;
  }

  .paragraph-body2-bold {
    font-size: 0.875rem;
    font-weight: 700;
  }

  .paragraph-label {
    font-size: 0.75rem;
  }

  .list-variant-roman {
    list-style-type: upper-roman;
  }

  /* Lower alpha */
  .list-variant-lower-alpha {
    list-style-type: lower-alpha;
  }

  .list-variant-icon-check li::marker {
    content: "✔ ";
    color: blue;
  }

  .list-variant-icon-arrow li::marker {
    content: "➤ ";
    color: blue;
  }

  .list-variant-icon-pass li::marker {
    content: "✅ ";
    color: green;
  }

  .list-variant-icon-cross li::marker {
    content: "❌ ";
    color: red;
  }

  div[data-type="details"] {
    display: flex;
    gap: 0.25rem;
    margin: 1.5rem 0;
    border: 1px solid lightgray;
    border-radius: 0.5rem;
    padding: 0.5rem;

    summary {
      font-weight: 700;
    }

    > button {
      align-items: center;
      background: transparent;
      border-radius: 4px;
      display: flex;
      font-size: 0.625rem;
      height: 1.25rem;
      justify-content: center;
      line-height: 1;
      margin-top: 0.1rem;
      padding: 0;
      width: 1.25rem;

      &:hover {
        background-color: lightgray;
      }

      &::before {
        content: "\25B6";
      }
    }

    &.is-open > button::before {
      transform: rotate(90deg);
    }

    > div {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;

      > [data-type="detailsContent"] > :last-child {
        margin-bottom: 0.5rem;
      }
    }

    .details {
      margin: 0.5rem 0;
    }
  }

  .spacer {
    display: block;
    width: 100%;
  }

  [data-space-after="none"] {
    margin-bottom: 0;
  }
  [data-space-after="xs"] {
    margin-bottom: 0.5rem;
  }
  [data-space-after="sm"] {
    margin-bottom: 1rem;
  }
  [data-space-after="md"] {
    margin-bottom: 1.5rem;
  }
  [data-space-after="lg"] {
    margin-bottom: 2rem;
  }
  [data-space-after="xl"] {
    margin-bottom: 3rem;
  }
  [data-space-after="2xl"] {
    margin-bottom: 4rem;
  }
  [data-space-after="3xl"] {
    margin-bottom: 5rem;
  }
  [data-space-after="4xl"] {
    margin-bottom: 6rem;
  }
  [data-space-after="5xl"] {
    margin-bottom: 8rem;
  }
  [data-space-after="6xl"] {
    margin-bottom: 10rem;
  }
  [data-space-after="7xl"] {
    margin-bottom: 12rem;
  }

  [data-space-before="none"] {
    margin-top: 0;
  }
  [data-space-before="xs"] {
    margin-top: 0.5rem;
  }
  [data-space-before="sm"] {
    margin-top: 1rem;
  }
  [data-space-before="md"] {
    margin-top: 1.5rem;
  }
  [data-space-before="lg"] {
    margin-top: 2rem;
  }
  [data-space-before="xl"] {
    margin-top: 3rem;
  }
  [data-space-before="2xl"] {
    margin-top: 4rem;
  }
  [data-space-before="3xl"] {
    margin-top: 5rem;
  }
  [data-space-before="4xl"] {
    margin-top: 6rem;
  }
  [data-space-before="5xl"] {
    margin-top: 8rem;
  }
  [data-space-before="6xl"] {
    margin-top: 10rem;
  }
  [data-space-before="7xl"] {
    margin-top: 12rem;
  }

  &__info {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    min-height: 30px;
    padding: 0 8px;
    background-color: var(--theme--form--field--input--background-subdued);
    border-top: var(--theme--border-width) solid
      var(--theme--form--field--input--border-color);
    color: var(--theme--form--field--input--foreground-subdued);
    font-family: var(--theme--fonts--monospace--font-family);
    font-size: 12px;
  }

  &__toolbar {
    --v-button-background-color: transparent;
    --v-button-color: var(--theme--form--field--input--foreground-subdued);
    --v-button-background-color-hover: var(
      --theme--form--field--input--border-color
    );
    --v-button-color-hover: var(--theme--form--field--input--foreground);
    --v-button-background-color-active: var(
      --theme--form--field--input--border-color
    );
    --v-button-color-active: var(--theme--form--field--input--foreground);

    display: flex;
    flex-wrap: wrap;
    align-items: center;
    min-height: 40px;
    padding: 2px;
    background-color: var(--theme--form--field--input--background-subdued);
    border-bottom: var(--theme--border-width) solid
      var(--theme--form--field--input--border-color);

    svg {
      fill: var(--theme--form--field--input--foreground);
    }

    .v-icon {
      color: var(--theme--form--field--input--foreground);
    }

    [disabled] svg,
    .disabled svg {
      fill: var(--theme--form--field--input--foreground-subdued);
    }

    .v-button + .v-button {
      margin-left: 2px;
    }

    .divider {
      width: 2px;
      height: 24px;
      background: var(--theme--form--field--input--border-color);
      margin: 0 4px;
      opacity: 0.5;
    }

    .spacer {
      flex-grow: 1;
    }
  }

  &__bubble {
    --v-icon-size: 18px;
    --v-chip-color: var(--theme--border-color-accent);
    --v-chip-background-color: var(--theme--border-color-accent);
    --v-chip-color-hover: var(--theme--border-color-accent);
    --v-chip-background-color-hover: var(--theme--border-color-accent);

    .v-chip {
      margin-left: 1px;
      cursor: pointer;

      &.outlined {
        background-color: var(--theme--form--field--input--background-subdued);
      }
    }

    .icon {
      display: inline-block;
      width: var(--v-icon-size, 24px);
      min-width: var(--v-icon-size, 24px);
      height: var(--v-icon-size, 24px);
      color: var(--theme--foreground, currentColor);
      fill: var(--theme--foreground, currentColor);
    }
  }

  &__content {
    font-family: var(--theme--font-family-sans-serif);
    font-weight: 400;

    .ProseMirror {
      min-height: 230px;
      margin: 20px 0;
      padding: 0 20px;
    }

    * {
      margin: revert;
      font-size: revert;
      font-weight: revert;
      line-height: revert;
    }

    a {
      color: var(--blue);
      text-decoration: underline;
    }

    b,
    strong {
      font-weight: 700;
    }

    pre,
    code {
      background: var(--background-inverted);
      color: var(--foreground-inverted);
      border-radius: 0.3em;
    }

    pre {
      padding: 0.4em 0.6em;
    }
    code {
      padding: 0 0.2em;
    }

    pre > code {
      padding: 0;
    }

    .ProseMirror p.is-editor-empty:first-child::before {
      color: var(--foreground-subdued);
      content: attr(data-placeholder);
      float: left;
      height: 0;
      pointer-events: none;
    }

    .has-focus {
      border-radius: 3px;
      //box-shadow: 0 0 6px 2px var(--background-subdued);
      box-shadow: var(--card-shadow);
    }

    .ProseMirror .layout-block {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: 1fr;
      gap: 1.5rem; /* Adjust column gap */
      margin: 1rem 0; /* Spacing before/after the block */
      padding: 0.5rem 0;
      border: 1px solid #e0e0e0;
      border-radius: 0.5rem;
      background-color: #fafafa;
    }

    .ProseMirror .layout-column {
      overflow: auto;
      padding: 0.75rem;
      border: 1px dashed #bbb;
      border-radius: 0.5rem;
      background-color: #fff;
      min-height: 40px;
    }

    table {
      border-collapse: collapse;
      table-layout: fixed;
      width: 100%;
      margin: 0;
      overflow: hidden;

      td,
      th {
        min-width: 1em;
        border: 1px solid var(--border-normal);
        padding: 3px 6px;
        vertical-align: top;
        box-sizing: border-box;
        position: relative;

        > * {
          margin-bottom: 0;
        }
      }

      th {
        font-weight: bold;
        text-align: left;
        background-color: var(--background-normal);
      }

      .selectedCell:after {
        z-index: 2;
        position: absolute;
        content: "";
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        background: rgba(200, 200, 255, 0.4);
        pointer-events: none;
      }

      .column-resize-handle {
        position: absolute;
        right: -2px;
        top: 0;
        bottom: -2px;
        width: 4px;
        background-color: #adf;
        pointer-events: none;
      }

      p {
        margin: 0;
      }
    }

    .tableWrapper {
      padding: 1rem 0;
      overflow-x: auto;
    }

    .resize-cursor {
      cursor: ew-resize;
      cursor: col-resize;
    }

    img {
      max-width: 100%;
      height: auto;

      &.ProseMirror-selectednode {
        outline: 2px solid var(--v-input-border-color-focus);
      }
    }
  }
}
</style>
