class LRU {
    constructor(capacity) {
        this.cache = new Map();
        this.cap = capacity;

        /**
         * @param {number} key
         * @return {number}
         */
        this.get = function (key) {
            if (this.cache.has(key)) {
                const value = this.cache.get(key);
                this.cache.delete(key);
                this.cache.set(key, value);
                return value;
            } else {
                return -1;
            }
        };

        /**
         * @param {number} key
         * @param {number} value
         * @return {void}
         */
        this.put = function (key, value) {
            if (this.cache.has(key)) {
                this.cache.delete(key);
                this.cache.set(key, value);
            } else {
                if (this.cache.size === this.cap) {
                    this.cache.delete(this.cache.keys().next().value);
                    this.cache.set(key, value);
                } else {
                    this.cache.set(key, value);
                }
            }
        };
    }
}

export default LRU;
