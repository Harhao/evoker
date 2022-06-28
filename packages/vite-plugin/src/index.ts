import type { BuildOptions, Plugin } from "vite"
import vue from "@vitejs/plugin-vue"
import type { Options as VueOptions } from "@vitejs/plugin-vue"
import devtools from "./vite-plugin-evoker-devtools"
import type { Options as DevtoolsOptions } from "./vite-plugin-evoker-devtools"
import router from "./vite-plugin-evoker-router"
import assets from "./vite-plugin-evoker-assets"
import buildConfig from "./vite-plugin-evoker-config"
import { isHTMLTag, isSVGTag } from "@vue/shared"
import compiler, { baseParse, transformModel, RootNode, CompilerOptions } from "@vue/compiler-core"
import copy from "rollup-plugin-copy"
import { resolve } from "path"
import { isBuiltInComponent } from "@evoker/shared"

export interface Options {
  mode?: string
  devtools?: DevtoolsOptions
  vue?: VueOptions
  build?: BuildOptions
}

export default function plugins(options: Options = {}) {
  let plugins: Plugin[] = [
    buildConfig(options.build),
    assets(),
    router(),
    copy({
      targets: [{ src: resolve("src/app.json"), dest: resolve("dist/") }]
    })
  ]

  const rawVueOptions: VueOptions = {
    template: {
      compilerOptions: {
        isNativeTag: tag => {
          return isHTMLTag(tag) || isSVGTag(tag) || isBuiltInComponent(tag)
        },
        directiveTransforms: {
          model: (dir, node, context) => {
            return transformModel(dir, node, context)
          }
        }
      },
      transformAssetUrls: { image: ["src"] },
      compiler: {
        compile: (template: string | RootNode, options?: CompilerOptions | undefined) => {
          // disabled createStaticVNode
          options && (options.transformHoist = null)
          return compiler.baseCompile(template, options)
        },
        parse: baseParse
      }
    }
  }
  plugins.push(vue(rawVueOptions))

  if (options.mode === "development") {
    plugins.push(devtools(options.devtools))
  }

  return plugins
}
