import type { APIProviderConfig } from "@/types/config/provider"
import { useSelector } from "@tanstack/react-store"
import { useState } from "react"
import { browser } from "#imports"
import { useAutosaveContext } from "@/components/form/use-autosave"
import LoadingDots from "@/components/loading-dots"
import { Button } from "@/components/ui/base-ui/button"
import { Checkbox } from "@/components/ui/base-ui/checkbox"
import { toastManager } from "@/components/ui/base-ui/toast"
import { DOUBAO_LOGIN_URL, DOUBAO_TRANSLATE_ENDPOINT } from "@/utils/constants/provider-endpoints"
import { i18n } from "@/utils/i18n"
import { ConnectionTestButton } from "./components/connection-button"
import { withForm } from "./form"

// The session cookies Doubao authenticates with are HttpOnly, so `document.cookie`
// cannot see them — the cookie store can, and the "cookies" permission is asked
// for exactly that. Reading them per request URL yields what the browser itself
// would have sent, an expired cookie included: this only says "logged in", the
// endpoint still has the last word.
const SESSION_COOKIE_NAME = "sessionid"

async function readDoubaoCookie(): Promise<string | null> {
  const cookies = await browser.cookies.getAll({ url: DOUBAO_TRANSLATE_ENDPOINT })
  if (!cookies.some((cookie) => cookie.name === SESSION_COOKIE_NAME)) return null
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ")
}

export const DoubaoCookieField = withForm({
  ...{ defaultValues: {} as APIProviderConfig },
  render: function Render({ form }) {
    const providerConfig = useSelector(form.store, (state) => state.values)
    const autosave = useAutosaveContext()
    const [showCookie, setShowCookie] = useState(false)
    const [fetching, setFetching] = useState(false)

    if (providerConfig.provider !== "doubao-translate") {
      return null
    }

    const handleFetchCookie = async () => {
      setFetching(true)
      try {
        const cookie = await readDoubaoCookie()
        if (!cookie) {
          // Nothing to fill: what the user is missing is the login itself.
          await browser.tabs.create({ url: DOUBAO_LOGIN_URL })
          toastManager.add({
            type: "error",
            title: i18n.t("options.apiProviders.form.cookieNotLoggedIn"),
          })
          return
        }

        autosave.edit(
          () => {
            form.setFieldValue("cookie", cookie as never, {
              dontUpdateMeta: true,
              dontRunListeners: true,
            })
          },
          { immediate: true },
        )
        toastManager.add({
          type: "success",
          title: i18n.t("options.apiProviders.form.cookieFilled"),
        })
      } catch {
        toastManager.add({
          type: "error",
          title: i18n.t("options.apiProviders.form.cookieFetchFailed"),
        })
      } finally {
        setFetching(false)
      }
    }

    return (
      <form.AppField name="cookie">
        {(field) => (
          <div className="flex flex-col gap-2">
            <field.InputFieldAutoSave
              label={i18n.t("options.apiProviders.form.fields.cookie")}
              labelExtra={
                <div className="flex items-center gap-2">
                  <ConnectionTestButton providerConfig={providerConfig} />
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    className="gap-2"
                    onClick={() => void handleFetchCookie()}
                    disabled={fetching}
                  >
                    {fetching && <LoadingDots className="scale-75" />}
                    <span className="text-xs">
                      {i18n.t(
                        fetching
                          ? "options.apiProviders.form.cookieFetching"
                          : "options.apiProviders.form.fetchCookie",
                      )}
                    </span>
                  </Button>
                </div>
              }
              type={showCookie ? "text" : "password"}
              placeholder="sessionid=...; sid_tt=...; uid_tt=..."
            />
            <div className="mt-0.5 flex items-center space-x-2">
              <Checkbox
                id={`cookie-${providerConfig.id}`}
                checked={showCookie}
                onCheckedChange={(checked) => setShowCookie(checked)}
              />
              <label
                htmlFor={`cookie-${providerConfig.id}`}
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {i18n.t("options.apiProviders.form.showCookie")}
              </label>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              {i18n.t("options.apiProviders.form.cookieHint")}
            </p>
          </div>
        )}
      </form.AppField>
    )
  },
})
