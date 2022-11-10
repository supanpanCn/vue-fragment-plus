import { precessDomApi } from './utils'
import component from './component.js'
export const frag = {
  install(Vue){
    precessDomApi()
    Vue.component('Fragment', component)
  }
}