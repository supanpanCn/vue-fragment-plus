import { precessDomApi } from './utils'
import component from './component.js'
export const Fragment = {
  install(Vue){
    precessDomApi()
    Vue.component('Fragment', component)
  }
}
export default {
  Fragment
}