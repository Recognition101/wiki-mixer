goog.provide("mix.objlib");

/**
 * Trims the spaces from the start and end of a string.
 * @param {string} str the string to trim
 * @return {string} the trimmed string
 */
mix.objlib.trim = function(str) {
    if (!str) {return str;}
    var re = /(^[\s\n\t]*)|([\s\n\t]*$)/g;
    return str.replace(re, "");
};

/**
 * Given an object and an array, this function looks depth first
 * into the object for the keypath represented by the array.
 * @param {Object} obj the object to search within
 * @param {Array.<string>} keys the list of keys to traverse into
 * @return {?Object|undefined} undefined if the keypath does not exist in the object,
 *      otherwise returns the object or value that was found at that keypath.
 */
mix.objlib.lookup = function(obj, keys) {
    for(var i=0; i < keys.length; i += 1) {
        if (typeof obj === "object" && keys[i] in obj) {
            obj = obj[keys[i]];
        } else {
            return undefined;
        }
    }
    return obj;
};
