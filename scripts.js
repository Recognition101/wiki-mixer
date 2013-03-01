var mix = {data: {}, ui: {}, lib: {}};

/**
 * Trims the spaces from the start and end of a string.
 * @param {string} str the string to trim
 * @return {string} the trimmed string
 */
mix.lib.trim = function(str) {
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
mix.lib.safeRetrieve = function(obj, keys) {
    for(var i=0; i < keys.length; i += 1) {
        if (typeof obj === "object" && keys[i] in obj) {
            obj = obj[keys[i]];
        } else {
            return undefined;
        }
    }
    return obj;
};

/**
 * Searches up the dom tree until a given function
 * returns true, and then returns that function.
 * @param {Node} dom the dom node to start at
 * @param {function(Node):boolean} test the test that each parent
 *      will be run on.
 * @param {number=-1} max the maximum number of nodes to run through.
 *      If 0 or a negative number is given, it traverses all nodes.
 *      By default it is -1.
 * @return {?Node} the node that test returned true for, or null if
 *      no node did
 */
mix.lib.domScanUp = function(dom, test, max) {
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
 * @return {{ios: boolean, ipad: boolean, pixelDensity: number}}
 *      a list of features, as follows:<br/><ul>
 *          <li>ios: true if this is an ios device</li>
 *          <li>ipad: true if this is an ipad</li>
 *          <li>pixelDensity: the screen's pixel density</li>
 *      </ul>
 */
mix.lib.featureDetection = (function() {
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

/**
 * Given a dom node, remove it from its parent if it has one.
 * @param {Node} dom the dom node to remove
 */
mix.lib.domRemove = function(dom) {
    if (dom.parentNode) {
        dom.parentNode.removeChild(dom);
    }
};

/**
 * Given a DOM node, this function sets that node up to be a
 * DOM slider that can be dragged on or off. Note that this only works
 * on DOM nodes that are template-bound.
 * @param {Node} dom the root DOM node that we will be listening to. it may
 *          contain one or more elements that will be slide-able
 * @param {function(boolean, Object)} switchedCallback this function will be
 *          called with either true if switch is moved right, false if moved
 *          left. The second parameter is the data that is associated with
 *          the template that was just switched.
 * @param {function(boolean, Object)=} endedCallback this function will be
 *          called with two arguments: 1) A boolean indicating whether the
 *          user changed the state of the slider (true) or if they did not
 *          fully slide a specific slider (false), and 2) the template data
 *          associated with whatever slider was being manipulated. It is
 *          called at the end of user-interaction (mouse/touch up), whether
 *          or not the user made a change. If not given, nothing will be
 *          called.
 * @param {Number=10} xLim the limit you have to pull before activating
 * @param {Number=10} yLim the limit you you can move in the y-directon
 *          before cancelling the switch
 */
mix.lib.domSlider = function(dom, switchedCallback, endedCallback, xLim, yLim) {
    if (xLim === null || xLim === undefined) {
        xLim = 10;
    }
    if (yLim === null || yLim === undefined) {
        yLim = 10;
    }
    var isDragDone = function(data, x, y) {
        if (Math.abs(data.drag.y - y) > yLim) {
            return true;
        }
        var deltaX = x - data.drag.x;
        if (deltaX > xLim) {
            switchedCallback(true, data);
            return true;
        } else if (deltaX < -xLim) {
            switchedCallback(false, data);
            return true;
        }

        return false;
    };

    var dragStarted = function(data, x, y) {
        data.drag = {x: x, y: y};
    };

    var dragEnded = function(data, x, y) {
        if (!data.drag) {return;}

        var didChange = isDragDone(data, x, y);
        data.drag = null;
        if (endedCallback) {endedCallback(didChange, data);}
    };

    var dragMoved = function(data, x, y) {
        if (!data.drag) {return;}

        var done = isDragDone(data, x, y);
        if (done) {
            data.drag = null;
        }
    };

    var makeListener = function(eventName, callback, isTouch) {
        dom.addEventListener(eventName, function(e) {
            var dom = mix.lib.domScanUp(
                e.target, mix.lib.TemplateManager.isTemplate, 10);
                var data = mix.lib.TemplateManager.getData(dom);

                var x = e.clientX;
                var y = e.clientY;
                if (isTouch && event.targetTouches[0]) {
                    x = event.targetTouches[0].pageX;
                    y = event.targetTouches[0].pageY;
                } else if (isTouch && data.drag) {
                    x = data.drag.x;
                    y = data.drag.y;
                }
                if (data) {callback(data, x, y);}
        });
    };

    var fd = mix.lib.featureDetection();
    if (!fd.touch) {
        makeListener("mousedown", dragStarted, false);
        makeListener("mousemove", dragMoved, false);
        makeListener("mouseup", dragEnded, false);
    } else {
        makeListener("touchstart", dragStarted, true);
        makeListener("touchmove", dragMoved, true);
        makeListener("touchend", dragEnded, true);
        makeListener("touchcancel", dragEnded, true);
    }
};

/**
 * This object is a notification of a value change in a
 * class observation pattern.
 * @class
 * @constructor
 */
mix.lib.ChangeNotification = function(oldVal, newVal) {
    this.oldValue = oldVal;
    this.newValue = newVal;
};

/**
 * This class is a very simple KVO implementation.
 * TODO: deprecate this
 * @class
 * @constructor
 */
mix.lib.EventHandler = function() {
    this.evCallbacks = {};
    this.evValues = {};
};

/**
 * Gets a value from this KVO, potentially notifying observers.
 * @param {string} eventName the key to read
 * @this {mix.lib.EventHandler}
 * @return {Object} the value stored in that key
 */
mix.lib.EventHandler.prototype.getValue = function getValue(eventName) {
    return this.evValues[eventName];
};

/**
 * Sets a value from this KVO, potentially notifying observers.
 * @param {string} eventName the key to set
 * @param {Object} value the value to set
 * @this {mix.lib.EventHandler}
 */
mix.lib.EventHandler.prototype.setValue = function setValue(eventName, value) {
    if (eventName in this.evCallbacks) {
        var old = this.evValues[eventName];
        var change = new mix.lib.ChangeNotification(old, value);
        for(var i=0; i < this.evCallbacks[eventName].length; i+=1) {
            this.evCallbacks[eventName][i](change);
        }
    }
    this.evValues[eventName] = value;
};

/**
 * Adds an event listener to a given value in this KVO map.
 * @param {string} eventName the key to observe
 * @param {function(mix.lib.ChangeNotification)} callback the function 
 *      to call when the key is set, with a change notification describing
 *      the new and old values of the key passed in as the argument
 * @this {mix.lib.EventHandler}
 */
mix.lib.EventHandler.prototype.addEventListener = function addEventListener(eventName, callback) {
    if (!(eventName in this.evCallbacks)) {
        this.evCallbacks[eventName] = [];
    }

    this.evCallbacks[eventName].push(callback);
};

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

/**
 * This object supports extremely basic DOM templates.
 * It can pull DOM nodes out and collect them in a map,
 * and dynamically update their content to match an object.
 * @constructor
 * @class
 */
mix.lib.TemplateManager = function() {
    this.templates = {};
};

/**
 * Pulls a node out of the dom and uses it as a template with
 * a given ID. That ID can then be used in generateDom.
 * @param {string} id a Template ID to use for future referencing this template
 * @param {Node} dom the dom node to remove from the DOM and make into a template
 */
mix.lib.TemplateManager.prototype.addTemplate = function(id, dom) {
    var fragmentMap = {};
    var frags = dom.querySelectorAll("*[data-frag]");
    var fragNm = "";
    for(var i=0; i < frags.length; i+=1) {
        fragNm = frags[i].getAttribute("data-frag");
        if (fragNm !== "") {
            fragmentMap[fragNm] = frags[i];
            mix.lib.domRemove(frags[i]);
        }
    }

    var loops = dom.querySelectorAll("*[data-loop]");
    for(i=0; i < loops.length; i+=1) {
        loops[i].innerHTML = "";
    }

    dom.removeAttribute("id");
    this.templates[id] = {
        dom: dom,
        frags: fragmentMap
    };

    mix.lib.domRemove(dom);
    dom.tmp__isTemplate = true;
    dom.tmp__data = {};
};

/**
 * Creates a new DOM Nodes based on a template and some data.
 * @param {string} id a Template ID to create a new DOM node from
 * @param {Object} data the data to fill the template with
 * @return {Node} the generated DOM node
 */
mix.lib.TemplateManager.prototype.generateDom = function(id, data) {
    if (!(id in this.templates)) {
        return null;
    }

    var domRet = this.templates[id].dom.cloneNode(true);
    this.populateTemplate(id, domRet, data);
    return domRet;
};

/**
 * Given a DOM Node with template data attributes, this function updates
 * the DOM node with a new data object. Note that undefined data keys
 * will retain their old value.
 * @param {string} id the Template ID
 * @param {Node} dom the DOM Node to fill with data
 * @param {Object} data the data to fill the DOM with
 */
mix.lib.TemplateManager.prototype.populateTemplate = function(id, dom, data, contextLevel) {
    this.populateTemplateRec(id, dom, data, false, 0);
};

/**
 * Given a DOM Node, this function lets you know if that node is a
 * template or template fragment (and thus has associated data).
 * @param {Node} dom the dom node to test
 * @return {boolean} true if this node is a template or fragment
 */
mix.lib.TemplateManager.isTemplate = function(dom) {
    return dom && dom.tmp__isTemplate;
};

/**
 * Gets the data associated with this template or template fragment.
 * Returns null if this dom node is not a template or template fragment.
 * @param {Node} dom the dom node to fetch data for
 * @return {?Object} the data associated, or null if no data is associated
 */
mix.lib.TemplateManager.getData = function(dom) {
    if (dom && dom.tmp__isTemplate) {
        return dom.tmp__data;
    }
    return null;
};

/**
 * The actual implementation of the above method.
 * @private
 * @param {string} id the Template ID
 * @param {Node} dom the DOM Node to fill with data
 * @param {Object} data the data to fill the DOM with
 * @param {boolean} initialFrag true if this is the initial population of a data fragment (not a template)
 * @param {number} contextLevel maintains how far into recursion we are
 */
mix.lib.TemplateManager.prototype.populateTemplateRec = function(id, dom, data, initialFrag, contextLevel) {
    var query = initialFrag ? "*[data-html]" :
                contextLevel === 0 ? "*[data-html]:not([data-ctx])" :
                "*[data-html][data-ctx=\""+contextLevel+"\"]";
    var fill = dom.querySelectorAll(query);
    var keys = null, attrs = null, prevElems=null, context = null;
    var newHtml = "", i=0, j=0;
    dom.tmp__data = data;
    dom.tmp__isTemplate = true;

    for(i=0; i < fill.length; i+=1) {
        keys = fill[i].getAttribute("data-html");
        newHtml = undefined;
        if (keys === ".") {
            newHtml = data;
        } else {
            keys = keys ? keys.split(".") : [];
            newHtml = mix.lib.safeRetrieve(data, keys);
        }
        if (newHtml !== undefined && (""+newHtml) !== fill[i].innerHTML) {
            fill[i].innerHTML = newHtml;
            if (contextLevel > 0 && initialFrag) {
                fill[i].setAttribute("data-ctx", contextLevel);
            }
        }
    }

    var replaceAttrs = function(domAttrs) {
        attrs = domAttrs.getAttribute("data-attr");
        attrs = attrs.split(";");

        for(j=0; j < attrs.length; j+=1) {
            keys = attrs[j].split(":");
            if (keys[0] && keys[1]) {
                keys[0] = mix.lib.trim(keys[0]);
                keys[1] = mix.lib.trim(keys[1]);
                var dat = "";
                if (keys[1] === ".") {
                    dat = data;
                } else {
                    keys[1] = keys[1] ? keys[1].split(".") : [];
                    dat = mix.lib.safeRetrieve(data, keys[1]);
                }
                if (dat !== undefined && domAttrs.getAttribute(keys[0]) !== (""+dat)) {
                    domAttrs.setAttribute(keys[0], dat);
                }
            }
        }

        if (contextLevel > 0 && initialFrag) {
            domAttrs.setAttribute("data-ctx", contextLevel);
        }
    };

    query = initialFrag ? "*[data-attr]" :
            contextLevel === 0 ? "*[data-attr]:not([data-ctx])" :
            "*[data-attr][data-ctx=\""+contextLevel+"\"]";
    fill = dom.querySelectorAll("*[data-attr]");
    if (dom.getAttribute("data-attr")) {
        replaceAttrs(dom);
    }
    for(i=0; i < fill.length; i+=1) {
        replaceAttrs(fill[i]);
    }

    var newDom = null;
    fill = dom.querySelectorAll("*[data-loop]");
    for(i=0; i < fill.length; i+=1) {
        attrs = fill[i].getAttribute("data-loop").split(" in ");
        if (attrs[0] && attrs[1]) {
            attrs[0] = mix.lib.trim(attrs[0]);
            attrs[1] = mix.lib.trim(attrs[1]);
            context = mix.lib.safeRetrieve(data, attrs[0].split("."));
            if (context && context.length) {
                prevElems = fill[i].querySelectorAll("*[data-frag="+attrs[1]+"]");
                for(j=0; j < context.length; j+=1) {
                    if (j < prevElems.length) {
                        this.populateTemplateRec(id, prevElems[j], context[j], false, contextLevel + 1);
                    } else {
                        newDom = this.templates[id].frags[attrs[1]].cloneNode(true);
                        fill[i].appendChild(newDom);
                        this.populateTemplateRec(id, newDom, context[j], true, contextLevel + 1);
                    }
                }
                for(j=context.length; j < prevElems.length; j+=1) {
                    mix.lib.domRemove(prevElems[j]);
                }
            }
        }
    }
};

/**
 * The Ingredient list UI, handles getting the state of
 * the ingredients that are selected.
 * @param {Element} domContainer the dom element containing this widget
 * @param {mix.lib.TemplateManager} templates the template manager to pull from
 * @param {string} templateName the name of the template describing the sidebar
 * @param {Object.<string, mix.ui.IngStatus>|null=} extData an extra set of
 *      data consisting of initial name to status overrides to apply while
 *      setting the UI up for the first time.
 * @class
 * @constructor
 */
mix.ui.Ingredients = function Ingredients(domContainer, templates, templateName, extData) {
    var self = this;
    this.domMain = domContainer;
    this.tmp = templates;
    this.tmpNm = templateName;

    this.ingChangeFns = [];
    this.clearFns = [];
    var fireChangeFns = function(data) {
        var name = data["name"];
        var change = data["required"] ? mix.ui.IngStatus.NEED :
                     data["have"] ? mix.ui.IngStatus.HAVE :
                     mix.ui.IngStatus.NONE;
        self.ingChangeFns.forEach(function(fn){fn(name, change);});
    };

    var generateClass = function(data) {
        return ((data["required"] ? "required " : "") + 
                (data["have"] ? "have " : "")).trim();
    };

    var fd = mix.lib.featureDetection();

    var dYMax = 10;
    var dXMax = 10;

    //make the data as we need it, importing if needed
    this.data = {ingredients: [], ingMap: {}};

    for(var ing in mix.data.ingredients) {
        var obj = {"name": ing};
        this.data.ingredients.push(obj);
        this.data.ingMap[ing] = obj;
        if (extData && ing in extData) {
            switch(extData[ing]) {
                case mix.ui.IngStatus.NEED: obj["required"] = true; break;
                case mix.ui.IngStatus.HAVE: obj["have"] = true; break;
            }
            obj["classNm"] = generateClass(obj);
        }
    }
    this.data.ingredients.sort(function(a, b) {
        return a["name"] < b["name"] ? -1 : 
               a["name"] > b["name"] ? 1 : 0;
    });

    this.templates = templates;
    this.templateName = templateName;

    //set up the template
    this.domTmp = templates.generateDom(templateName, this.data);
    this.domMain.appendChild(this.domTmp);

    //event handlers (dragging)
    mix.lib.domSlider(this.domMain, function(isOn, data) {
        data["required"] = isOn;
        data["have"] = true;
        data["classNm"] = generateClass(data);
        self.tmp.populateTemplate(self.tmpNm, self.domTmp, self.data);
        fireChangeFns(data);
    }, function(didChange, data) {
        if (!data || !data["name"]) {return;}
        if (!data["required"] && !didChange) {
            data["have"] = !data["have"];
            data["classNm"] = generateClass(data);
            self.tmp.populateTemplate(self.tmpNm, self.domTmp, self.data);
            fireChangeFns(data);
        }
    });

    this.domMain.addEventListener(fd.clickEvent, function(e) {
        if (e.target.tagName.toLowerCase() !== "button") {return;}

        for(var i = 0; i < self.data.ingredients.length; i+=1) {
            self.data.ingredients[i]["required"] = false;
            self.data.ingredients[i]["have"] = false;
            self.data.ingredients[i]["classNm"] = "";
        }

        self.tmp.populateTemplate(self.tmpNm, self.domTmp, self.data);
        self.clearFns.forEach(function(fn){fn();});
    });
};

/**
 * Adds a listener that fires when an ingredients status changes (unless
 * it was cleared - you must listen for a clear event for that).
 * @param {function(string, mix.ui.IngStatus)} fn the callback function
 */
mix.ui.Ingredients.prototype.addIngredientChangeListener = function(fn) {
    this.ingChangeFns.push(fn);
};

/**
 * Adds a listener that fires when all ingredients are cleared (set to
 * NONE status). Note that clearing does not fire any change listener events.
 * @param {function} fn the function to fire
 */
mix.ui.Ingredients.prototype.addClearListener = function(fn) {
    this.clearFns.push(fn);
};

/**
 * Gets the status of a given ingredient. TODO: needs hash cache for O(1)
 * @param {string} name the name of the ingredient to find status of
 * @return {mix.ui.IngStatus} the status of the ingredient
 */
mix.ui.Ingredients.prototype.getIngredientStatus = function(name) {
    var ing = this.data.ingMap[name];
    if (ing) {
        return ing["required"] ? mix.ui.IngStatus.NEED :
               ing["have"] ? mix.ui.IngStatus.HAVE :
               mix.ui.IngStatus.NONE;
    }
    return mix.ui.IngStatus.NONE;
};

/**
 * Gets the number of ingredients that are currently marked as "NEED".
 * @this {mix.ui.Ingredients}
 * @return {number} the number of ingredients we need
 */
mix.ui.Ingredients.prototype.numberNeeded = function() {
    var count = 0;
    for(var i=0; i < this.data.ingredients.length; i+=1) {
        count += this.data.ingredients[i]["required"] ? 1 : 0;
    }
    return count;
};

/**
 * Creates a recipe list. This is a list of 10 categories. The categories
 * can be modified by the "type" setting. Each category contains a list of
 * dom elements - one per recipe. The recipe dom can be generated by an
 * external function. This object handles keeping the recipes sorted and in
 * their proper categories whenever ingredients change.
 * @class
 * @constructor
 * @param {Element} domContainer the parent dom element that this object controls.
 * @param {mix.lib.TemplateManager} templates the template library used for this 
 * @param {string} recipeTempId the ID of the template to use for each recipe card
 * @param {string} categoryHeaderTempId the ID of the template to use for the category headers
 * @param {string} categoryListTempId the ID of the template to use for category containers
 */
mix.ui.Recipes = function(domContainer, templates, recipeTempId, categoryHeaderTempId, categoryListTempId) {
    this.domContainer = domContainer;
    this.sortType = null;
    this.templates = templates;
    this.tidRecipe = recipeTempId;
    this.tidCatHeader = categoryHeaderTempId;
    this.tidCatList = categoryListTempId;
    var numContainers = 10;

    //titles (h2)
    this.catTitleDom = [];
    var cn = "";
    for(var i=0; i < numContainers; i+=1) {
        this.catTitleDom[i] = this.templates.generateDom(this.tidCatHeader, {
            "mainClass": i === 0 ? "catTitle" : "catTitle incomplete",
            "missing": i,
            "isNotOne": i !== 1 ? "" : "hidden",
            "isLast": i === numContainers-1 ? "" : "hidden",
            "percentHave": (i === numContainers - 1 ? "20" : (100-i*10))+"%"
        });
    }

    //content boxes (ol)
    //
    /** @type {Array.<Node>} */
    this.catContentDom = [];
    /** @type {Array.<mix.lib.OrderedArray>} */
    this.catContent = [];
    for(i=0; i < numContainers; i+=1) {
        this.catContent[i] = new mix.lib.OrderedArray();
        this.catContentDom[i] = this.templates.generateDom(this.tidCatList, {
            "mainClass": i === 0 ? "" : "incomplete"
        });
    }

    //recipes (li)
    /** @type {Object.<string, Node>} drink name to dom */
    this.drinkDomMap = {};
    /** @type {Object.<string, number>} drink name to category number */
    this.drinkCurCat = {};
    for(var drinkName in mix.data.drinks) {
        this.drinkDomMap[drinkName] = this.templates.generateDom(this.tidRecipe, mix.data.drinks[drinkName]);
    }

    //set content of h2 and ol
    var totalDom = Math.min(this.catTitleDom.length, this.catContentDom.length);
    for(i=0; i < totalDom; i+=1) {
        domContainer.appendChild(this.catTitleDom[i]);
        domContainer.appendChild(this.catContentDom[i]);
    }
};

/**
 * Updates the UI to reflect changes in a given ingredient list.
 * @param {mix.ui.Ingredients} ingList the list of ingredients to pull from
 * @param {mix.ui.Settings} settings the settings that control how the UI is organized
 * @param {mix.ui.SortIncompleteBy} newSortType the method of sorting into categories
 * @this {mix.ui.Recipes}
 */
mix.ui.Recipes.prototype.changeIngredient = function changeIngredient(ingList, settings, newSortType) {
    var i = 0;
    var self = this;

    if (newSortType !== undefined && newSortType !== null) {
        if (!this.sortType) {this.sortType = 0;}
        this.domContainer.classList.remove("sortType"+this.sortType);
        this.sortType = newSortType;
        this.domContainer.classList.add("sortType"+this.sortType);
    }
    //re-arrange drinks
    var removeDrink = function(drinkName, domDrink) {
        var curIndex = self.drinkCurCat[drinkName];
        if (curIndex !== null && curIndex !== undefined) {
            self.catContent[curIndex].remove(drinkName);
        }
        if (domDrink.parentNode) {
            domDrink.parentNode.removeChild(domDrink);
        }
    };
    var addDrink = function(newCatIndex, drinkName, domDrink) {
        var orderIndex = self.catContent[newCatIndex].insert(drinkName);
        var drinkAfter = self.catContent[newCatIndex].data[orderIndex+1];
        if (drinkAfter === null || drinkAfter === undefined) {
            self.catContentDom[newCatIndex].appendChild(domDrink);
        } else {
            self.catContentDom[newCatIndex].insertBefore(domDrink,
                                            self.drinkDomMap[drinkAfter]);
        }
        self.drinkCurCat[drinkName] = newIndex;
    };

    for(var drinkName in mix.data.drinks) {
        var anyNeeded = ingList.numberNeeded() > 0;
        var st = mix.ui.IngStatus.NONE;
        var need = false;
        var have = 0;
        var drink = mix.data.drinks[drinkName];
        var domDrink = this.drinkDomMap[drinkName];
        var domPar = domDrink.parentNode;
        var total = drink.ingredients.length;

        if (ingList) {
            for(i=0; i < total; i+=1) {
                var ing = drink.ingredients[i].id;
                st = ingList.getIngredientStatus(ing);
                need = need || st === mix.ui.IngStatus.NEED;
                have += st === mix.ui.IngStatus.HAVE ||
                        st === mix.ui.IngStatus.NEED ? 1 : 0;
            }
        }
        
        if ((anyNeeded && need) || !anyNeeded) { //add to a cat
            var newIndex = 0;
            if (!this.sortType || this.sortType === mix.ui.SortIncompleteBy.NUMBER_NEEDED) {
                newIndex = total - have;
            } else { //PERCENT_LEFT
                newIndex = 10 - parseInt(have/total * 10, 10);
            }
            newIndex = Math.min(Math.max(0, newIndex), this.catContentDom.length-1);

            if (domPar !== this.catContentDom[newIndex]) {
                removeDrink(drinkName, domDrink);
                addDrink(newIndex, drinkName, domDrink);
            }

        } else { //this node shouldn't be in a cat
            removeDrink(drinkName, domDrink);
        }
    }

    //make sure visible categories / h2s are visible and others are not
    for(i=0; i < this.catContentDom.length; i+=1) {
        if (mix.lib.trim(this.catContentDom[i].innerHTML) === "") {
            this.catTitleDom[i].style.display = "none";
        } else {
            this.catTitleDom[i].style.display = "";
        }
    }
};

/**
 * The object that manages the Settings panel.
 * @class
 * @constructor
 * @param {Element} domPanel the dom node that this panel is using for data
 */
mix.ui.Settings = function(domPanel) {
    //fix nested-label problem
    var lbls = domPanel.querySelectorAll("label[for]");
    var bindCheckbox = function(c1, c2) {
        if (!c1 || !c2) {return;}
        c1.addEventListener("change", function(e) {c2.checked = c1.checked;});
    };
    for(var i=0; i<lbls.length; i+=1) {
        bindCheckbox(
            lbls[i].querySelector("input[type='checkbox']"),
            document.getElementById(lbls[i].htmlFor) );
    }

    //bind variables
    var self = this;
    var domSort = domPanel.querySelector("#setSortRecipe");
    if (domSort) {
        domSort.addEventListener("change", function(e) {
            self.setValue("sortIncomplete", parseInt(domSort.value,10));
        });
    }
};

mix.ui.Settings.prototype = new mix.lib.EventHandler();

/**
 * An enum listing the options for sorting drinks into categories.
 * @enum {number}
 */
mix.ui.SortIncompleteBy = {
    NUMBER_NEEDED: 0,
    PERCENT_OWNED: 1
};

/**
 * An enum listing the options for what state an ingredient can be in.
 * @enum {number}
 */
mix.ui.IngStatus = {
    NONE: 0,
    HAVE: 1,
    NEED: 2
};

/**
 * An object that manages saving all state to local storage and
 * retrieving it, updating the UI accordingly.
 * @class
 * @constructor
 */
mix.lib.LocalStore = function() {
    this.kill = !window.localStorage || !JSON.parse || !JSON.stringify;

    if (this.kill) {return;}

    try {
        window.localStorage["test"] = "true";
        var tst = window.localStorage["test"];
        if (!window.localStorage["ing"]) {
            window.localStorage["ing"] = "{}";
        }

    } catch(e) {
        this.kill = true;
    }
};

/**
 * Gets the map of ingredients to their status that is currently stored
 * in the local storage.
 * @param {mix.ui.Ingredients} ingredients the list of ingredients
 * @this mix.lib.LocalStore
 * @return {Object.<string, mix.ui.IngStatus>} the mapping of ingredient
 *      name to status. If not in the map, assumed NONE.
 */
mix.lib.LocalStore.prototype.getStoredStatuses = function(ingredients) {
    if (this.kill) {return {};}

    return JSON.parse(window.localStorage["ing"]);
};

/**
 * Clears the state of the ingredients list in localstore.
 * @this {mix.lib.LocalStore}
 */
mix.lib.LocalStore.prototype.clearIngredients = function clearIngredients() {
    if (this.kill) {return;}

    window.localStorage["ing"] = "{}";
};

/**
 * Writes the status of a single ingredient to local storage.
 * @param {string} ingName the name of the ingredient
 * @param {mix.ui.IngStatus} ingStatus the status of the ingredient
 * @this {mix.lib.LocalStore}
 */
mix.lib.LocalStore.prototype.writeToStorage = function(ingName, ingStatus) {
    if (this.kill) {return;}
    
    var ingList = JSON.parse(window.localStorage["ing"]);
    if (ingStatus === mix.ui.IngStatus.NONE) {
        delete ingList[ingName];
    } else {
        ingList[ingName] = ingStatus;
    }

    window.localStorage["ing"] = JSON.stringify(ingList);
};

/**
 * Writes data about the current settings state to local storage
 * TODO: implement this
 * @param {mix.ui.Settings} settings the settings object to write
 * @this {mix.lib.LocalStore}
 */
mix.lib.LocalStore.prototype.writeSettings = function(settings) {

};


// ------------------- ON LOAD ------------------ //
document.addEventListener("DOMContentLoaded", function(e) {
    //load templates
    var templates = new mix.lib.TemplateManager();
    templates.addTemplate("ingredientList", document.getElementById("TemplateIngedientSidebar"));
    templates.addTemplate("recipe", document.getElementById("TemplateRecipeCard"));
    templates.addTemplate("categoryHeader", document.getElementById("TemplateCategoryTitle"));
    templates.addTemplate("categoryList", document.getElementById("TemplateCategoryList"));

    //setup the main controllers
    var localStore = new mix.lib.LocalStore();
    var ingredients = new mix.ui.Ingredients(
                document.querySelector(".ingredients"),
                templates,
                "ingredientList",
                localStore.getStoredStatuses());

    var recipes = new mix.ui.Recipes(document.querySelector(".recipes"),
                                     templates,
                                     "recipe",
                                     "categoryHeader",
                                     "categoryList");

    var settings = new mix.ui.Settings(document.querySelector(".settings"));

    recipes.changeIngredient(ingredients, settings);

    //setup listeners
    ingredients.addIngredientChangeListener(function(nm, st) {
        localStore.writeToStorage(nm, st);
        recipes.changeIngredient(ingredients, settings);
    });

    ingredients.addClearListener(function() {
        localStore.clearIngredients();
        recipes.changeIngredient(ingredients, settings);
    });
    
    settings.addEventListener("sortIncomplete", function(e) {
        if (e.newValue === e.oldValue) {return;}
        recipes.changeIngredient(ingredients, settings, e.newValue);
    });

    //enable browser-specific features
    var ua = navigator.userAgent.toLowerCase();
    var features = "";
    var fd = mix.lib.featureDetection();

    if (features !== "") {
        document.body.className = (document.body.className + " " + features).replace(/^\s*|\s*$/g, "");
    }
}, false);
