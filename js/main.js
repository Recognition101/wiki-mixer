goog.require("mix.lib.TemplateManager");
goog.require("mix.lib.LocalStore");

goog.require("mix.ui.Ingredients");
goog.require("mix.ui.Recipes");
goog.require("mix.ui.Settings");

goog.require("mix.domlib");

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
    
    /*settings.addEventListener("sortIncomplete", function(e) {
        if (e.newValue === e.oldValue) {return;}
        recipes.changeIngredient(ingredients, settings, e.newValue);
    });*/

    //enable browser-specific features
    var ua = navigator.userAgent.toLowerCase();
    var features = "";
    var fd = mix.domlib.featureDetection();

    if (features !== "") {
        document.body.className = (document.body.className + " " + features).replace(/^\s*|\s*$/g, "");
    }
}, false);
