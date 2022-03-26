import type { Plugin, ResolvedConfig } from "vite"
import colors from "picocolors"
import ws from "ws"
import path from "path"
import { getDirAllFiles, getFileHash, getAppId, zip } from "./utils"
import {
  runWebSocketServer,
  createMessage,
  createFileMessage
} from "./webSocket"

let firstBuildFinished = false

let serviceVersion = Date.now()

const prevFileHash = new Map()

let wsClient: ws | undefined

let config: ResolvedConfig

interface DevSDKOptions {
  root: string
}

interface DevLaunchOptions {
  page: string
  query?: string
}

export interface Options {
  host?: string | boolean
  port?: number
  devSDK?: DevSDKOptions
  launchOptions?: DevLaunchOptions
}

export default function vitePluginNZothDevtools(options: Options = {}): Plugin {
  createWebSocketServer(options)
  return {
    name: "vite:nzoth-devtools",

    enforce: "post",

    configResolved(reslovedConfig) {
      config = reslovedConfig
    },

    writeBundle() {
      firstBuildFinished = true
      serviceVersion = Date.now()
      update()
    }
  }
}

function send(data: any) {
  wsClient && wsClient.readyState === 1 && data && wsClient.send(data)
}

let options: Options
/**
 * 启动 WebSocket Server
 * @param options
 */
function createWebSocketServer(opts: Options) {
  options = opts
  runWebSocketServer({
    host: options.host,
    port: options.port,
    onConnect: client => {
      wsClient = client
      checkClientVersion()
    },
    onDisconnect: code => {
      wsClient = undefined
    },
    onRecv: message => {
      if (message === "ping") {
        send("pong")
      } else {
        try {
          const obj = JSON.parse(message)
          obj && onRecv(obj)
        } catch {}
      }
    }
  })
}

function onRecv(message: { event: string; data: Record<string, any> }) {
  switch (message.event) {
    case "version":
      const { version: clientVersion } = message.data
      if (clientVersion !== serviceVersion.toString()) {
        if (firstBuildFinished) {
          prevFileHash.clear()
          update()
        }
      }
      break
  }
}

/**
 * 查询客户端是否需要更新
 */
function checkClientVersion() {
  const appId = getAppId()
  const message = JSON.stringify({ appId })
  const data = createMessage("--CHECKVERSION--", message)
  send(data)
}

/**
 * 增量更新客户端
 */
function update() {
  wsClient && wsClient.readyState === 1 && sendAllPackageFile()
}

/**
 * 向客户端发送执行命令
 * @param event
 * @param body
 */
export function exec(event: string, params: Record<string, any>) {
  const body = JSON.stringify({ event, params })
  const data = createMessage("--EXEC--", body)
  send(data)
}

/**
 * 向客户端发送需要更新的文件
 */
function sendAllPackageFile() {
  return new Promise(async () => {
    const appId = getAppId()

    config.logger.info(colors.cyan(`\ncheck ${appId} update...`))

    const updateFiles: string[] = []

    let sdkFiles: string[] = []
    if (options.devSDK) {
      sdkFiles = loadSDKFiles(options.devSDK.root)
      sdkFiles = getNeedUpdateFiles(sdkFiles)
      updateFiles.push(...sdkFiles)
    }

    let appFiles = loadAppFiles()
    appFiles = getNeedUpdateFiles(appFiles)
    updateFiles.push(...appFiles)

    if (updateFiles.length) {
      config.logger.info(
        `\n${colors.green(`✓`)} ${updateFiles.length} files required update.\n`
      )

      const files: string[] = []

      let sdk: Buffer | null = null
      if (sdkFiles.length) {
        sdk = await zip("dist/", sdkFiles)
        files.push("sdk")
      }

      let app: Buffer | null = null
      if (appFiles.length) {
        app = await zip(config.build.outDir + "/", appFiles)
        files.push("app")
      }

      if (files.length) {
        const message = JSON.stringify({
          appId,
          files,
          version: serviceVersion.toString(),
          launchOptions: options.launchOptions
        })

        const data = createMessage("--UPDATE--", message)
        send(data)

        if (sdk) {
          const data = createFileMessage(appId, "sdk", sdk)
          send(data)
        }

        if (app) {
          const data = createFileMessage(appId, "app", app)
          send(data)
        }

        config.logger.info(
          colors.cyan(`push ${appId} update files to client completed.\n`)
        )
      }
    } else {
      config.logger.info(colors.cyan("\nno update"))
    }
    return Promise.resolve()
  })
}

/**
 * 读取基础库文件
 * @returns
 */
function loadSDKFiles(root: string) {
  const pkgs = ["nzoth", "webview", "vue"]
  const include: Record<string, string[]> = {
    nzoth: ["nzoth.global.js"],
    webview: ["webview.global.js", "nzoth-built-in.css", "index.html"],
    vue: ["vue.runtime.global.js"]
  }

  const allFiles: string[] = []
  const pkgsDir = path.resolve(root)
  pkgs.forEach(pkg => {
    const pkgDir = path.resolve(pkgsDir, `${pkg}/dist`)
    const files = include[pkg].map(file => path.join(pkgDir, file))
    allFiles.push(...files)
  })
  return allFiles
}

/**
 * 读取 App 文件
 * @returns
 */
function loadAppFiles() {
  const files = getDirAllFiles(path.resolve("dist/"))
  return files.filter(file => path.extname(file) !== "d.ts")
}

/**
 * 过滤出需要更新的文件
 * @param files
 * @returns
 */
function getNeedUpdateFiles(files: string[]) {
  const changedFiles: string[] = []
  for (const filepath of files) {
    const hash = getFileHash(filepath)
    if (hash) {
      if (prevFileHash.get(filepath) !== hash) {
        prevFileHash.set(filepath, hash)
        changedFiles.push(filepath)
      }
    }
  }
  return changedFiles
}
