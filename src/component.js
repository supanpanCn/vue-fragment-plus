import { isFunction,isString,toString,toJson } from './utils'
import { defineComponent,h } from 'vue'

const componentName = 'vue-fragment-plus'

export default defineComponent({
  setup(_,{slots}){
    let children = null
    let tagType = 'div'
    let useTransform = true
    let attrs = {}
    if(isFunction(slots.default)){
      const slotNode = slots.default()[0]
      if(isString(slotNode.type)){
        tagType = slotNode.type
        useTransform = false
        attrs = slotNode.props
        children = slotNode.children
      }else{
        children = slotNode
      }
    }
    return ()=>h(tagType,{
      attrs:toString({
        transfer:useTransform
      }),
      ...attrs,
    },children)
  },
  mounted(){
    const container = this.$el
    const {transfer} = toJson(container.getAttribute('attrs'))
    if(!transfer){
      container.removeAttribute('attrs')
      return
    }
    const parent = container.parentNode
    if(!parent) return
    container.__isFragment = true
    container.__isMounted = false
    const head = document.createComment(`start--${componentName}--start`)
    const tail = document.createComment(`end--${componentName}--end`)
    container.__head = head
    container.__tail = tail
    const tpl = document.createDocumentFragment()
    tpl.appendChild(head)
    Array.from(container.childNodes)
        .forEach(node => {
            let isFragment = !!node.hasOwnProperty('__isFragmentChild__')
            tpl.appendChild(node)
            if (!isFragment) {
                node.mark('parentNode',container,'__isFragmentChild__',true)
            }
        })
    tpl.appendChild(tail)
    let next = container.nextSibling
    parent.insertBefore(tpl, container, true)
    parent.removeChild(container)
    container.mark('parentNode',parent)
    container.mark('nextSibling',next)
    if (next){
      next.mark('previousSibling',container)
    }
    container.__isMounted = true
  }
})