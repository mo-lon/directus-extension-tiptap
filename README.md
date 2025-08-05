# Tiptap for Directus

This is a [Directus](https://directus.io/) extension that provides the [Tiptap v2](https://tiptap.dev/) editor as a rich text field type. The project has been forked from [Original](https://github.com/gbicou/directus-extension-tiptap)

The [StarterKit](https://tiptap.dev/api/extensions/starter-kit) tiptap bundle is already included and the other tiptap extensions are available in the directus interface options.

## Requirements

This extension requires Directus 11 or higher to be installed.

## Usage

### Field

When creating a field in Directus choose TipTap.

Choosing **Type** allows you to store your content as a JSON object or as a good old HTML string

- _JSON_ : the JSON object of the [ProseMirror](https://prosemirror.net/) nodes
- _Text_ : the HTML content as string

### Editor

When editing content items, the Tiptap WYSIWG editor will show up.

## License

This extension is released under the MIT license.
