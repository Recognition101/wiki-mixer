goog.provide("mix.lib.OrderedArray");

/**
 * An array that supports adding, removing, and fetching elements
 * from an array, while maintaining an order.
 * Most operations use binary search for O(log(n)) efficiency.
 * @class
 * @constructor
 * @param {function(Object, Object): number=} comparator the function that
 *      returns -1 if the first object should come first, 0 if they are
 *      equivalently ordered, or 1 if the second object should come first.
 *
 *      Optional parameter, defaults to the < being -1, > being 1, and = being 0.
 *
 */
mix.lib.OrderedArray = function(comparator) {
    this.data = [];
    if (comparator) {this.comparator = comparator;}
};

/**
 * The default comparator on the prototype. Works well on numbers and strings.
 * @param {Object} e1 the first object to compare
 * @param {Object} e2 the second object to compare
 * @return {number} -1 if e1 comes first, 1 if e2 comes first, or 0 if it doesn't matter
 * @private
 */
mix.lib.OrderedArray.prototype.comparator = function(e1, e2) {
    return e1 < e2 ? -1 : e1 > e2 ? 1 : 0;
};

/**
 * Gets the index where the element either is or should
 * be if it were to be inserted. Takes O(log(n)) time.
 * @param {Object} e1 the object whose place we should find
 * @this {mix.lib.OrderedArray}
 * @return {number} the index where the object should go or already is
 */
mix.lib.OrderedArray.prototype.find = function(e1) {
    var low = 0;
    var high= this.data.length-1;
    var pivot = 0, compare = 0;
    while(high-low > 1) {
        pivot = Math.floor((high+low)/2);
        compare = this.comparator(e1, this.data[pivot]);
        if (compare < 0) {
            high = pivot;
        } else if (compare > 0) {
            low = pivot;
        } else {
            return pivot;
        }
    }
    compare = this.comparator(e1, this.data[low]);
    if (compare <= 0) {
        return low;
    }
    compare = this.comparator(e1, this.data[high]);
    if (compare <= 0) {
        return high;
    }
    return high+1;
};

/**
 * Adds an element to this array (maintaining order).
 * Takes O(log(n)) time.
 * @param {Object} el the element to add to the array
 * @this {mix.lib.OrderedArray}
 * @return {number} the position this element was added at
 */
mix.lib.OrderedArray.prototype.insert = function(el) {
    var insertAt = this.find(el);
    this.data.splice(insertAt, 0, el);
    return insertAt;
};

/**
 * Removes an element from this array (maintaining order).
 * Takes O(log(n)) time.
 * @param {Object} el the object to remove
 * @this {mix.lib.OrderedArray}
 * @return {boolean} true if we removed an element, false if the
 *      element wasn't in the array, so it wasn't removed.
 */
mix.lib.OrderedArray.prototype.remove = function(el) {
    var remFrom = this.find(el);
    if (remFrom < this.data.length &&
            this.comparator(el, this.data[remFrom]) === 0) {
        this.data.splice(remFrom, 1);
        return true;
    }
    return false;
};


