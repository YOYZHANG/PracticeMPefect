class EventBus {
    constructor() {
        this.listeners = {};
        this.config = {};
    }

    emit(name, args) {
       let cbs = this.listeners[name];
       for (let cb of cbs) {
           cb.call(cb, args);
       }
    }

    on(name, callback) {
        if (!this.listeners[name]) {
            this.listeners[name] = [];
        }

        this.listeners[name].push(callback);
    }

    off(name) {
        delete this.listeners[name];
    }

}

var eventBus = new EventBus();
// example
eventBus.on('win', function(event) {
    console.log(`price given to${event.name}`);
});

eventBus.emit('win', {
    name: 'ahaha'
});

eventBus.off('win');



class Emitter{
    constructor() {
        this.listeners = [];
        this.config = {};
    }

    emit(event) {
        for (let index, listener of this.listeners) {
            listener[listener](event);

            if (listener.once) {
                this.listeners.splice(i, index);
                index--;
            }
        }

    }

    on(listener, options) {
        this.listeners.push({
            listener,
            at: options.at,
            once: options.once
        });
    } 
}

var emitter = new Emitter({
    ticky: true
});

emitter.on(() => {
    console.log('do something');
}, {
    at: function(a) {return a === 1},
    once: true
});

emitter.emit();

// sticky?
