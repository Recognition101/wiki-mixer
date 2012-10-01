#!/usr/bin/env python

from __future__ import division
import urllib2
import re
import json
import os
import unicodedata

"""
Generator is a script made to look up and write the cocktail list into JSON.
It consists of two steps:
    1) Download all cocktail recipe tables into a
       JSON file (if said file does not already exists)
    2) Use downloaded JSON to form a rough ingredient
       list file (overwriting old ingredient file)
"""


def getPage(url):
    ret = ""
    try:
        req = urllib2.Request(url, headers={'User-Agent': "Magic Browser"})
        con = urllib2.urlopen(req)
        ret = con.read()
    except urllib2.HTTPError:
        print "WARNING: Cannot fetch " + url
        ret = ""

    return ret

wikiDataFile = "./wikiData.json"
optiDataFile = "./optiData.js"
ingDataFile = "./ingData.js"
reOpts = re.MULTILINE | re.IGNORECASE | re.DOTALL

# -------- IF THE DATA DOES NOT EXIST LOCALLY, DOWNLOAD IT --------
if not(os.path.exists(wikiDataFile)):
    beenUrls = set()
    wikiPrefix = "http://en.wikipedia.org/wiki/"
    index = getPage(wikiPrefix + "List_of_cocktails") + \
            getPage(wikiPrefix + "IBA_Official_Cocktail") + \
            getPage(wikiPrefix + "Category:Cocktails_with_vodka") + \
            getPage(wikiPrefix + "Category:Cocktails_with_gin") + \
            getPage(wikiPrefix + "Category:Cocktails_with_rum") + \
            getPage(wikiPrefix + "Category:Cocktails_with_whisky")
    drinkUrls = re.findall(
            '<li><a.*?href=.*?(\'|\")(.*?)(\'|\").*?>(.*?)</a.*?</li',
            index)
    output = []
    drinksScanned = 0

    drinkUrls = set(drinkUrls)
    for drinkUrl in drinkUrls:
        if not drinkUrl[1].startswith("/wiki/"):
            continue

        print("%s%% of Cocktails Scanned (%s / %s)" % (
            round(drinksScanned / len(drinkUrls) * 100),
            drinksScanned,
            len(drinkUrls)))
        drinksScanned += 1

        drinkPage = getPage("http://en.wikipedia.org" + drinkUrl[1])

        recipeRe = "(<table.*?class\s{0,5}=\s{0,5}(\'|\")" + \
                   "[^\'\"]*hrecipe[^\'\"]*.*?</table)"
        recipes = re.findall(recipeRe, drinkPage, reOpts)

        for recipe in recipes:
            html = recipe[0] + ">"
            table = re.sub("style=(\'|\").*?(\'|\")", "", html)
            table = re.sub("href=(\'|\")/wiki/",
                           "href=\\1http://en.wikipedia.org/wiki/",
                           table)
            cptFnd = re.findall("<caption[^>]*>(.*?)</caption", table, reOpts)
            caption = ""
            if len(cptFnd) > 0:
                caption = cptFnd[0]
            output.append({
                "baseName": drinkUrl[3],
                "url": "http://en.wikipedia.org" + drinkUrl[1],
                "html": html,
                "htmlClean": table,
                "name": caption
            })

    f = open(wikiDataFile, 'w')
    f.write(json.dumps(output))
    f.close()

# ---- READ DATA DOWNLOAD, PARSE INGREDIENTS, COLLAPSE DUPLICATES ----
f = open(wikiDataFile, 'r')
data = json.load(f)
f.close()

#ingredientName -> Array.<drinkNames>
ingredients = dict()

#drinkName -> {html, name, baseName, url, isIba,
#              ingredients: Array.<ingredientName>}
optiData = dict()


def sanitizeIngredient(ing):
    ing = unicodedata.normalize("NFKD", ing).encode('ascii', 'ignore')
    ing = ing.lower()
    #typos
    ing = re.sub("whisky", "whiskey", ing)

    #all weird characters
    ing = re.sub("&#[0-9\\/]*;", "", ing)
    ing = re.sub("'", "", ing)

    #all suffixes
    ing = re.sub("\([^\(\)]*?\)\s*$", "", ing)
    ing = re.sub("\[[^\[\]]*?\]\s*$", "", ing)
    ing = re.sub("\(?(unsweetened|optional|(to|for) taste)|liquer\)?\s*$",
                 "", ing)
    ing = re.sub("(,|\.)*\s*$", "", ing)

    #all prefixes
    ing = re.sub("^((top|fill)(\s*off)?\s*with(.*?of)?|sprinkle)\s*", "", ing)
    ing = re.sub("^[0-9\\/]*(\s*to\s*[0-9\\/]*)?\s*", "", ing)

    #all amounts
    ing = re.sub("^.{0,4}(us)?\s*(fl|fluid)?\s*(oz|ounce)[^\s]*\s*", "", ing)
    repPattern = "^\(?.{0,10}(pinch|a pinch|teaspoon|tsp|tbsp|cup|measure" + \
                 "|pint|dash|sprig|cl|ml|shot|part|drop|oz|ounce)" + \
                 "[es\.\)]*(\s*of)?\s*"
    ing = re.sub(repPattern, "", ing)
    ing = re.sub(repPattern, "", ing)
    ing = re.sub(repPattern, "", ing)
    ing = re.sub("^splash\s*", "", ing)
    ing = re.sub("^of\s*", "", ing)
    ing = re.sub("^fresh(ly\s*ground)?\s*", "", ing)

    def categorize(ing, basedOn):
        loc = ing.find(basedOn)
        if loc > -1 and len(ing[:loc].strip()) > 0:
            ing = ing[loc:] + " (" + ing[:loc].strip() + ")"
        return ing

    categories = [\
            "rum", "vodka", "whiskey", "vermouth", "creme", \
            "wine", "gin", "bitters", "curacao", "syrup", "juice", \
            "schnapps", "brandy", "sugar", "chartreuse", "cognac", \
            "irish cream", "tequila"]

    for category in categories:
        oldIng = ing
        ing = categorize(ing, category)
        if ing != oldIng:
            break

    #Special Cases
    specialCases = {
        "de cassis": "creme de cassis",
        "juice of 2 lemons": "lemon juice",
        "cointreau (triple sec": "cointreau",
        "cup sake": "sake",
        "soda water": "soda",
        "orange cointreau": "cointreau",
        "midori liqueur": "midori",
        "mint leaves": "mint",
        "oves, cinnamon and ginger": "cloves, cinnamon and ginger",
        "amato juice": "clamato juice",
        "one raw egg yolk": "egg",
        "egg white": "egg",
        "egg yolk": "egg",
        "one sugar cube or 1 tsp simple syrup": "simple syrup",
        "simple syrup or sugar": "simple syrup",
        "strawberries": "strawberry",
        "strawberry coulis/crushed strawberries": "strawberry",
        "sugar cubes": "sugar",
        "grenadine or other syrup": "grenadine",
        "grenadine syrup": "grenadine",
        "half of a lime squeezed and dropped in the glass": "lime",
        "lime cut into 4 wedges": "lime",
        "lime wedge": "lime",
        "coca-cola": "coke",
        "baileys": "baileys irish cream",
        "port wine": "port",
        "absinthe or herbsaint": "herbsaint",
        "bourbon": "whiskey (bourbon)",
        "lemon or lime juice": "juice (lemon)",
        "lemon disk, peeled": "lemon",
        "slice of lime": "lime",
        "slice of each fresh orange, lemon and lime": "orange, lemon, lime",
        "juice (slice of cashew, or 1 part cashew)": "cashew",
        "sweetened lime juice": "lime juice",
        "applejack": "brandy (applejack)",
        "cola": "coke",
        "cola or another carbonated soft drink": "coke",
        "juice (amato)": "juice (clamato)",
        "juice of half a lime": "juice (lime)",
        "peel of two oranges and a lime": "orange, lime",
        "syrup (grenadine or other)": "syrup (grenadine)",
        "syrup (one sugar cube or 1 tsp simple)": "syrup (simple)",
        "syrup or sugar (simple)": "syrup (simple)",
        "whiskey (rye or canadian)": "whiskey (rye)",
        "whiskey (scotch or rye)": "whiskey (scotch)",
        "wine (brut champagne or other dry sparkling)": "wine (dry sparkling)",
        "creme de cacao": "creme de cacao (white)",
        "gin, not no bathtub stuff; london dry or genever (good)": "gin",
        "half-and-half or fresh cream": "cream",
        "heavy cream": "cream",
        "juice (ly squeezed lemon)": "juice (lemon)",
        "juice) (citrus garnish (essence (twists, et cetera) - no)": "orange",
        "l fresca, sprite or 7-up": "sprite",
        "7 up": "sprite",
        "light cream": "cream",
        "limes": "lime",
        "noilly prat": "noilly pratt",
        "one to three parts tonic water": "tonic water",
        "rum or golden rum (white)": "rum (white)",
        "ub soda": "club soda",
        "ub-mate": "club-mate",
        "cognac (brandy or)": "cognac",
        "cognac (orange)": "grand marnier",
        "grenadine": "syrup (grenadine)",
        "syrup (sugar)": "syrup (simple)",
        "syrup (sugar cane)": "syrup (simple)",
        "sugar (honey or)": "sugar",
        "sugar ((if desired): brown)": "sugar",
        "sugar (crystal or refined)": "sugar",
        "sugar (granulated)": "sugar",
        "sugar cube": "sugar",
        "lillet blanc": "lillet",
        "leaves of mint": "mint",
        "chilled carbonated water": "tonic water"
    }
    if ing in specialCases:
        ing = specialCases[ing]

    return ing.lower()

for drink in data:
    ingList = re.findall("<th.*?ingredients.*?<ul[^>]*>(.*?)</ul",
                         drink["htmlClean"], reOpts)
    if len(ingList) < 1:
        print("WARNING: Drink being discarded due to lack of ingredients: %s" %
                drink["name"])
    else:
        htmlClean = drink["htmlClean"]
        htmlClean = re.sub("<tr[^>]*>[^<>]*<th[^>]*>\s*" +
                           "Primary alcohol by volume.*?<\\/tr>",
                           "", htmlClean, 0,
                           re.I | re.M | re.DOTALL)
        htmlClean = re.sub("<tr[^>]*>[^<>]*<th[^>]*>\s*type.*?<\\/tr>",
                           "", htmlClean, 0,
                           re.I | re.M | re.DOTALL)
        inOptiData = drink["name"] in optiData
        if inOptiData and htmlClean != optiData[drink["name"]]["html"]:
            print("WARNING: Collapsing two different recipes: %s" %
                    drink["name"])
        elif not drink["name"] in optiData:
            ings = re.findall("<li[^>]*>(.*?)</li", ingList[0], reOpts)
            ingList = []
            for ing in ings:
                ing = re.sub("<[^>]*>", "", ing)
                oldIng = ing
                ing = sanitizeIngredient(ing)
                if ing not in ingredients:
                    ingredients[ing] = []
                ingredients[ing].append(drink["name"])
                ingList.append(ing)
                if ing == "":
                    print("WARNING: Ingredient %s compressed into \"\"" %
                            oldIng)

            cleanHtml = drink["htmlClean"].lower()
            isIba = cleanHtml.find("iba official cocktail") >= 0
            optiData[drink["name"]] = {
                "html": htmlClean,
                "name": drink["name"],
                "baseName": drink["baseName"],
                "url": drink["url"],
                "isIba": isIba,
                "ingredients": ingList
            }

f = open(optiDataFile, 'w')
f.write("mix.data.drinks=" + json.dumps(optiData))
f.close()

f = open(ingDataFile, 'w')
f.write("mix.data.ingredients=" + json.dumps(ingredients))
f.close()
