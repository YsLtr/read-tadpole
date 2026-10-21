export const CONTENT_WRAPPER_CLASS = "read-tadpole-translated-content-wrapper"
export const INLINE_CONTENT_CLASS = "read-tadpole-translated-inline-content"
export const BLOCK_CONTENT_CLASS = "read-tadpole-translated-block-content"
export const FLOAT_WRAP_ATTRIBUTE = "data-read-tadpole-float-wrap"

export const WALKED_ATTRIBUTE = "data-read-tadpole-walked"
// paragraph means you need to trigger translation on this element (i.e. we have inline children in it)
export const PARAGRAPH_ATTRIBUTE = "data-read-tadpole-paragraph"
export const BLOCK_ATTRIBUTE = "data-read-tadpole-block-node"
export const INLINE_ATTRIBUTE = "data-read-tadpole-inline-node"

export const TRANSLATION_MODE_ATTRIBUTE = "data-read-tadpole-translation-mode"
export const VIRTUAL_PARAGRAPH_ATTRIBUTE = "data-read-tadpole-virtual-paragraph"
// Marks an element whose own text nodes hold translated values (in-place swap,
// translationOnly mode) — the queryable handle for restore, since no wrapper
// remains in the DOM after a successful swap.
export const TRANSLATION_ONLY_ATTRIBUTE = "data-read-tadpole-translation-only"

export const MARK_ATTRIBUTES = new Set([
  WALKED_ATTRIBUTE,
  PARAGRAPH_ATTRIBUTE,
  BLOCK_ATTRIBUTE,
  INLINE_ATTRIBUTE,
])

export const NOTRANSLATE_CLASS = "notranslate"

// Marks a formula element cloned into a bilingual translation (an "inline
// atom"). The preset stylesheet excludes these subtrees from its wrapper-wide
// typography rules so the page's own math CSS keeps rendering them.
export const INLINE_ATOM_CLASS = "read-tadpole-inline-atom"

export const REACT_SHADOW_HOST_CLASS = "read-tadpole-react-shadow-host"

export const SPINNER_CLASS = "read-tadpole-spinner"

export const TRANSLATION_ERROR_CONTAINER_CLASS = "read-tadpole-translation-error-container"
