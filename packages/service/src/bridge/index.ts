import {
  getWindowInfo,
  getAppBaseInfo,
  getDeviceInfo,
  getSystemSetting,
  getSystemInfo,
  getSystemInfoAsync,
  getSystemInfoSync
} from "./api/base/system"
import { navigateTo, navigateBack, redirectTo, reLaunch, switchTab } from "./api/route"
import { navigateToMiniProgram } from "@nzoth/bridge"
import { getStorage, setStorage, removeStorage, clearStorage, getStorageInfo } from "@nzoth/bridge"
import {
  showModal,
  showToast,
  showLoading,
  showActionSheet,
  hideLoading,
  hideToast
} from "@nzoth/bridge"
import {
  setNavigationBarTitle,
  showNavigationBarLoading,
  hideNavigationBarLoading,
  setNavigationBarColor,
  hideHomeButton
} from "@nzoth/bridge"
import { startPullDownRefresh, stopPullDownRefresh } from "@nzoth/bridge"
import { previewImage, chooseImage, chooseVideo } from "@nzoth/bridge"
import { createCameraContext } from "./api/media/camera"
import { createInnerAudioContext } from "@nzoth/bridge"
import { vibrateShort, vibrateLong } from "@nzoth/bridge"
import {
  getNetworkType,
  getLocalIPAddress,
  onNetworkStatusChange,
  offNetworkStatusChange
} from "@nzoth/bridge"
import { scanCode } from "@nzoth/bridge"
import {
  getScreenBrightness,
  setScreenBrightness,
  onUserCaptureScreen,
  offUserCaptureScreen
} from "@nzoth/bridge"
import { getClipboardData, setClipboardData } from "@nzoth/bridge"
import { makePhoneCall } from "@nzoth/bridge"
import { rsa } from "@nzoth/bridge"
import { createSelectorQuery } from "./api/html/selector"
import { getBatteryInfo } from "@nzoth/bridge"
import {
  setTabBarBadge,
  hideTabBarRedDot,
  setTabBarItem,
  setTabBarStyle,
  showTabBarRedDot,
  removeTabBarBadge
} from "@nzoth/bridge"
import { request, downloadFile, uploadFile } from "./api/request"
import { createAnimation } from "./api/ui/animation"
import { pageScrollTo } from "./api/ui/scroll"
import { loadFontFace } from "./api/ui/font"
import {
  getLocation,
  startLocationUpdate,
  stopLocationUpdate,
  onLocationChange,
  offLocationChange
} from "@nzoth/bridge"
import { getRecorderManager } from "@nzoth/bridge"
import { getSetting, authorize } from "@nzoth/bridge"
import { getUserProfile } from "./api/open"
import { openSetting } from "./api/auth"
import { login, checkSession } from "@nzoth/bridge"
import { showTabBar, hideTabBar } from "../bridge/api/ui/tabBar"
import { createIntersectionObserver } from "./api/html/intersection"
import "./fromWebView"

const env = { USER_DATA_PATH: "nzfile://usr" }

export {
  env,
  navigateTo,
  navigateBack,
  redirectTo,
  switchTab,
  reLaunch,
  getStorage,
  setStorage,
  removeStorage,
  clearStorage,
  getStorageInfo,
  showModal,
  setNavigationBarTitle,
  showNavigationBarLoading,
  hideNavigationBarLoading,
  setNavigationBarColor,
  hideHomeButton,
  previewImage,
  chooseImage,
  chooseVideo,
  request,
  downloadFile,
  uploadFile,
  showLoading,
  hideLoading,
  showToast,
  hideToast,
  startPullDownRefresh,
  stopPullDownRefresh,
  showActionSheet,
  vibrateShort,
  vibrateLong,
  rsa,
  getWindowInfo,
  navigateToMiniProgram,
  createCameraContext,
  createInnerAudioContext,
  getAppBaseInfo,
  getDeviceInfo,
  getSystemSetting,
  getSystemInfo,
  getSystemInfoAsync,
  getSystemInfoSync,
  createSelectorQuery,
  getBatteryInfo,
  getNetworkType,
  getLocalIPAddress,
  scanCode,
  getScreenBrightness,
  setScreenBrightness,
  showTabBar,
  hideTabBar,
  setTabBarBadge,
  hideTabBarRedDot,
  setTabBarItem,
  setTabBarStyle,
  showTabBarRedDot,
  removeTabBarBadge,
  getClipboardData,
  setClipboardData,
  makePhoneCall,
  onNetworkStatusChange,
  offNetworkStatusChange,
  onUserCaptureScreen,
  offUserCaptureScreen,
  createAnimation,
  pageScrollTo,
  loadFontFace,
  getLocation,
  startLocationUpdate,
  stopLocationUpdate,
  onLocationChange,
  offLocationChange,
  getRecorderManager,
  getSetting,
  openSetting,
  authorize,
  getUserProfile,
  login,
  checkSession,
  createIntersectionObserver
}

export default {
  env,
  navigateTo,
  navigateBack,
  redirectTo,
  switchTab,
  reLaunch,
  getStorage,
  setStorage,
  removeStorage,
  clearStorage,
  getStorageInfo,
  showModal,
  setNavigationBarTitle,
  showNavigationBarLoading,
  hideNavigationBarLoading,
  setNavigationBarColor,
  hideHomeButton,
  previewImage,
  chooseImage,
  chooseVideo,
  request,
  downloadFile,
  uploadFile,
  showLoading,
  hideLoading,
  showToast,
  hideToast,
  startPullDownRefresh,
  stopPullDownRefresh,
  showActionSheet,
  vibrateShort,
  vibrateLong,
  rsa,
  getWindowInfo,
  navigateToMiniProgram,
  createCameraContext,
  createInnerAudioContext,
  getAppBaseInfo,
  getDeviceInfo,
  getSystemSetting,
  getSystemInfo,
  getSystemInfoAsync,
  getSystemInfoSync,
  createSelectorQuery,
  getBatteryInfo,
  getNetworkType,
  getLocalIPAddress,
  scanCode,
  getScreenBrightness,
  setScreenBrightness,
  showTabBar,
  hideTabBar,
  setTabBarBadge,
  hideTabBarRedDot,
  setTabBarItem,
  setTabBarStyle,
  showTabBarRedDot,
  removeTabBarBadge,
  getClipboardData,
  setClipboardData,
  makePhoneCall,
  onNetworkStatusChange,
  offNetworkStatusChange,
  onUserCaptureScreen,
  offUserCaptureScreen,
  createAnimation,
  pageScrollTo,
  loadFontFace,
  getLocation,
  startLocationUpdate,
  stopLocationUpdate,
  onLocationChange,
  offLocationChange,
  getRecorderManager,
  getSetting,
  openSetting,
  authorize,
  getUserProfile,
  login,
  checkSession,
  createIntersectionObserver
}
