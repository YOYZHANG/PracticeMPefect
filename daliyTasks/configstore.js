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
            
        }
    }

    get all() {}
    set all(value) {}
    get size() {}
    get(key) {}
    set(key, value) {}
    has(key) {}
    delete(key) {}
    clear() {}
    get path() {

    }
}