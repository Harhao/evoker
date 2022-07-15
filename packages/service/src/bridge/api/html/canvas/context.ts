import { Canvas2DCommands } from "@evoker/shared"
import { isArray, isString } from "@vue/shared"
import { queuePostFlushCb } from "vue"
import { invokeWebViewMethod } from "../../../fromWebView"
import { Image, ImageData } from "./image"

type CanvasPatternRepetition = "repeat" | "repeat-x" | "repeat-y" | "no-repeat"

class CanvasPattern {
  image: Image

  repetition: CanvasPatternRepetition

  constructor(image: Image, repetition: CanvasPatternRepetition) {
    this.repetition = repetition ?? "repeat"
    this.image = image
  }
}

class CanvasGradient {
  stopCount = 0

  stops: Record<string, any>[] = []

  addColorStop(offset: number, color: string) {
    if (this.stopCount < 5 && 0.0 <= offset && offset <= 1.0) {
      this.stops[this.stopCount] = { offset, color }
      this.stopCount++
    }
  }
}

interface LinearGradientPosition {
  x: number
  y: number
}

class CanvasLinearGradient extends CanvasGradient {
  startPosition: LinearGradientPosition

  endPosition: LinearGradientPosition

  constructor(x0: number, y0: number, x1: number, y1: number) {
    super()

    this.startPosition = { x: x0, y: y0 }
    this.endPosition = { x: x1, y: y1 }
  }
}

interface RadialGradientPosition {
  x: number
  y: number
  r: number
}

class CanvasRadialGradient extends CanvasGradient {
  startPosition: RadialGradientPosition

  endPosition: RadialGradientPosition

  constructor(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) {
    super()
    this.startPosition = { x: x0, y: y0, r: r0 }
    this.endPosition = { x: x1, y: y1, r: r1 }
  }
}

class CanvasConicGradient extends CanvasGradient {
  startAngle: number

  x: number

  y: number

  constructor(startAngle: number, x: number, y: number) {
    super()
    this.startAngle = startAngle
    this.x = x
    this.y = y
  }
}

export class CanvasRenderingContext2D {
  private commandQueue: any[] = []

  private flush: () => void

  _direction: CanvasDirection = "inherit"

  _fillStyle: string | CanvasPattern | CanvasGradient = "#000000"

  _globalAlpha = 1.0

  _globalCompositeOperation: GlobalCompositeOperation = "source-over"

  _imageSmoothingEnabled = true

  _imageSmoothingQuality: ImageSmoothingQuality = "low"

  _lineCap: CanvasLineCap = "butt"

  _lineDashOffset = 0

  _lineJoin: CanvasLineJoin = "miter"

  _lineWidth = 1

  _miterLimit = 10

  _shadowBlur = 0

  _strokeStyle: string | CanvasPattern | CanvasGradient = "#000000"

  _shadowColor = "#000000"

  _shadowOffsetX = 0

  _shadowOffsetY = 0

  _lineDash: number[] = []

  _textAlign: CanvasTextAlign = "start"

  _textBaseline: CanvasTextBaseline = "alphabetic"

  _font = "10px sans-serif"

  _savedGlobalAlpha: number[] = []

  timer = null

  canvasId: number

  nodeId: number

  webViewId: number

  constructor(canvasId: number, nodeId: number, webViewId: number) {
    this.canvasId = canvasId
    this.nodeId = nodeId
    this.webViewId = webViewId

    this.flush = this._flush.bind(this)
  }

  private enqueue(command: any) {
    this.commandQueue.push(command)
    queuePostFlushCb(this.flush)
  }

  private _flush() {
    if (this.commandQueue.length === 0) {
      return
    }

    invokeWebViewMethod(
      "execCanvasCommand",
      { nodeId: this.nodeId, commands: this.commandQueue },
      undefined,
      this.webViewId
    )
    this.commandQueue = []
  }

  get direction() {
    return this._direction
  }

  set direction(value) {
    this._direction = value
    this.enqueue([Canvas2DCommands.SET_DIRECTION, value])
  }

  get fillStyle() {
    return this._fillStyle
  }

  set fillStyle(value) {
    this._fillStyle = value

    if (isString(value)) {
      this.enqueue([Canvas2DCommands.SET_FILL_STYLE, value])
    } else if (value instanceof CanvasPattern) {
      const image = value.image
      this.enqueue([Canvas2DCommands.SET_FILL_STYLE_BY_PATTERN, image._path, value.repetition])
    } else if (value instanceof CanvasLinearGradient) {
      const command = [
        Canvas2DCommands.SET_FILL_STYLE_BY_LINEAR_GRADIENT,
        value.startPosition.x,
        value.startPosition.y,
        value.endPosition.x,
        value.endPosition.y,
        value.stopCount
      ]
      value.stops.forEach(stop => {
        command.push(stop.offset)
        command.push(stop.color)
      })
      this.enqueue(command)
    } else if (value instanceof CanvasRadialGradient) {
      const command = [
        Canvas2DCommands.SET_FILL_STYLE_BY_RADIAL_GRADIENT,
        value.startPosition.x,
        value.startPosition.y,
        value.startPosition.r,
        value.endPosition.x,
        value.endPosition.y,
        value.endPosition.r,
        value.stopCount
      ]
      value.stops.forEach(stop => {
        command.push(stop.offset)
        command.push(stop.color)
      })
      this.enqueue(command)
    } else if (value instanceof CanvasConicGradient) {
      const command = [
        Canvas2DCommands.SET_FILL_STYLE_BY_CONIC_GRADIENT,
        value.startAngle,
        value.x,
        value.y,
        value.stopCount
      ]
      value.stops.forEach(stop => {
        command.push(stop.offset)
        command.push(stop.color)
      })
      this.enqueue(command)
    }
  }

  get font() {
    return this._font
  }

  set font(value) {
    this._font = value
    this.enqueue([Canvas2DCommands.SET_FONT, value])
  }

  get globalAlpha() {
    return this._globalAlpha
  }

  set globalAlpha(value) {
    this._globalAlpha = value
    this.enqueue([Canvas2DCommands.SET_GLOBAL_ALPHA, value])
  }

  get globalCompositeOperation() {
    return this._globalCompositeOperation
  }

  set globalCompositeOperation(value) {
    this._globalCompositeOperation = value
    this.enqueue([Canvas2DCommands.SET_GLOBAL_COMPOSITE_OPERATION, value])
  }

  get imageSmoothingEnabled() {
    return this._imageSmoothingEnabled
  }

  set imageSmoothingEnabled(value) {
    this._imageSmoothingEnabled = value
    this.enqueue([Canvas2DCommands.SET_IMAGE_SMOOTHING_ENABLED, value])
  }

  get imageSmoothingQuality() {
    return this._imageSmoothingQuality
  }

  set imageSmoothingQuality(value) {
    this._imageSmoothingQuality = value
    this.enqueue([Canvas2DCommands.SET_IMAGE_SMOOTHING_QUALITY, value])
  }

  get lineCap() {
    return this._lineCap
  }

  set lineCap(value) {
    this._lineCap = value
    this.enqueue([Canvas2DCommands.SET_LINE_CAP, value])
  }

  get lineDashOffset() {
    return this._lineDashOffset
  }

  set lineDashOffset(value) {
    this._lineDashOffset = value
    this.enqueue([Canvas2DCommands.SET_LINE_DASH_OFFSET, value])
  }

  get lineJoin() {
    return this._lineJoin
  }

  set lineJoin(value) {
    this._lineJoin = value
    this.enqueue([Canvas2DCommands.SET_LINE_JOIN, value])
  }

  get lineWidth() {
    return this._lineWidth
  }

  set lineWidth(value) {
    this._lineWidth = value
    this.enqueue([Canvas2DCommands.SET_LINE_WIDTH, value])
  }

  get miterLimit() {
    return this._miterLimit
  }

  set miterLimit(value) {
    this._miterLimit = value
    this.enqueue([Canvas2DCommands.SET_MITER_LIMIT, value])
  }

  get shadowBlur() {
    return this._shadowBlur
  }

  set shadowBlur(value) {
    this._shadowBlur = value
    this.enqueue([Canvas2DCommands.SET_SHADOW_BLUR, value])
  }

  get shadowColor() {
    return this._shadowColor
  }

  set shadowColor(value) {
    this._shadowColor = value
    this.enqueue([Canvas2DCommands.SET_SHADOW_COLOR, value])
  }

  get shadowOffsetX() {
    return this._shadowOffsetX
  }

  set shadowOffsetX(value) {
    this._shadowOffsetX = value
    this.enqueue([Canvas2DCommands.SET_SHADOW_OFFSET_X, value])
  }

  get shadowOffsetY() {
    return this._shadowOffsetY
  }

  set shadowOffsetY(value) {
    this._shadowOffsetY = value
    this.enqueue([Canvas2DCommands.SET_SHADOW_OFFSET_Y, value])
  }

  get strokeStyle() {
    return this._strokeStyle
  }

  set strokeStyle(value) {
    this._strokeStyle = value

    if (isString(value)) {
      this.enqueue([Canvas2DCommands.SET_STROKE_STYLE, value])
    } else if (value instanceof CanvasPattern) {
      const image = value.image
      this.enqueue([Canvas2DCommands.SET_STROKE_STYLE_BY_PATTERN, image._path, value.repetition])
    } else if (value instanceof CanvasLinearGradient) {
      const command = [
        Canvas2DCommands.SET_STROKE_STYLE_BY_LINEAR_GRADIENT,
        value.startPosition.x,
        value.startPosition.y,
        value.endPosition.x,
        value.endPosition.y,
        value.stopCount
      ]
      value.stops.forEach(stop => {
        command.push(stop.offset)
        command.push(stop.color)
      })
      this.enqueue(command)
    } else if (value instanceof CanvasRadialGradient) {
      const command = [
        Canvas2DCommands.SET_STROKE_STYLE_BY_RADIAL_GRADIENT,
        value.startPosition.x,
        value.startPosition.y,
        value.startPosition.r,
        value.endPosition.x,
        value.endPosition.y,
        value.endPosition.r,
        value.stopCount
      ]
      value.stops.forEach(stop => {
        command.push(stop.offset)
        command.push(stop.color)
      })
      this.enqueue(command)
    } else if (value instanceof CanvasConicGradient) {
      const command = [
        Canvas2DCommands.SET_STROKE_STYLE_BY_CONIC_GRADIENT,
        value.startAngle,
        value.x,
        value.y,
        value.stopCount
      ]
      value.stops.forEach(stop => {
        command.push(stop.offset)
        command.push(stop.color)
      })
      this.enqueue(command)
    }
  }

  get textAlign() {
    return this._textAlign
  }

  set textAlign(value) {
    this._textAlign = value
    this.enqueue([Canvas2DCommands.SET_TEXT_ALIGN, value])
  }

  get textBaseline() {
    return this._textBaseline
  }

  set textBaseline(value) {
    this._textBaseline = value
    this.enqueue([Canvas2DCommands.SET_TEXT_BASELINE, value])
  }

  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    anticlockwise?: boolean
  ) {
    this.enqueue([Canvas2DCommands.ARC, x, y, radius, startAngle, endAngle, anticlockwise])
  }

  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number) {
    this.enqueue([Canvas2DCommands.ARC_TO, x1, y1, x2, y2, radius])
  }

  beginPath() {
    this.enqueue([Canvas2DCommands.BEGIN_PATH])
  }

  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) {
    this.enqueue([Canvas2DCommands.BEZIER_CURVE_TO, cp1x, cp1y, cp2x, cp2y, x, y])
  }

  clearRect(x: number, y: number, width: number, height: number) {
    this.enqueue([Canvas2DCommands.CLEAR_RECT, x, y, width, height])
  }

  clip(fillRule?: CanvasFillRule)
  clip(path?: Path2D, fillRule?: CanvasFillRule)
  clip(first?: unknown, second?: unknown) {
    if (first) {
      if (isString(first)) {
        this.enqueue([Canvas2DCommands.CLIP, first])
      } else {
        this.enqueue([Canvas2DCommands.CLIP_BY_PATH, first, second])
      }
    } else {
      this.enqueue([Canvas2DCommands.CLIP])
    }
  }

  closePath() {
    this.enqueue([Canvas2DCommands.CLOSE_PATH])
  }

  ellipse(
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    rotation: number,
    startAngle: number,
    endAngle: number,
    anticlockwise?: boolean
  ) {
    this.enqueue([
      Canvas2DCommands.ELLIPSE,
      x,
      y,
      radiusX,
      radiusY,
      rotation,
      startAngle,
      endAngle,
      anticlockwise
    ])
  }

  fill(fillRule?: CanvasFillRule)
  fill(path?: Path2D, fillRule?: CanvasFillRule)
  fill(first?: unknown, second?: unknown) {
    if (first) {
      if (isString(first)) {
        this.enqueue([Canvas2DCommands.FILL, first])
      } else {
        this.enqueue([Canvas2DCommands.FILL_BY_PATH, first, second])
      }
    } else {
      this.enqueue([Canvas2DCommands.FILL])
    }
  }

  fillRect(x: number, y: number, w: number, h: number) {
    this.enqueue([Canvas2DCommands.FILL_RECT, x, y, w, h])
  }

  fillText(text: string, x: number, y: number, maxWidth?: number) {
    this.enqueue([Canvas2DCommands.FILL_TEXT, text, x, y, maxWidth])
  }

  lineTo(x: number, y: number) {
    this.enqueue([Canvas2DCommands.LINE_TO, x, y])
  }

  measureText(text: string) {
    throw new Error("not supported yet")
  }

  moveTo(x: number, y: number) {
    this.enqueue([Canvas2DCommands.MOVE_TO, x, y])
  }

  putImageData(
    imageData: ImageData,
    x: number,
    y: number,
    dirtyX?: number,
    dirtyY?: number,
    dirtyWidth?: number,
    dirtyHeight?: number
  ) {
    const argLen = arguments.length
    if (argLen === 3) {
      this.enqueue([
        Canvas2DCommands.PUT_IMAGE_DATA,
        imageData.width,
        imageData.height,
        Array.from(imageData.data),
        x,
        y
      ])
    } else if (argLen === 7) {
      this.enqueue([
        Canvas2DCommands.PUT_IMAGE_DATA,
        imageData.width,
        imageData.height,
        Array.from(imageData.data),
        x,
        y,
        dirtyX,
        dirtyY,
        dirtyWidth,
        dirtyHeight
      ])
    }
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
    this.enqueue([Canvas2DCommands.QUADRATIC_CURVE_TO, cpx, cpy, x, y])
  }

  rect(x: number, y: number, width: number, height: number) {
    this.enqueue([Canvas2DCommands.RECT, x, y, width, height])
  }

  resetTransform() {
    this.enqueue([Canvas2DCommands.RESET_TRANSFORM])
  }

  restore() {
    this.enqueue([Canvas2DCommands.RESTORE])
    const alpha = this._savedGlobalAlpha.pop()
    if (alpha !== undefined) {
      this._globalAlpha = alpha
    }
  }

  rotate(angle: number) {
    this.enqueue([Canvas2DCommands.ROTATE, angle])
  }

  save() {
    this._savedGlobalAlpha.push(this._globalAlpha)
    this.enqueue([Canvas2DCommands.SAVE])
  }

  scale(x: number, y: number) {
    this.enqueue([Canvas2DCommands.SCALE, x, y])
  }

  getLineDash() {
    return this._lineDash
  }

  setLineDash(segments: number[]) {
    if (isArray(segments)) {
      this._lineDash = segments
      this.enqueue([Canvas2DCommands.SET_LINE_DASH, segments])
    }
  }

  setTransform(a: number, b: number, c: number, d: number, e: number, f: number) {
    this.enqueue([Canvas2DCommands.SET_TRANSFORM, a, b, c, d, e, f])
  }

  stroke(path?: Path2D): void {
    this.enqueue([Canvas2DCommands.STROKE, path])
  }

  strokeRect(x: number, y: number, w: number, h: number) {
    this.enqueue([Canvas2DCommands.STROKE_RECT, x, y, w, h])
  }

  strokeText(text: string, x: number, y: number, maxWidth?: number) {
    this.enqueue([Canvas2DCommands.STROKE_TEXT, text, x, y, maxWidth])
  }

  transform(a: number, b: number, c: number, d: number, e: number, f: number) {
    this.enqueue([Canvas2DCommands.TRANSFORM, a, b, c, d, e, f])
  }

  translate(x: number, y: number) {
    this.enqueue([Canvas2DCommands.TRANSLATE, x, y])
  }

  createPattern(image: Image, repetition: CanvasPatternRepetition) {
    return new CanvasPattern(image, repetition)
  }

  createLinearGradient(x0: number, y0: number, x1: number, y1: number) {
    return new CanvasLinearGradient(x0, y0, x1, y1)
  }

  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) {
    return new CanvasRadialGradient(x0, y0, r0, x1, y1, r1)
  }

  createConicGradient(startAngle: number, x: number, y: number) {
    return new CanvasConicGradient(startAngle, x, y)
  }

  createImage(): Image {
    return new Image()
  }

  createImageData(width: number, height: number): ImageData {
    return new ImageData(width, height)
  }

  isPointInPath = function (x: number, y: number) {
    throw new Error("not supported yet")
  }

  drawImage(image: Image, dx: number, dy: number)
  drawImage(image: Image, dx: number, dy: number, dWidth?: number, dHeight?: number)
  drawImage(
    image: Image,
    sx: number,
    sy: number,
    sWidth?: number,
    sHeight?: number,
    dx?: number,
    dy?: number,
    dWidth?: number,
    dHeight?: number
  ) {
    const argLen = arguments.length
    if (argLen === 3) {
      this.enqueue([Canvas2DCommands.DRAW_IMAGE, image._path, sx, sy])
    } else if (argLen === 5) {
      this.enqueue([Canvas2DCommands.DRAW_IMAGE, image._path, sx, sy, sWidth, sHeight])
    } else if (argLen === 9) {
      this.enqueue([
        Canvas2DCommands.DRAW_IMAGE,
        image._path,
        sx,
        sy,
        sWidth,
        sHeight,
        dx,
        dy,
        dWidth,
        dHeight
      ])
    }
  }
}
