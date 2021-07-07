// const myPromise =
//   (new Promise(myExecutorFunc))
//   .then(handleFulfilledA)
//   .then(handleFulfilledB)
//   .then(handleFulfilledC)
//   .catch(handleRejectedAny);

// handleFulfilledX的状态决定着链式调用下一个promise的状态
// handleFulfilled(value) {return nextValue;}

// 当.then中缺少能够返回promise对象的函数时，链式调用就直接进行下一环操作。
// 因此，一个已经处于已敲定状态的promise操作只有链式调用的栈被清空了，和一个
// 时间循环过去了才会被执行。

// 关注点
// 状态什么时候变的
// 事件队列咋管理的

// Promise.resolve(value)
// 返回的promise对象的最终状态由then方法执行决定。


class PoliPromise {
    constructor(executor) {
      this.status = 'PENDING';
      this.observerArr = [];
      executor(value => {
        setTimeout(() => {
          this.resolve();
        },0);
      }, error => {
        setTimeout(() => {
          this.status = 'REJECT'
          this.error = error;
          this.reject();
        });
      })
    }
  
    static resolve() {}
    static reject() {}
    resolve() {
      if (this.status === 'PENDING') {
        this.status = 'FULLFILL';
      }
      this.value = value;
      this.observerArr.forEach(fn => {
        fn.fullfill.call(this, this.value);
      });
    }
    reject(reason) {
      if (this.status === 'PENDING') {
        this.status = 'REJECT';
      }
      this.reason = reason;
      this.observerArr.forEach(fn => {
        fn.fullreject.call(this, this.value);
      });
    }
    then(full, fill) {
      return new PoliPromise((resolve, reject) => {
        const fullHandler = () => {
          try {
            resolve(typeof full === 'function' ? full(this.value) : this.value);
          }
          catch (e) {
            reject(e);
          }
        }
  
        const rejectHandler = () => {
          if (typeof fill !== 'function') {
            return reject(this.reason);
          }
          
          try {
            resolve(onrejected(this.reason));
          }
          catch(e) {
            reject(e);
          }
        }
  
        if (this.status === 'PENDING') {
          this.observerArr.push({
            fullfill: fullHandler,
            fullreject: rejectHandler
          });
        }
        else if (this.status === 'FULLFILL'){
          fullHander();
        }
        else if (this.status ==='REJECT') {
          rejectHandler();
        }
  
      });
    }
    catch(onreject) {
      return this.then(null, onreject)
    }
  
    static all(promises){
      return new Promise(resolve => {
        let length = promises.length;
        let count = 0;
        let result = [];
        if (length === 0) {
          resolve(result);
        }
  
        promises.forEach(item => {
          PoliPromise.resolve( item.then(value => {
            result.push(value);
            count++;
            if (count === length) {
              resolve(result);
            }
          }), reject);
        });
      });
    }
  }
  
  // example
  new PoliPromise((resolve, reject) => {
    setTimeout(() => {
      console.log('in');
      resolve(20);
    });
  })
  .then((value) => {
    console.log(value);
  })
  .then(value => {
    console.log(value)
  })
  