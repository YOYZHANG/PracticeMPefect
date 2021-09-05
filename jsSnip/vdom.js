function h(tag, attr, children) {
    return {
        tag,
        attr,
        children
    }
}

function mount(vnode, container) {
    const {tag, attr, children} = vnode;
    let el = document.createElement(tag);
    vnode.el = el;
    if (attr) {
      for (const key in attr) {
          let value = attr[key];
        el.setAttribute(key, value);
      }
    }

    if (typeof children === 'string') {
        el.textContent = children;
    }
    else if (Array.isArray(children)){
        children.forEach(child => {
            mount(child, el);
        })
    }
    
    console.log(el.tagName);
    container.appendChild(el);
}

function patch(oldDom, newDom) {
    if (oldDom.tag === newDom.tag) {
        const el = oldDom.el = newDom.el;
        // attr
        const oldProp = oldDom.attr || {};
        const newProp = newDom.attr || {};
        for (const key in newProp) {
            newVal = newDom[key];
            oldVal = oldDom[key];
            if (newVal !== oldVal) {
                el.setAttribute(key, newVal);
            }
        }

        for (const key in oldProp) {
            if (!(key in newProp)) {
                el.removeAttribute(key);
            }
        }

        const oldChildren = oldDom.children;
        const newChildren = newDom.children;

        if (typeof newChildren === 'string') {
            if (typeof oldChildren === 'string') {
                if (newChildren !== oldChildren) {
                    el.textContent = newChildren;
                }
            }
            else {
                el.textContent = newChildren;
            }
        }
        else {
           if (typeof oldChildren === 'string') {
               el.innerHTML = '';
               newChildren.forEach(item => {
                   mount(item, el);
               })
           }
           else {
               const commonLength = Math.min(oldChildren.length,newChildre.length);
               for (let i = 0; i < commonLength; i++) {
                   patch(oldChildren[i], newChildren[i])
               }

               if (newChildren.length > oldChildren.length) {
                   newChildren.slice(oldChildren.length).forEach(child => {
                        mount(child, el)
                   });
               }
               else if (newChildren.length < oldChildren.length) {
                   oldChildren.slice(newChildren.length).forEach(child => {
                       el.remove(child.el);
                   })
               }
           }
        }
    }

}

const vdom = h('div', {class: 'red'}, [
  h('span', null, 'hello')
]);

const newDom = h('div', {class: 'green'}, [
    h('span', null, 'hello')
]);

console.log(vdom, 'vdom')

mount(vdom, document.getElementById('app'));

patch(vdom, newDom);
