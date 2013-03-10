goog.provide("mix.ui.Ingredients");
goog.provide("mix.ui.IngStatus");

goog.require("mix.lib.TemplateManager");
goog.require("mix.domlib");

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

    var fd = mix.domlib.featureDetection();

    var dYMax = 10;
    var dXMax = 10;

    //make the data as we need it, importing if needed
    this.data = {"ingredients": [], "ingMap": {}};

    for(var ing in mixDataIng) {
        var obj = {"name": ing};
        this.data["ingredients"].push(obj);
        this.data["ingMap"][ing] = obj;
        if (extData && ing in extData) {
            switch(extData[ing]) {
                case mix.ui.IngStatus.NEED: obj["required"] = true; break;
                case mix.ui.IngStatus.HAVE: obj["have"] = true; break;
            }
            obj["classNm"] = generateClass(obj);
        }
    }
    this.data["ingredients"].sort(function(a, b) {
        return a["name"] < b["name"] ? -1 : 
               a["name"] > b["name"] ? 1 : 0;
    });

    this.templates = templates;
    this.templateName = templateName;

    //set up the template
    this.domTmp = templates.generateDom(templateName, this.data);
    this.domMain.appendChild(this.domTmp);

    //event handlers (dragging)
    mix.ui.Slider(this.domMain, function(isOn, data) {
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

        for(var i = 0; i < self.data["ingredients"].length; i+=1) {
            self.data["ingredients"][i]["required"] = false;
            self.data["ingredients"][i]["have"] = false;
            self.data["ingredients"][i]["classNm"] = "";
        }

        self.tmp.populateTemplate(self.tmpNm, self.domTmp, self.data);
        self.clearFns.forEach(function(fn){fn();});
    }, false);
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
 * @param {function()} fn the function to fire
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
    var ing = this.data["ingMap"][name];
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
    for(var i=0; i < this.data["ingredients"].length; i+=1) {
        count += this.data["ingredients"][i]["required"] ? 1 : 0;
    }
    return count;
};
