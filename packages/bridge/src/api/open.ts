import { invoke } from "../bridge"
import {
  invokeCallback,
  invokeFailure,
  GeneralCallbackResult,
  AsyncReturn,
  SuccessResult,
  wrapperAsyncAPI
} from "../async"
import {
  AuthorizationStatus,
  getAuthorize,
  setAuthorize,
  openAuthorizationView
} from "./auth"
import { extend } from "@nzoth/shared"

const enum Events {
  GET_USER_INFO = "getUserInfo",
  LOGIN = "login",
  CHECK_SESSION = "checkSession"
}

interface GetUserInfoOptions {
  withCredentials?: boolean
  lang?: "en" | "zh_CN" | "zh_TW"
  success?: GetUserInfoSuccessCallback
  fail?: GetUserInfoFailCallback
  complete?: GetUserInfoCompleteCallback
}

type GetUserInfoSuccessCallback = (res: GeneralCallbackResult) => void

type GetUserInfoFailCallback = (res: GeneralCallbackResult) => void

type GetUserInfoCompleteCallback = (res: GeneralCallbackResult) => void

export function getUserInfo<T extends GetUserInfoOptions = GetUserInfoOptions>(
  options: T
): AsyncReturn<T, GetUserInfoOptions> {
  return wrapperAsyncAPI<T>(async options => {
    const scope = "scope.userInfo"

    const _getUserInfo = () => {
      invoke<SuccessResult<T>>(
        Events.GET_USER_INFO,
        extend({ withCredentials: false, lang: "en" }, options),
        result => {
          invokeCallback(Events.GET_USER_INFO, options, result)
        }
      )
    }

    try {
      const status = await getAuthorize(scope)
      if (status === AuthorizationStatus.authorized) {
        _getUserInfo()
      } else {
        const authorized = await openAuthorizationView(scope)
        if (authorized) {
          _getUserInfo()
        } else {
          invokeFailure(Events.GET_USER_INFO, options, "auth denied")
        }
        setAuthorize(scope, authorized)
      }
    } catch (error) {
      invokeFailure(Events.GET_USER_INFO, options, scope + error)
    }
  }, options)
}

interface LoginOptions {
  success?: LoginSuccessCallback
  fail?: LoginFailCallback
  complete?: LoginCompleteCallback
}

interface LoginSuccessCallbackResult {
  code: string
}

type LoginSuccessCallback = (res: LoginSuccessCallbackResult) => void

type LoginFailCallback = (res: GeneralCallbackResult) => void

type LoginCompleteCallback = (res: GeneralCallbackResult) => void

export function login<T extends LoginOptions = LoginOptions>(
  options: T
): AsyncReturn<T, LoginOptions> {
  return wrapperAsyncAPI<T>(options => {
    invoke<SuccessResult<T>>(Events.LOGIN, options, result => {
      invokeCallback(Events.LOGIN, options, result)
    })
  }, options)
}

interface CheckSessionOptions {
  success?: CheckSessionSuccessCallback
  fail?: CheckSessionFailCallback
  complete?: CheckSessionCompleteCallback
}

type CheckSessionSuccessCallback = (res: GeneralCallbackResult) => void

type CheckSessionFailCallback = (res: GeneralCallbackResult) => void

type CheckSessionCompleteCallback = (res: GeneralCallbackResult) => void

export function checkSession<
  T extends CheckSessionOptions = CheckSessionOptions
>(options: T): AsyncReturn<T, CheckSessionOptions> {
  return wrapperAsyncAPI<T>(options => {
    invoke<SuccessResult<T>>(Events.CHECK_SESSION, options, result => {
      invokeCallback(Events.CHECK_SESSION, options, result)
    })
  }, options)
}
