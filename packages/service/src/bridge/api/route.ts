import { InnerJSBridge } from "../bridge"
import {
  AsyncReturn,
  SuccessResult,
  GeneralCallbackResult,
  invokeCallback,
  invokeFailure,
  invokeSuccess,
  wrapperAsyncAPI
} from "@nzoth/bridge"
import { innerAppData } from "../../app"

export function urlGetQuery(path: string) {
  const query: Record<string, any> = {}

  const start = path.indexOf("?")
  if (start < 0) {
    return query
  }
  const queryString = path.substring(start + 1)

  const pl = /\+/g
  function decode(s: string) {
    return decodeURIComponent(s.replace(pl, " "))
  }

  const search = /([^&=]+)=?([^&]*)/g

  let match: RegExpExecArray | null
  while ((match = search.exec(queryString))) {
    query[decode(match[1])] = decode(match[2])
  }
  return query
}

const enum Events {
  NAVIGATE_TO = "navigateTo",
  NAVIGATE_BACK = "navigateBack",
  REDIRECT_TO = "redirectTo",
  RE_LAUNCH = "reLaunch",
  SWITCH_TAB = "switchTab"
}

interface NavigateToOptions {
  url: string
  success?: NavigateToSuccessCallback
  fail?: NavigateToFailCallback
  complete?: NavigateToCompleteCallback
}

type NavigateToSuccessCallback = (res: GeneralCallbackResult) => void

type NavigateToFailCallback = (res: GeneralCallbackResult) => void

type NavigateToCompleteCallback = (res: GeneralCallbackResult) => void

export function navigateTo<T extends NavigateToOptions = NavigateToOptions>(
  options: T
): AsyncReturn<T, NavigateToOptions> {
  return wrapperAsyncAPI<T>(options => {
    if (innerAppData.routerLock) {
      invokeFailure(
        Events.NAVIGATE_TO,
        options,
        "防止重复多次打开页面，需要在新页面打开完成后才能调用。"
      )
      return
    }

    if (!options.url) {
      invokeFailure(Events.NAVIGATE_TO, options, "options url can not be empty")
      return
    }

    innerAppData.routerLock = true
    InnerJSBridge.invoke(Events.NAVIGATE_TO, { url: options.url }, result => {
      innerAppData.routerLock = false
      if (result.errMsg) {
        invokeFailure(Events.NAVIGATE_TO, options, result.errMsg)
      } else {
        const query = urlGetQuery(options.url)
        innerAppData.query = query
        invokeSuccess(Events.NAVIGATE_TO, options, {})
      }
    })
  }, options)
}

interface NavigateBackOptions {
  delta?: number
  success?: NavigateBackSuccessCallback
  fail?: NavigateBackFailCallback
  complete?: NavigateBackCompleteCallback
}

type NavigateBackSuccessCallback = (res: GeneralCallbackResult) => void

type NavigateBackFailCallback = (res: GeneralCallbackResult) => void

type NavigateBackCompleteCallback = (res: GeneralCallbackResult) => void

export function navigateBack<
  T extends NavigateBackOptions = NavigateBackOptions
>(options: T): AsyncReturn<T, NavigateBackOptions> {
  return wrapperAsyncAPI<T>(options => {
    if (innerAppData.routerLock) {
      invokeFailure(
        Events.NAVIGATE_BACK,
        options,
        "防止重复多次打开页面，需要在新页面打开完成后才能调用。"
      )
      return
    }

    innerAppData.routerLock = true
    InnerJSBridge.invoke<SuccessResult<T>>(
      Events.NAVIGATE_BACK,
      { delta: options.delta || 1 },
      result => {
        innerAppData.routerLock = false
        invokeCallback(Events.NAVIGATE_BACK, options, result)
      }
    )
  }, options)
}

interface RedirectToOptions {
  url: string
  success?: RedirectToSuccessCallback
  fail?: RedirectToFailCallback
  complete?: RedirectToCompleteCallback
}

type RedirectToSuccessCallback = (res: GeneralCallbackResult) => void

type RedirectToFailCallback = (res: GeneralCallbackResult) => void

type RedirectToCompleteCallback = (res: GeneralCallbackResult) => void

export function redirectTo<T extends RedirectToOptions = RedirectToOptions>(
  options: T
): AsyncReturn<T, RedirectToOptions> {
  return wrapperAsyncAPI<T>(options => {
    if (!options.url) {
      invokeFailure(Events.REDIRECT_TO, options, "options url cannot be empty")
      return
    }

    InnerJSBridge.invoke<SuccessResult<T>>(
      Events.REDIRECT_TO,
      { url: options.url },
      result => {
        invokeCallback(Events.REDIRECT_TO, options, result)
      }
    )
  }, options)
}

interface ReLaunchOptions {
  url: string
  success?: ReLaunchSuccessCallback
  fail?: ReLaunchFailCallback
  complete?: ReLaunchCompleteCallback
}

type ReLaunchSuccessCallback = (res: GeneralCallbackResult) => void

type ReLaunchFailCallback = (res: GeneralCallbackResult) => void

type ReLaunchCompleteCallback = (res: GeneralCallbackResult) => void

export function reLaunch<T extends ReLaunchOptions = ReLaunchOptions>(
  options: T
): AsyncReturn<T, ReLaunchOptions> {
  return wrapperAsyncAPI<T>(options => {
    if (!options.url) {
      invokeFailure(Events.RE_LAUNCH, options, "options url can not be empty")
      return
    }

    InnerJSBridge.invoke<SuccessResult<T>>(
      Events.RE_LAUNCH,
      { url: options.url },
      result => {
        invokeCallback(Events.RE_LAUNCH, options, result)
      }
    )
  }, options)
}

interface SwitchTabOptions {
  url: string
  success?: SwitchTabSuccessCallback
  fail?: SwitchTabFailCallback
  complete?: SwitchTabCompleteCallback
}

type SwitchTabSuccessCallback = (res: GeneralCallbackResult) => void

type SwitchTabFailCallback = (res: GeneralCallbackResult) => void

type SwitchTabCompleteCallback = (res: GeneralCallbackResult) => void

export function switchTab<T extends SwitchTabOptions = SwitchTabOptions>(
  options: T
): AsyncReturn<T, SwitchTabOptions> {
  return wrapperAsyncAPI<T>(options => {
    if (!options.url) {
      invokeFailure(Events.SWITCH_TAB, options, "options url can not be empty")
      return
    }

    InnerJSBridge.invoke<SuccessResult<T>>(
      Events.SWITCH_TAB,
      { url: options.url },
      result => {
        invokeCallback(Events.SWITCH_TAB, options, result)
      }
    )
  }, options)
}
