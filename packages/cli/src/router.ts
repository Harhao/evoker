import type { Plugin } from "vite"
import { getAppConfig } from "./utils"
import color from "picocolors"

interface Page {
  path: string
}

let prevPages: Page[] = []

export default function vitePluginEvokerRouter(): Plugin {
  return {
    name: "vite:evoker-router",

    transform(code: string, id: string) {
      if (!id.endsWith("app.json")) {
        return
      }

      const config = getAppConfig()

      const imports: string[] = []
      const defines: string[] = []

      const newPages: Page[] = []
      for (let i = 0; i < config.pages.length; i++) {
        const page = config.pages[i] as Page
        const name = `evoker$${i}`
        imports.push(`import ${name} from './${page.path}.vue'`)
        defines.push(`defineRouter('${page.path}', ${name})`)
        newPages.push(page)
      }

      const addPages = newPages.filter(x => {
        return prevPages.findIndex(y => y.path === x.path) === -1
      })

      const delPages = prevPages.filter(x => {
        return newPages.findIndex(y => x.path === y.path) === -1
      })

      if (addPages.length || delPages.length) {
        console.log()
        for (const page of addPages) {
          console.log(`loaded page: ${color.cyan(page.path)} `)
        }

        prevPages = prevPages.concat(addPages)

        for (const page of delPages) {
          console.log(`remove page: ${color.cyan(page.path)}`)
          const i = prevPages.findIndex(y => y.path === page.path)
          if (i > -1) {
            prevPages.splice(i, 1)
          }
        }
      }

      const nextLine = "\n"

      code += `import { defineRouter } from 'evoker'${nextLine}`
      code += imports.join(nextLine) + nextLine
      code += defines.join(nextLine) + nextLine
      return {
        code
      }
    }
  }
}
