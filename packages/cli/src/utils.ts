import fs from "fs"
import path from "path"
import crypto from "crypto"
import tmp from "tmp"
import archiver from "archiver"

export function getRelativeFilePath(p: string, filepath: string) {
  const i = filepath.indexOf(p)
  return filepath.substring(i + p.length)
}

export function getDirAllFiles(dir: string) {
  const list: string[] = []
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(item => {
      const filepath = path.join(dir, item)
      const stats = fs.statSync(filepath)
      if (stats.isDirectory()) {
        const sub = getDirAllFiles(filepath)
        list.push(...sub)
      } else {
        list.push(filepath)
      }
    })
  }
  return list
}

export function hash(str: string) {
  return crypto.createHash("sha256").update(str).digest("hex")
}

export function getFileHash(filepath: string) {
  if (fs.existsSync(filepath)) {
    const code = fs.readFileSync(filepath).toString()
    const fileHash = hash(code)
    return fileHash
  }
  return ""
}

export function getAppConfig() {
  const fp = path.resolve("src/app.json")
  delete require.cache[fp]
  const config = require(fp)
  if (!config) {
    throw "请在项目 src 目录中创建 app.json"
  }
  return config
}

export function getAppId() {
  const { appId } = getAppConfig()
  if (!appId) {
    throw "请在 app.json 中设置 appId， 不能为空"
  }
  return appId
}

export function zip(root: string, files: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    tmp.file({ postfix: ".zip" }, function (err, dir, _, cleanup) {
      if (err) {
        reject(err)
      } else {
        const stream = fs.createWriteStream(dir)

        const archive = archiver.create("zip", {
          zlib: { level: 9 }
        })

        archive
          .on("error", err => {
            cleanup()
            reject(err)
          })
          .pipe(stream)

        stream.on("finish", () => {
          cleanup()
          const data = fs.readFileSync(dir)
          resolve(data)
        })

        files.forEach(file => {
          const name = getRelativeFilePath(root, file)
          archive.file(file, { name })
        })
        archive.finalize()
      }
    })
  })
}
