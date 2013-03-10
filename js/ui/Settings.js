goog.provide("mix.ui.Settings");
goog.provide("mix.ui.SortIncompleteBy");

/**
 * An enum listing the options for sorting drinks into categories.
 * @enum {number}
 */
mix.ui.SortIncompleteBy = {
    NUMBER_NEEDED: 0,
    PERCENT_OWNED: 1
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
    /*if (domSort) {
        domSort.addEventListener("change", function(e) {
            self.setValue("sortIncomplete", parseInt(domSort.value,10));
        });
    }*/
};
