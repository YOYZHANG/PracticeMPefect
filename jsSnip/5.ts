// LRU算法

// key - value      
class Entry {
    constructor(val) {
        this.value = val;
        this.key;
        this.next;
        this.prev;
    }
}
// O(1)复杂度
// 双链表
class LinkedList {
    head: Entry<T>
    tail: Entry<T>

    private len = 0;

    insert(val) {
        let entry = new Entry(val);
        this.insertEntry(entry);
        return entry;
    }

    insertEntry(entry) {
        if (!this.head) {
            this.head = this.tail = entry;
        }
        else {
            // 1->2->3
            this.tail.next = entry;
            entry.prev = this.tail;
            entry.next = null;
            this.tail = entry;
        }

        this.len++;
    }

    remove(entry) {
        let prev = entry.prev;
        let next = entry.next;
        if (prev) {
            prev.next = next;
        }
        else {
            this.head = next;
        }

        if (next) {
            next.prev = prev;
        }
        else {
            this.tail = prev;
        }

        entry.prev = entry.next = null;
        this.len--;
    }

    len() {
        return this.len;
    }

    clear() {
        this.head = this.tail = null;
        this.len = 0;
    }
}

// let linklist = new LinkedList();
// linklist.insert(1);
// linklist.insertEntry()

class LRU {
    constructor() {
        this.list = [];
        this.map = {};
        this.maxSize = 3;
    }

    put(key, value) {
        if (this.list.includes(key)) {
            this.list.push(this.list.splice(this.list.indexOf(key), 1)[0]);
        }
        else {
            this.list.push(value);
        }
        
        this.map[key] = value;

        if (this.list.length > this.maxSize) {
            let disposeKey = this.list.shift();
            delete this.map[disposeKey];
        }
    }

    get(key) {
        return this.map[key];
    }

    clear() {
        this.list = [];
        this.map = {};
    }

    len() {
        return this.list.length;
    }
}

let lru = new LRU(); 

lru.put('key1', 1);
lru.put('key2', 2);
lru.get('key1'); //2;
