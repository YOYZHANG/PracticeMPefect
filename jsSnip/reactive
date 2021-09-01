// vue-reactive
let targetMap = new WeakMap();
function track(target, value) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, depsMap = new Map());
  }
  
  let deps = depsMap.get(value);
  if (!deps) {
    depsMap.set(value, (deps = new Set()));
  }
  
  deps.add(effect);
}

function trigger(target, value) {
  let depsMap = targetMap.get(target);
  if (!depsMap){
    return;
  }
  
  let dep = depsMap.get(value);
  if (dep) {
       dep.forEach(effect => {
         effect();
       })
  }
}


let product = {price: 1, quantity: 3};
let total = 0;

let effect = () => {
  total = product.price * product.quantity;
}

track(product, 'quantity');

effect();

console.log(total);

product.quantity = 5;

trigger(product, 'quantity');

console.log(total);
