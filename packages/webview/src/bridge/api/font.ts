interface LoadFontFaceDesc {
  style?: string
  weight?: string
  variant?: string
}

interface LoadFontFaceOptions {
  family: string
  source: string
  desc: LoadFontFaceDesc
}

export function loadFontFace(options: LoadFontFaceOptions) {
  return new Promise((resolve, reject) => {
    const { family, source, desc } = options
    const font = new FontFace(family, source, desc)
    font
      .load()
      .then(
        () => {
          document.fonts.add(font)
          resolve({ status: "success" })
        },
        () => {
          reject("fail")
        }
      )
      .catch(() => {
        reject("fail")
      })
  })
}
