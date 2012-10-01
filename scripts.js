var mix = {data: {}, ui: {}, lib: {}};

/**
 * Given a tag name and properties for the element (ex: innerHTML),
 * this will create an element with those properties.
 * @param {string} name the tag name (ie: a, div, etc)
 * @param {Object.<string, string>} props a map of prop names to their values to set
 */
mix.lib.makeDomEl = function makeDomEl(name, props) {
    var dom = document.createElement(name);
    for (var prop in props) {
        dom[prop] = props[prop];
    }
    return dom;
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
 * The Ingredient list UI, handles getting the state of
 * the ingredients that are selected.
 * @param {Element} the dom element containing this widget
 * @class
 * @constructor
 */
mix.ui.Ingredients = function Ingredients(domContainer) {
    this.domMain = domContainer;
    this.domList = domContainer.querySelector("ul.ingredientList");
    this.domIngMap = {}; // ingName -> {"none": dom, "have": dom, "need": dom} (dom of radio button)
    this.ingMap = {}; // ingName -> 1 (has it) | 2 (needs it) | undefined (neither)
    this.domClearBtn = domContainer.querySelector("button");
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
    var makeDomEl = mix.lib.makeDomEl;
    
    while(this.domList.hasChildNodes()) {
        this.domList.removeChild(this.domList.firstChild);
    }

    var ingList = [];
    for(ing in mix.data.ingredients) {
        ingList.push(ing);
    }
    ingList.sort();

    for(var i=0; i < ingList.length; i+=1) {
        ing = ingList[i];
        var domLi = document.createElement("li");

        var bgrnd= makeDomEl("div", {className: "ingBgrnd"});
        
        var rad1 = makeDomEl("input", {type:"radio", name:"radIngState"+i, id:"radIngNone"+i, className:"ingNone", value:"none", checked: true});
        var rad2 = makeDomEl("input", {type:"radio", name:"radIngState"+i, id:"radIngHave"+i, className:"ingHave", value:"have"});
        var rad3 = makeDomEl("input", {type:"radio", name:"radIngState"+i, id:"radIngNeed"+i, className:"ingNeed", value:"need"});
        this.domIngMap[ing] = {
            "none": rad1,
            "have": rad2,
            "need": rad3
        };

        var rad1Lbl = makeDomEl("label", {htmlFor: "radIngNone"+i, innerHTML: ing, className:"ingNone"});
        var rad2Lbl = makeDomEl("label", {htmlFor: "radIngHave"+i, innerHTML: ing, className:"ingHave"});
        var rad3Lbl = makeDomEl("label", {htmlFor: "radIngNeed"+i, innerHTML: ing, className:"ingNeed"});

        var chkLbl = makeDomEl("div", {innerHTML: "\u2714"});
        var reqLbl = makeDomEl("div", {innerHTML: "R"});
        var state = makeDomEl("div", {className: "ingCheckState"});
        state.appendChild(chkLbl);
        state.appendChild(reqLbl);

        domLi.appendChild(rad1);
        domLi.appendChild(rad2);
        domLi.appendChild(rad3);
        domLi.appendChild(bgrnd);
        domLi.appendChild(rad1Lbl);
        domLi.appendChild(rad2Lbl);
        domLi.appendChild(rad3Lbl);
        domLi.appendChild(state);

        this.domList.appendChild(domLi);
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
 * @param {function(string): HTMLLiElement} makeRecipeDom a function that, given
 *      a drink name, creates and returns a dom element to be used in this recipe list
 */
mix.ui.Recipes = function(domContainer, makeRecipeDom) {
    this.domContainer = domContainer;
    this.sortType = null;
    var numContainers = 10;
    var makeDomEl = mix.lib.makeDomEl;

    //titles (h2)
    this.catTitleDom = [];
    var cn = "";
    for(var i=0; i < numContainers; i+=1) {
        cn = i === 0 ? "" : "incomplete";
        this.catTitleDom[i] = makeDomEl("h2", {className: cn});
    }

    //content boxes (ol)
    this.catContentDom = []; //type -> dom root
    this.catContent = []; //type -> OrderedArray of drink names
    for(i=0; i < numContainers; i+=1) {
        cn = i === 0 ? "" : "incomplete";
        this.catContentDom[i] = makeDomEl("ol", {className: cn});
        this.catContent[i] = new mix.lib.OrderedArray();
    }

    //recipes (li)
    this.drinkDomMap = {}; //drink name -> dom
    this.drinkCurCat = {}; //drink name -> cat number
    for(var drinkName in mix.data.drinks) {
        this.drinkDomMap[drinkName] = makeRecipeDom(drinkName);
    }

    //set content of h2 and ol
    var totalDom = Math.min(this.catTitleDom.length, this.catContentDom.length);
    for(i=0; i < totalDom; i+=1) {
        domContainer.appendChild(this.catTitleDom[i]);
        domContainer.appendChild(this.catContentDom[i]);
    }
    this.setHeaders();
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
        this.sortType = newSortType;
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
                var ing = drink.ingredients[i];
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
        if (!this.catContentDom[i].hasChildNodes()) {
            this.catTitleDom[i].style.display = "none";
        } else {
            this.catTitleDom[i].style.display = "";
        }
    }
};

/**
 * Sets the text in the category headers to reflect a
 * new category sort-by type.
 * @param {mix.ui.SortIncompleteBy} newCat the new sort
 *      method to update the category headers to reflect.
 * @this {mix.ui.Recipes}
 */
mix.ui.Recipes.prototype.setHeaders = function(newCat) {
    var num = 0;
    if (newCat === undefined) {
        newCat = mix.ui.SortIncompleteBy.NUMBER_NEEDED;
    }
    for(var i=0; i<this.catTitleDom.length; i+=1) {
        var last = i === this.catContentDom.length - 1;
        var first = i === 0;
        if (newCat === mix.ui.SortIncompleteBy.NUMBER_NEEDED) {
            num = last ? i+"+" : i+"";
            this.catTitleDom[i].innerHTML = "Missing <span class=\"ingNum\">"+num+"</span> Ingredients";
        } else { // % Have
            num = "<span class=\"ingNum\">"+(last ? "20" : (100-i*10))+"%</span>";
            var perc = first ? num : last ? num+" or Less" : "At Least "+num;
            this.catTitleDom[i].innerHTML = "Have "+perc+" of Ingredients";
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
    var makeDomEl = mix.lib.makeDomEl;
    //recipe creating functions
    var createFullRecipe = function(drinkName) {
        var drink = mix.data.drinks[drinkName];
        var isIba = drink["isIba"] ? " iba" : " notIba";
        var dom = makeDomEl("li", {
            className: isIba
        });
        dom.innerHTML += drink["html"];
        var shadowBoxDom = makeDomEl("div", {className:"recipeShadowBox"});
        dom.appendChild(shadowBoxDom);
        var shadowMaskDom = makeDomEl("div", {className:"recipeShadowMask"});
        shadowBoxDom.appendChild(shadowMaskDom);
        shadowMaskDom.appendChild(makeDomEl("div", {className:"recipeShadow"}));
        shadowMaskDom.appendChild(makeDomEl("div", {className:"recipeShadow"}));

        return dom;
    };

    var createRecipeSidebarItem = function(drinkName) {
        var drink = mix.data.drinks[drinkName];
        var isIba = drink["isIba"] ? "iba" : "notIba";
        var dom = makeDomEl("li", {
            className: isIba
        });
        var ingString = "";
        for(var i=0; i < drink.ingredients.length; i++) {
            if (ingString !== "") {ingString += ", ";}
            ingString += drink.ingredients[i];
        }
        dom.appendChild(makeDomEl("h3", {innerHTML: drinkName}));
        dom.appendChild(makeDomEl("div", {innerHTML: ingString}));

        return dom;
    };


    //setup the main controllers
    var ingredients = new mix.ui.Ingredients(document.querySelector(".ingredients"));
    var recipes = new mix.ui.Recipes(document.querySelector(".recipes"), createFullRecipe);
    //var recipes = new mix.ui.Recipes(document.querySelector(".recipeList"), createRecipeSidebarItem);
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
        recipes.setHeaders(e.newValue);
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
