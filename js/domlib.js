goog.provide("mix.domlib");
/**
 * Given a dom node, remove it from its parent if it has one.
 * @param {Node} dom the dom node to remove
 */
mix.domlib.remove = function(dom) {
    if (dom.parentNode) {
        dom.parentNode.removeChild(dom);
    }
};

/**
 * Searches up the dom tree until a given function
 * returns true, and then returns that function.
 * @param {Node} dom the dom node to start at
 * @param {function(Node):boolean} test the test that each parent
 *      will be run on.
 * @param {number=} max the maximum number of nodes to run through.
 *      If 0 or a negative number is given, it traverses all nodes.
 *      By default it is -1.
 * @return {?Node} the node that test returned true for, or null if
 *      no node did
 */
mix.domlib.scanUp = function(dom, test, max) {
    if (max === undefined || max === null) {max = -1;}
    while(dom && max !== 0) {
        if (test(dom)) {
            return dom;
        }
        dom = dom.parentNode;
        max -= 1;
    }
    return null;
};

/**
 * When run, this returns an object describing what features this
 * browser can currently support. The object is cached, so only the
 * first call to this function will execute feature detection,
 * subsequent calls just return the cached value.
 * @return {{touch: boolean, ipad: boolean, pixelDensity: number}}
 *      a list of features, as follows:<br/><ul>
 *          <li>ios: true if this is an ios device</li>
 *          <li>ipad: true if this is an ipad</li>
 *          <li>pixelDensity: the screen's pixel density</li>
 *      </ul>
 */
mix.domlib.featureDetection = (function() {
    var cache = null;
    return function() {
        if (cache === null) {
            var ua = navigator.userAgent.toLowerCase();
            var pd = window.devicePixelRatio;

            cache = {
                touch: ua.indexOf("android") > -1 ||
                     ua.indexOf("ipad") > -1 ||
                     ua.indexOf("iphone") > -1,
                ipad: ua.indexOf("ipad") > -1,
                pixelDensity: pd ? pd : 1
            };
            cache.clickEvent = cache.touch ? "touchend" : "click";
        }

        return cache;
    };
}());
