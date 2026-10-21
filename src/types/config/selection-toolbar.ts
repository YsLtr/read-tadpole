import { langCodeISO6393Schema } from "@read-frog/definitions"
import { z } from "zod"
import { isBuiltInActionId } from "@/utils/constants/custom-action"

/**
 * The provider a built-in action falls back to before the user picks one: the
 * default enabled LLM provider in a fresh config. It has to be a real entry in
 * `providersConfig` — the config schema requires every action's provider to be
 * one — and a built-in action with no usable provider shows the toolbar's
 * "pick a provider" state rather than running.
 */
export const DEFAULT_BUILT_IN_ACTION_PROVIDER_ID = "bilibili-translate-default"

// Upper bound (UTF-16 code units) of a custom action's HTML layout. NEVER lower
// it: an older build that reads a config holding a longer layout fails schema
// validation, falls back to DEFAULT_CONFIG and overwrites the synced remote
// copy. Raising it is fine only together with a CONFIG_SCHEMA_VERSION bump, so
// older builds refuse the newer config instead of choking on it.
export const MAX_CUSTOM_ACTION_LAYOUT_LENGTH = 32768

// Upper bound (UTF-16 code units) of each text in a custom action's sample
// data. NEVER lower it, for the reason given above.
export const MAX_CUSTOM_ACTION_SAMPLE_TEXT_LENGTH = 32768

// Every custom action runs on a provider the user configured, so the field
// types are the extension's own: a text answer or a number.
export const selectionToolbarCustomActionOutputTypeSchema = z.enum(["string", "number"])

export const selectionToolbarCustomActionOutputFieldSchema = z.object({
  id: z.string().nonempty(),
  name: z.string().trim().min(1),
  type: selectionToolbarCustomActionOutputTypeSchema,
  description: z.string(),
})

// What the layout preview renders an action's result with: the text the
// reader selected, the language the answer is written for, and each output
// field's value by field id (an id survives a rename). Values are text, the
// way a model answers; the layout scope converts a number field's text.
export const selectionToolbarCustomActionSampleDataSchema = z.object({
  selection: z.string().max(MAX_CUSTOM_ACTION_SAMPLE_TEXT_LENGTH),
  targetCode: langCodeISO6393Schema,
  values: z.record(z.string(), z.string().max(MAX_CUSTOM_ACTION_SAMPLE_TEXT_LENGTH)),
})

export const selectionToolbarBuiltInActionStateSchema = z.object({
  enabled: z.boolean(),
  providerId: z.string().nonempty(),
})

export const selectionToolbarBuiltInActionsSchema = z.object({
  dictionary: selectionToolbarBuiltInActionStateSchema,
})

export const selectionToolbarCustomActionSchema = z
  .object({
    id: z.string().nonempty(),
    name: z.string().nonempty(),
    enabled: z.boolean().optional(),
    icon: z.string(),
    providerId: z.string().nonempty(),
    systemPrompt: z.string(),
    prompt: z.string(),
    outputSchema: z.array(selectionToolbarCustomActionOutputFieldSchema).min(1),
    // HTML + Liquid template for the result. Optional, not defaulted, and never
    // syntax-checked here: a missing or blank layout renders the default field
    // list, and a template error must not fail the whole config parse (which
    // would replace the user's config with DEFAULT_CONFIG).
    layout: z.string().max(MAX_CUSTOM_ACTION_LAYOUT_LENGTH).optional(),
    // The layout preview's sample, one value per output field. Every custom
    // action has one (v108 gave one to those from before); a built-in action
    // persists none, so its preview generates it. Bad sample data is dropped
    // rather than failing the whole config parse, which would replace the
    // user's config with DEFAULT_CONFIG; the editor then generates a new one.
    sampleData: selectionToolbarCustomActionSampleDataSchema.optional().catch(undefined),
  })
  .superRefine((action, ctx) => {
    const nameSet = new Set<string>()
    const outputFieldIds = new Set<string>()

    action.outputSchema.forEach((field, index) => {
      if (nameSet.has(field.name)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate output schema name "${field.name}".`,
          path: ["outputSchema", index, "name"],
        })
        return
      }
      nameSet.add(field.name)
      outputFieldIds.add(field.id)
    })

    // Field ids must be unique too, or the layout cannot tell two fields apart.
    const seenFieldIds = new Set<string>()
    action.outputSchema.forEach((field, index) => {
      if (seenFieldIds.has(field.id)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate output field id "${field.id}".`,
          path: ["outputSchema", index, "id"],
        })
      }
      seenFieldIds.add(field.id)
    })
  })

export const selectionToolbarCustomActionsSchema = z
  .array(selectionToolbarCustomActionSchema)
  .superRefine((actions, ctx) => {
    const idSet = new Set<string>()
    actions.forEach((action, index) => {
      if (isBuiltInActionId(action.id)) {
        ctx.addIssue({
          code: "custom",
          message: `Action id "${action.id}" is reserved for a built-in action.`,
          path: [index, "id"],
        })
      }

      if (idSet.has(action.id)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate action id "${action.id}"`,
          path: [index, "id"],
        })
      }
      idSet.add(action.id)
    })

    const nameSet = new Set<string>()
    actions.forEach((action, index) => {
      if (nameSet.has(action.name)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate action name "${action.name}"`,
          path: [index, "name"],
        })
      }
      nameSet.add(action.name)
    })
  })

// TODO: make these vairbale shorter by deleteing SelectionToolbar or "selectionToolbar"
export type SelectionToolbarCustomActionOutputType = z.infer<
  typeof selectionToolbarCustomActionOutputTypeSchema
>
export type SelectionToolbarCustomActionOutputField = z.infer<
  typeof selectionToolbarCustomActionOutputFieldSchema
>
export type SelectionToolbarCustomActionSampleData = z.infer<
  typeof selectionToolbarCustomActionSampleDataSchema
>
export type SelectionToolbarBuiltInActionState = z.infer<
  typeof selectionToolbarBuiltInActionStateSchema
>
export type SelectionToolbarBuiltInActions = z.infer<typeof selectionToolbarBuiltInActionsSchema>
export type SelectionToolbarCustomAction = z.infer<typeof selectionToolbarCustomActionSchema>
