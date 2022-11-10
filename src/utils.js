

export const isFunction = (p) => typeof p === "function";
export const isObj = (p) =>
  Object.prototype.toString.call(p) === "[object Object]";
export const isString = (p) => typeof p === "string";

export const toString = (p) => JSON.stringify(p);
export const toJson = (p) => JSON.parse(p);

export const freeze = (object, property, value) => {
  Object.defineProperty(object, property, {
    configurable: true,
    get() { return value; },
    set(v) { console.warn(`tried to set frozen property ${property} with ${v}`) }
  });
};

export const unfreeze = (object, property, value = null) => {
  Object.defineProperty(object, property, {
    configurable: true,
    writable: true,
    value: value
  });
};

export const precessDomApi = () => {
  window.Node.prototype.mark = function(){
    const args = Array.from(arguments)
    let result = []
    let item = []
    args.forEach((v,i)=>{
      item.push(v)
      if((i+1)%2===0){
        result.push(item)
        item = []
      }
    })
    result = result.filter(v=>v.length===2)
    result.forEach(v=>{
      const [key,value] = v
      freeze(this,key,value)
    })
  }

  window.Node.prototype.unmark = function(key,value){
    unfreeze(this,key,value)
  }

  const _innerRemoveChild = window.Node.prototype.removeChild;
  window.Node.prototype.removeChild = function (node) {
    if (this.__isFragment) {
      if (this.parentNode) {
        const ret = this.parentNode.removeChild(node);
        node.unmark('parentNode')
        return ret;
      }
    } else if (node.__isFragment && node.__isMounted) {
      while (node.__head.nextSibling !== node.__tail)
        _innerRemoveChild.call(this, node.__head.nextSibling);

      _innerRemoveChild.call(this, node.__head);
      _innerRemoveChild.call(this, node.__tail);
      let prev = node.__head.previousSibling,
        next = node.__tail.nextSibling;
      if (prev) prev.mark("nextSibling", next);
      if (next) next.mark("previousSibling", prev);
      node.unmark('parentNode')
      return node;
    } else {
      let prev = node.previousSibling,
        next = node.nextSibling;
      let ret = _innerRemoveChild.call(this, node);
      if (prev) prev.mark('nextSibling',next);
      if (next) next.mark("previousSibling", prev);
      return ret;
    }
  };

  const _innerInsertBefore = window.Node.prototype.insertBefore;
  window.Node.prototype.insertBefore = function (
    node,
    ref,
    inFragment = false
  ) {
    let realRef =
      !!ref && !!ref.__isFragment && !!ref.__isMounted ? ref.__head : ref;
    if (this.__isFragment) {
      let notFrChild = !node.hasOwnProperty("__isFragmentChild__"),
        freezeParent = !inFragment || notFrChild;

      notFrChild && node.mark("__isFragmentChild__", true);
      let ret = this.parentNode
        ? this.parentNode.insertBefore(node, ref)
        : _innerInsertBefore.call(this, node, realRef);
      freezeParent && node.mark( "parentNode", this);
      return ret;
    } else if (node.__isFragment && node.__isMounted) {
      if (node === ref) return
      node.mark("parentNode", this)
      if (node.previousSibling) node.previousSibling.mark("nextSibling", node.nextSibling)

      if (node.nextSibling) node.nextSibling.mark("previousSibling", node.previousSibling)
      node.mark("nextSibling", ref,"previousSibling", ref.previousSibling)
      if (ref.previousSibling) freeze(ref.previousSibling, "nextSibling", node)
      ref.mark("previousSibling", node)

      let tpl = document.createDocumentFragment(),
        ele = node.__head;
      while (ele !== node.__tail) {
        tpl.appendChild(ele);
        ele = ele.nextSibling;
      }
      tpl.appendChild(node.__tail);
      _innerInsertBefore.call(this, tpl, realRef);
      return node;
    } else {
      return _innerInsertBefore.call(this, node, realRef);
    }
  };
  const _innerAppendChild = window.Node.prototype.appendChild;
  window.Node.prototype.appendChild = function (node, inFragment = false) {
    if (this.__isFragment) {
      if (this.parentNode) {
        let notFrChild = !node.hasOwnProperty("__isFragmentChild__"),
          freezeParent = !inFragment || notFrChild;
        if(notFrChild) node.mark("__isFragmentChild__", true);
        let ret = this.parentNode.insertBefore(node, this.__tail, inFragment);
        if(freezeParent) node.mark("parentNode", this) ;
        return ret;
      }
    } else {
      return _innerAppendChild.call(this, node);
    }
  };
};
