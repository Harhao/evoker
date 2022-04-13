import { Component, AppContext, reactive, createVNode, App } from "vue"
import { renderer } from "./runtime-jscore/renderer"
import { InnerJSBridge } from "./bridge/bridge"
import { NZothPage } from "./dom/page"
import { NZothHTMLElement } from "./dom/html"
import { NZothEvent } from "./dom/eventTarget"
import { getPageComponentFormRoute, decodeURL } from "./router"
import { onSync } from "@nzoth/bridge"
import { SyncFlags } from "@nzoth/shared"

export const enum AppState {
  FORE_GROUND = 0,
  BACK_GROUND
}

export const innerAppData = reactive({
  appState: AppState.FORE_GROUND,
  currentPageId: 0,
  globalData: {},
  pages: new Map<number, NZothPage>(),
  currentTabIndex: 0,
  query: {},
  routerLock: false,
  eventFromUserClick: false
})

let vueContext: AppContext

export function createApp(
  rootComponent: Component,
  rootProps?: Record<string, unknown> | null | undefined
): App<Element> {
  const app = renderer.createApp(rootComponent, rootProps)
  const mount = app.mount
  app.mount = () => {
    const page = new NZothPage(-999, "hook", 0)
    const root = new NZothHTMLElement("div", page)
    root.id = "app"
    return mount(root, false, false)
  }
  vueContext = app._context
  /** @ts-ignore */
  return app
}

export function getCurrentPages() {
  const currentTabIndex = innerAppData.currentTabIndex
  const pages: NZothPage[] = []
  innerAppData.pages.forEach(
    page => page.tabIndex === currentTabIndex && pages.push(page)
  )
  return pages.sort((left, right) => {
    return left.pageId < right.pageId ? -1 : 1
  })
}

export function getCurrentWebViewId() {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  return page.pageId
}

export function getApp() {
  return { globalData: innerAppData.globalData }
}

export function mountPage(pageId: number, route: string, query: {}) {
  const component = getPageComponentFormRoute(route)
  if (!component) {
    console.error(`${route} 未定义，请在 app.json 的 pages 中定义`)
    return
  }

  const page = new NZothPage(pageId, route, innerAppData.currentTabIndex)

  innerAppData.pages.set(pageId, page)
  innerAppData.currentPageId = pageId

  const vnode = createVNode(component, {
    __pageId: pageId,
    __route: route,
    __query: query
  })
  ;(vnode as any).__pageId = pageId
  ;(vnode as any).__route = route
  vnode.appContext = vueContext

  page.vnode = vnode

  const root = new NZothHTMLElement("div", page)
  root.id = "app"
  renderer.render(vnode, root)
}

export function unmountPage(pageId: number) {
  const page = innerAppData.pages.get(pageId)
  if (page) {
    page.onUnmounted()
    innerAppData.pages.delete(pageId)
  }
}

InnerJSBridge.subscribe<{ pageId: number; path: string }>(
  "PAGE_BEGIN_MOUNT",
  message => {
    const { pageId, path } = message
    const { path: route, query } = decodeURL(path)
    mountPage(pageId, route, query)
  }
)

onSync(messages => {
  messages.forEach(action => {
    const ACTION = action[0]
    if (ACTION === SyncFlags.DISPATCH_EVENT) {
      dispatchEvent(action)
    }
  })
})

function dispatchEvent(data: any[]) {
  const [_, pageId, nodeId, event] = data
  const page = innerAppData.pages.get(pageId)
  if (page) {
    const node = page.nodes.get(nodeId)
    if (node) {
      const customEvent = new NZothEvent(event.type)
      customEvent.target = node
      customEvent.args = event.args

      innerAppData.eventFromUserClick = event.type === "click"
      node.dispatchEvent(customEvent)
      innerAppData.eventFromUserClick = false
    }
  }
}
