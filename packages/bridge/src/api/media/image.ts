import { openNativelyCameraTakePhoto, TempFile } from "./camera"
import { openNativelyAlbumChoosePhoto } from "./album"
import { showActionSheet } from "../ui/interaction"
import { invoke } from "../../bridge"
import {
  invokeSuccess,
  invokeFailure,
  invokeCallback,
  GeneralCallbackResult,
  AsyncReturn,
  SuccessResult,
  wrapperAsyncAPI
} from "../../async"
import { extend } from "@nzoth/shared"

const enum Events {
  PREVIEW_IMAGE = "previewImage"
}

interface PreviewImageOptions {
  urls: string[]
  current: string
  success?: PreviewImageSuccessCallback
  fail?: PreviewImageFailCallback
  complete?: PreviewImageCompleteCallback
}

type PreviewImageSuccessCallback = (res: GeneralCallbackResult) => void

type PreviewImageFailCallback = (res: GeneralCallbackResult) => void

type PreviewImageCompleteCallback = (res: GeneralCallbackResult) => void

export function previewImage<
  T extends PreviewImageOptions = PreviewImageOptions
>(options: T): AsyncReturn<T, PreviewImageOptions> {
  return wrapperAsyncAPI<T>(options => {
    const event = Events.PREVIEW_IMAGE
    if (!options.urls) {
      invokeFailure(
        Events.PREVIEW_IMAGE,
        options,
        "options urls cannot be empty"
      )
      return
    }
    invoke<SuccessResult<T>>(event, options, result => {
      invokeCallback(event, options, result)
    })
  }, options)
}

interface ChooseImageOptions {
  count?: number
  sizeType?: Array<"original" | "compressed">
  sourceType?: Array<"album" | "camera">
  success?: ChooseImageSuccessCallback
  fail?: ChooseImageFailCallback
  complete?: ChooseImageCompleteCallback
}

interface ChooseImageSuccessCallbackResult {
  tempFilePaths: string[]
  tempFiles: TempFile[]
}

type ChooseImageSuccessCallback = (
  res: ChooseImageSuccessCallbackResult
) => void

type ChooseImageFailCallback = (res: GeneralCallbackResult) => void

type ChooseImageCompleteCallback = (res: GeneralCallbackResult) => void

export function chooseImage<T extends ChooseImageOptions = ChooseImageOptions>(
  options: T
): AsyncReturn<T, ChooseImageOptions> {
  return wrapperAsyncAPI<T>(options => {
    const finalOptions = extend(
      {
        count: 9,
        sizeType: ["original", "compressed"],
        sourceType: ["album", "camera"]
      },
      options
    )

    const haveCamera = finalOptions.sourceType!.includes("camera")
    const haveAlbum = finalOptions.sourceType!.includes("album")

    const openCamera = () => {
      openNativelyCameraTakePhoto(finalOptions.sizeType!)
        .then(result => {
          invokeSuccess("chooseImage", finalOptions, {
            tempFilePaths: [result.tempFilePath],
            tempFiles: [result.tempFile]
          })
        })
        .catch(error => {
          invokeFailure("chooseImage", finalOptions, error)
        })
    }

    const openAlbum = () => {
      openNativelyAlbumChoosePhoto({
        count: finalOptions.count!,
        sizeType: finalOptions.sizeType!
      })
        .then(result => {
          invokeSuccess("chooseImage", finalOptions, result)
        })
        .catch(error => {
          invokeFailure("chooseImage", finalOptions, error)
        })
    }

    if (haveCamera && !haveAlbum) {
      openCamera()
      return
    }

    if (haveAlbum && !haveCamera) {
      openAlbum()
      return
    }

    showActionSheet({ itemList: ["拍照", "从手机相册选择"] })
      .then(result => {
        const tapIndex = result.tapIndex
        if (tapIndex === -1) {
          invokeFailure("chooseImage", finalOptions, "cancel")
        } else if (tapIndex === 0) {
          openCamera()
        } else if (tapIndex === 1) {
          openAlbum()
        }
      })
      .catch(error => {
        invokeFailure("chooseImage", finalOptions, error)
      })
  }, options)
}
