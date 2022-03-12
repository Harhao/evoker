import { createApp } from "nzoth"
import App from "./App.vue"
import { CellGroup, Cell } from "vant"

import "./tailwind.css"

const app = createApp(App)

app.config.errorHandler = (err, vm, info) => {
  console.log(err, vm, info)
}

app.config.warnHandler = (msg, vm, trace) => {
  console.log(msg, vm, trace)
}

/** @ts-ignore */
app.use(CellGroup).use(Cell)

app.mount("#app")
