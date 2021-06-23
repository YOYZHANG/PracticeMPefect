/***
 * About New
 */

let army = [];
function createSolider(id) {
    let newSoilder = {};
    newSoilder = {
        id = id,
        base = 40
    }

    newSoilder.prototype.climb = function() {console.log('climb')}
    newSoilder.prototype.jump = function() {console.log('jump')}

    return newSoilder;
}

army.push(createSolider(1));


// using new

function createSolider(id) {
    this.id = id;
    this.base = 4;
}

createSolider.prototype = {
    climb: function() {},
    jump: function() {}
}

// 临时对象由哪个函数创建
createSolider.prototype.constrctor = createSolider;

new createSolider(1)
// 我不用创建对象了
// 不用手动挂原型了
// 不用return对象了




// 判断类型
// 附注： typeof无法区分数组和对象，因为都是{}
// 但是instance可以区分数组和对象

[] instanceof Array // true
// object
typeof {} === 'object'  // true


