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
 * Given a dom node, remove it from its parent if it has one.
 * @param {Node} dom the dom node to remove
 */
mix.lib.domRemove = function(dom) {
    if (dom.parentNode) {
        dom.parentNode.removeChild(dom);
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
mix.lib.TemplateManager.prototype.populateTemplate = function(id, dom, data) {
    var fill = dom.querySelectorAll("*[data-html]");
    var keys = null, attrs = null, prevElems=null, context = null;
    var newHtml = "", i=0, j=0;
    for(i=0; i < fill.length; i+=1) {
        keys = fill[i].getAttribute("data-html");
        newHtml = undefined;
        if (keys === ".") {
            newHtml = data;
        } else {
            keys = keys ? keys.split(".") : [];
            newHtml = mix.lib.safeRetrieve(data, keys);
        }
        if (newHtml !== undefined && newHtml !== fill[i].innerHTML) {
            fill[i].innerHTML = newHtml;
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
                if (dat && domAttrs.getAttribute(keys[0]) !== dat) {
                    domAttrs.setAttribute(keys[0], dat);
                }
            }
        }
    };
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
                        this.populateTemplate(id, prevElems[j], context[j]);
                    } else {
                        newDom = this.templates[id].frags[attrs[1]].cloneNode(true);
                        fill[i].appendChild(newDom);
                        this.populateTemplate(id, newDom, context[j]);
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
 * @param {string} templateName the name of the template describing an ingredient
 * @class
 * @constructor
 */
mix.ui.Ingredients = function Ingredients(domContainer, templates, templateName) {
    this.domMain = domContainer;
    this.domList = domContainer.querySelector("ul.ingredientList");
    this.domIngMap = {}; // ingName -> {"none": dom, "have": dom, "need": dom} (dom of radio button)
    this.ingMap = {}; // ingName -> 1 (has it) | 2 (needs it) | undefined (neither)
    this.domClearBtn = domContainer.querySelector("button");

    this.templates = templates;
    this.templateName = templateName;

    if (this.domClearBtn) {
        var self = this;
        this.domClearBtn.addEventListener("click", function(e) {
            for (var ing in self.ingMap) {
                self.domIngMap[ing]["none"].checked = true;
            }
            self.ingMap = {};
            self.setValue("clear", true);
        });
    }
};

mix.ui.Ingredients.prototype = new mix.lib.EventHandler();

/**
 * Loads the JSON data and sets the HTML to match the data.
 * @this {mix.ui.Ingredients}
 */
mix.ui.Ingredients.prototype.loadData = function loadData() {
    var ingIndex = 0;
    var ing = null;
    
    while(this.domList.hasChildNodes()) {
        this.domList.removeChild(this.domList.firstChild);
    }

    var ingList = [];
    for(ing in mix.data.ingredients) {
        ingList.push(ing);
    }
    ingList.sort();

    var domLi = null;
    var idNone = "", idHave = "", idNeed = "";
    for(var i=0; i < ingList.length; i+=1) {
        ing = ingList[i];
        idNone = "radIngNone"+i;
        idHave = "radIngHave"+i;
        idNeed = "radIngNeed"+i;
        domLi = this.templates.generateDom(this.templateName, {
            "idIng": "radIngState"+i,
            "idNone": idNone,
            "idHave": idHave,
            "idNeed": idNeed,
            "nameIng": ing
        });
        this.domList.appendChild(domLi);
        this.domIngMap[ing] = {};
        this.domIngMap[ing]["none"] = document.getElementById(idNone);
        this.domIngMap[ing]["have"] = document.getElementById(idHave);
        this.domIngMap[ing]["need"] = document.getElementById(idNeed);
    }

    var self = this;
    this.domList.addEventListener("change", function(e) {
        var name = e.target.parentNode && e.target.parentNode.querySelector("label");
        name = name && name.innerHTML && name.innerHTML.replace(/(^(\s|\n)*)|((\s|\n)*$)/g, "");
        if (e.target.value && e.target.checked && name) {
            if (e.target.value === "none") {
                delete self.ingMap[name];

            } else if (e.target.value === "have") {
                self.ingMap[name] = 1;

            } else if (e.target.value === "need") {
                self.ingMap[name] = 2;
            }

            self.setValue("lastChange", name);
        }
    }, false);
};

/**
 * Gets if we have or do not have an ingredient of a given name
 * @param {string} ing the ingredient name
 * @this {mix.ui.Ingredients}
 * @return {boolean} true if we have the ingredient
 */
mix.ui.Ingredients.prototype.haveIngredient = function hasIngredient(ing) {
    return ing in this.ingMap && this.ingMap[ing] >= 1;
};

/**
 * Gets whether or not a given ingredient is "required".
 * @param {string} ing the ingredient name
 * @this {mix.ui.Ingredients}
 * @return {boolean} true if the ingredient is required.
 */
mix.ui.Ingredients.prototype.needIngredient = function hasIngredient(ing) {
    return ing in this.ingMap && this.ingMap[ing] >= 2;
};

/**
 * Gets how many ingredients are marked as "required".
 * @this {mix.ui.Ingredients}
 * @return {number} the number of "required" ingredients.
 */
mix.ui.Ingredients.prototype.getNumberNeeded = function getNumberNeeded() {
    var ret = 0;
    for(var ing in this.ingMap) {
        if (this.ingMap[ing] >= 2) {ret+=1;}
    }
    return ret;
};

/**
 * Sets that we have a given ingredient.
 * @param {string} ingName the name of the ingredient that we now have
 * @this {mix.ui.Ingredients}
 * @return {boolean} true if we properly set the ingredient, false if
 *      that ingredient is not in the list (and as such was not set).
 */
mix.ui.Ingredients.prototype.setHave = function setHave(ingName) {
    if (!(ingName in this.domIngMap)) {
        return false;
    }

    this.domIngMap[ingName]["have"].checked = true;
    this.ingMap[ingName] = 1;
    return true;
};

/**
 * Sets that a given ingredient is "required".
 * @param {string} ingName the ingredient name
 * @this {mix.ui.Ingredients}
 * @return {boolean} true if we properly set the required flag,
 *      false if we couldn't set the property because there
 *      is no ingredient that has that name.
 */
mix.ui.Ingredients.prototype.setNeed = function setNeed(ingName) {
    if (!(ingName in this.domIngMap)) {
        return false;
    }

    this.domIngMap[ingName]["need"].checked = true;
    this.ingMap[ingName] = 2;
    return true;
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
    this.catContentDom = []; //type -> dom root
    this.catContent = [];    //type -> OrderedArray of drink names
    for(i=0; i < numContainers; i+=1) {
        this.catContent[i] = new mix.lib.OrderedArray();
        this.catContentDom[i] = this.templates.generateDom(this.tidCatList, {
            "mainClass": i === 0 ? "" : "incomplete"
        });
    }

    //recipes (li)
    this.drinkDomMap = {}; //drink name -> dom
    this.drinkCurCat = {}; //drink name -> cat number
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

mix.ui.Recipes.prototype = new mix.lib.EventHandler();

/**
 * Updates the UI to reflect changes in a given ingredient list.
 * @param {mix.ui.Ingredients} ingList the list of ingredients to pull from
 * @param {mix.ui.Settings} settings the settings that control how the UI is organized
 * @param {mix.ui.SortIncompleteBy} newSortType the method of sorting into categories
 * @this {mix.ui.Recipes}
 */
mix.ui.Recipes.prototype.changeIngredient = function changeIngredient(ingList, settings, newSortType) {
    var i = 0;
    var noNeed = ingList ? ingList.getNumberNeeded() < 1 : true;
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
    for(var drinkName in mix.data.drinks) {
        var have = 0;

        var need = noNeed;
        var drink = mix.data.drinks[drinkName];
        var domDrink = this.drinkDomMap[drinkName];
        var domPar = domDrink.parentNode;
        var total = drink.ingredients.length;

        if (ingList) {
            for(i=0; i < total; i+=1) {
                var ing = drink.ingredients[i].id;
                if (ingList.haveIngredient(ing)) {have += 1;}
                need = need || ingList.needIngredient(ing);
            }
        }
        
        if (need) { //this node has to be added to a cat
            var newIndex = 0;
            if (!this.sortType || this.sortType === mix.ui.SortIncompleteBy.NUMBER_NEEDED) {
                newIndex = total - have;
            } else { //PERCENT_LEFT
                newIndex = 10 - parseInt(have/total * 10, 10);
            }
            newIndex = Math.min(Math.max(0, newIndex), this.catContentDom.length-1);

            if (domPar !== this.catContentDom[newIndex]) {
                removeDrink(drinkName, domDrink);
                var orderIndex = this.catContent[newIndex].insert(drinkName);
                var drinkAfter = this.catContent[newIndex].data[orderIndex+1];
                if (drinkAfter === null || drinkAfter === undefined) {
                    this.catContentDom[newIndex].appendChild(domDrink);
                } else {
                    this.catContentDom[newIndex].insertBefore(domDrink, this.drinkDomMap[drinkAfter]);
                }
                this.drinkCurCat[drinkName] = newIndex;
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
 * An object that manages saving all state to local storage and
 * retrieving it, updating the UI accordingly.
 * @class
 * @constructor
 */
mix.lib.LocalStore = function() {
    this.kill = !window.localStorage || !JSON.parse || !JSON.stringify;
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
 * Loads all the data from the localstore, updating the UI as needed.
 * @param {mix.ui.Ingredients} ingredients the list of ingredients
 * @this {mix.lib.LocalStore}
 */
mix.lib.LocalStore.prototype.loadFromStorage = function(ingredients) {
    if (this.kill) {return;}

    var ingList = JSON.parse(window.localStorage["ing"]);
    var keep = false;
    for(var ing in ingList) {
        keep = true;
        if (ingList[ing] === 1) {
            keep = ingredients.setHave(ing);
        } else if (ingList[ing] === 2) {
            keep = ingredients.setNeed(ing);
        }
        if (!keep) {
            delete ingList[ing];
        }
    }

    window.localStorage["ing"] = JSON.stringify(ingList);
};

/**
 * Clears the state of the ingredients list in localstore.
 * @this {mix.lib.LocalStore}
 */
mix.lib.LocalStore.prototype.clearIngredients = function clearIngredients() {
    window.localStorage["ing"] = "{}";
};

/**
 * Writes data about a single ingredient to the local storage
 * @param {mix.ui.Ingredients} ingredients the list of ingredients
 * @param {string} ingName the ingredient that has changed
 * @this {mix.lib.LocalStore}
 */
mix.lib.LocalStore.prototype.writeToStorage = function(ingredients, ingName) {
    if (this.kill) {return;}
    
    var ingList = JSON.parse(window.localStorage["ing"]);
    var haveNeed = ingredients.needIngredient(ingName) ? 2 :
                    ingredients.haveIngredient(ingName) ? 1 : 0;

    if (haveNeed === 0) {
        delete ingList[ingName];
    } else {
        ingList[ingName] = haveNeed;
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
    templates.addTemplate("ingredient", document.getElementById("TemplateIngredient"));
    templates.addTemplate("recipe", document.getElementById("TemplateRecipeCard"));
    templates.addTemplate("categoryHeader", document.getElementById("TemplateCategoryTitle"));
    templates.addTemplate("categoryList", document.getElementById("TemplateCategoryList"));

    //setup the main controllers
    var ingredients = new mix.ui.Ingredients(document.querySelector(".ingredients"), templates, "ingredient");
    var recipes = new mix.ui.Recipes(document.querySelector(".recipes"), templates, "recipe", "categoryHeader", "categoryList");
    var settings = new mix.ui.Settings(document.querySelector(".settings"));
    var localStore = new mix.lib.LocalStore();

    ingredients.loadData();
    localStore.loadFromStorage(ingredients);
    recipes.changeIngredient(ingredients, settings);

    //setup listeners
    ingredients.addEventListener("lastChange", function(e) {
        recipes.changeIngredient(ingredients, settings);
        localStore.writeToStorage(ingredients, e.newValue);
    });

    ingredients.addEventListener("clear", function(e) {
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
    var pd = window.devicePixelRatio ? window.devicePixelRatio : 1;
    if (ua.indexOf("ipad") > -1 && pd < 2) { //ipad 1 & 2

    } else {
        features = "ftShadow ftAnimateIng";
    }

    if (features !== "") {
        document.body.className = (document.body.className + " " + features).replace(/^\s*|\s*$/g, "");
    }
}, false);
