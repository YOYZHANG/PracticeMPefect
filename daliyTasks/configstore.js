const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Create a Configstore instance.
const config = new Configstore(packageJson.name, {foo: 'bar'});

console.log(config.get('foo'));
//=> 'bar'

config.set('awesome', true);
console.log(config.get('awesome'));
//=> true

// Use dot-notation to access nested properties.
config.set('bar.baz', true);
console.log(config.get('bar'));
//=> {baz: true}

config.delete('awesome');
console.log(config.get('awesome'));
//=> undefined

class Configstore {
    constructor(id, defaults, options = {}) {
        if (defaults) {
            this.all = {
                ...defaults,
                ...this.all
            };
        }
    }

    get all() {
        try {
            return JSON.parse(fs.readFileSync(this._path, 'utf-8'));
        } catch (error) {
            if (error.code === 'ENOENT') {}

            if (error.code === 'EACCES') {

            }

            if (error.name === 'SyntaxError') {

            }

            throw error;
        }
    }
    set all(value) {
        try {
            fs.mkdirSync(path.dirname(this._path), mkdirOptions);
            writeFileAtomic.sync(this._path, JSON.stringify(value, undefined, '\t'))
        } catch (error) {

        }
    }
    get size() {
        return Object.keys(this.all || {}).length;
    }
    get(key) {

    }
    set(key, value) {

    }
    has(key) {

    }
    delete(key) {

    }
    clear() {
        this.all = {};
    }
    get path() {
        return this._path;
    }
}

// 可以关注的库：
// dot-prop