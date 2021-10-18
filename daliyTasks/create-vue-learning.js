/** 
 * create-vue 库中的工具函数实现
*/

const isObject = (val) => val && typeof val === 'object';
const mergeArrayWithDedupe = (a, b) => Array.from(new Set([...a, ...b]));
/**
 * Recursively merge the content of the new object to the existing one
 * @param {Object} target the existing object
 * @param {Object} obj the new object
 */
function deepMerge(target, obj) {
    // 递归到原始类型即开始赋值
    // 数组的话直接解构赋值浅拷贝
    for (const key of Object.keys(obj)) {
        const oldVal = target[key];
        const newVal = obj[key];

        if (Array.isArray(oldVal) && Array.isArray(newVal)) {
            target[key] = mergeArrayWithDedupe(oldVal, newVal);
        }
        else if (isObject(oldVal) && isObject(newVal)) {
            target[key] = deepMerge(oldVal, newVal);
        }
        else {
            target[key] = newVal;
        }
    }

    return target;

}

/**
 * 不依赖三方包清除旧项目 fs.rmdirSync
 */

function postOrderDirectoryTraverse(dir, dirCallback, fileCallback) {
    // 用的是多叉树深搜中的后序遍历，因为需要先删除子文件和子文件夹，才能保证当前文件夹为空。
    for (const fileName of fs.readdirSync(dir)) {
        const fullPath = path.resolve(dir, fileName);
        if (fs.lstatSync(fullPath).isDirectory()) {
            postOrderDirectoryTraverse(fullPath, dirCallback, fileCallback);

            dirCallback(fullPath);
            continue;
        }

        // 如果是文件，直接用 fileCallback 处理
        fileCallback(fullpath)
    }
}

function emptyDir(dir) {
    postOrderDirectoryTraverse(
        dir,
        (dir) => fs.rmdirSync(),
        (dir) => fs.unlinkSync()
    )
}

// 生成各种 featureFlag 的排列组合
const featureFlags = ['typescript', 'jsx', 'router', 'vuex', 'with-tests'];

function fullCombination(arr) {
    const combinations = [];
    for (let i = 1; i < i << arr.length; i++) {
        const combination = [];
        for (let j = 0; j < arr.length; j++) {
            if (i & 1 << j) {
                combination.push(i);
            }
        }

        combinations.push(combination);
    }

    return combinations;
}

/**
 * renderTemplate
 */
function renderTemplate(templateDir, root) {
    // templateDir: 待 copy 的 file
    // root: 最终 copy 到的文件夹
    // 1. 判断是否是文件夹
    // 2. 遍历文件
    // 3. merge package.json 文件
    // 4. copy
    const stats = fs.lstatSync(templateDir);
    if (stats.isDirectory()) {
        fs.mkdirSync(dest, {recrusive: true});
        for (const file of fs.readdirSync(src)) {
            renderTemplate(path.resolve(templateDir, file), path.resolve(root, file));
        }

        const fileName = path.base(templateDir);
        if (fileName === 'package.json' && fs.existSync(root)) {
            const existing = JSON.parse(fs.readFileSync(templateDir));
            const newPackage = JSON.parse(fs.readFileSync(root));
            const pkg = deepMerge(existing, newPackage);
            fs.writeFileSync(root, JSON.stringify(pkg, null, 2) + '\n');
        }

        if (fileName.startsWith('_')) {
            root = path.resolve(path.dirname(dest), filename.replace(/^_/, '.'))
        }

        fs.copyFileSync(src, root);
    }
}

function sortedDependencies(packageJson) {
    const sorted = {}

    const depTypes = ['dependencies', 'devDependencies', 'peerDependecies', 'optionalDependencies']

    for (const key of depTypes) {
        if (packageJson[key]) {
            sorted[key] = {};
            Object.keys(packageJson[key])
            .sort()
            .forEach(name => {
                sorted[key][name] = packageJson[key][name];
            })
        }
    }

    return {
        ...packageJson,
        ...sorted
    }
}
