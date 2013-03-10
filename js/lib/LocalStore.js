goog.provide("mix.lib.LocalStore");

goog.require("mix.ui.Ingredients");
goog.require("mix.ui.IngStatus");
goog.require("mix.ui.Settings");

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
 * @this mix.lib.LocalStore
 * @return {Object.<string, mix.ui.IngStatus>} the mapping of ingredient
 *      name to status. If not in the map, assumed NONE.
 */
mix.lib.LocalStore.prototype.getStoredStatuses = function() {
    if (this.kill) {return {};}

    var ls = /**@type {Object.<string, mix.ui.IngStatus>} */(JSON.parse(window.localStorage["ing"]));

    return ls;
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
