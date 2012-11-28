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


def stripTags(myStr):
    return re.sub('<[^>]*>', '', myStr)

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
                 "|pint|dash|sprig|cl|ml|shot|part|drop|oz|ounce" + \
                 "|millilitres)" + \
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
        "baileys": "irish cream (baileys)",
        "irish cream": "irish cream (baileys)",
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
        "whiskey (canadian rye)": "whiskey (canadian)",
        "whiskey (scotch or rye)": "whiskey (scotch)",
        "wine (brut champagne or other dry sparkling)": "wine (dry sparkling)",
        "wine (dry white)": "wine (white)",
        "creme de cacao": "creme de cacao (white)",
        "gin, not no bathtub stuff; london dry or genever (good)": "gin",
        "gin (one or two handles)": "gin",
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
        "chilled carbonated water": "tonic water",
        "vermouth (sweet)": "vermouth (sweet red)"
    }
    if ing in specialCases:
        ing = specialCases[ing]

    return ing.lower()

nameToHtml = {}
for drink in data:
    ingList = re.findall("<th.*?ingredients.*?<ul[^>]*>(.*?)</ul",
                         drink["htmlClean"], reOpts)

    ibaIngList = re.findall("<th.*?specified ingredients.*?<ul[^>]*>(.*?)</ul",
                         drink["htmlClean"], reOpts)

    if len(ibaIngList) > 0:
        ingList = ibaIngList

    #ensure drink has ingredients
    if len(ingList) < 1:
        print("WARNING: Drink being discarded due to lack of ingredients: %s" %
                drink["name"])
    else:
        name = drink["name"]
        html = drink["htmlClean"]

        #ensure we don't already have that drink
        if name in optiData and html != nameToHtml[name]:
            print("WARNING: Collapsing two different recipes: %s" %
                    drink["name"])

        elif not name in optiData:
            nameToHtml[name] = html

            #get the list of ingredients
            ings = re.findall("<li[^>]*>(.*?)</li", ingList[0], reOpts)
            ingList = []
            for ing in ings:
                ing = re.sub("<[^>]*>", "", ing)
                oldIng = ing
                ing = sanitizeIngredient(ing)
                if ing not in ingredients:
                    ingredients[ing] = []
                ingredients[ing].append(name)
                if ing == "":
                    print("WARNING: Ingredient %s compressed into \"\"" %
                            oldIng)
                else:
                    ingList.append({"name": oldIng, "id": ing})

            #get assets
            def makeAsset(content, isHidden, img=None):
                ret = {
                    "txt": content,
                    "cls": "hideRow" if isHidden else ""
                }
                if img is not None:
                    ret["img"] = img

                return ret

            def arr0Str(arr):
                return arr[0] if len(arr) > 0 else ""

            pic = re.findall(
                r"""<t[hd][^>]*?colspan[\s='"]*2[^>]*>[\s\n]*""" +
                 """(?:<a[^>]*>)?[\s\n]*<img[^>]*?src[\s='"]*([^'"]*)""",
                html, reOpts)
            pic = arr0Str(pic)
            pic = makeAsset(pic, pic == "")

            served = re.findall(r"served\s*</th>[\s\n]*<td[^>]*>(.*?)</td>",
                    html, reOpts)
            served = stripTags(arr0Str(served))
            served = makeAsset(served, served == "")

            garnish = re.findall(r"garnish\s*</th>[\s\n]*<td[^>]*>(.*?)</td>",
                    html, reOpts)
            garnish = arr0Str(garnish)
            garnishLi = re.findall(r"<li[^>]*>(.*?)</li>", garnish, reOpts)
            garnish = garnishLi if len(garnishLi) > 0 else [garnish]
            garnish = makeAsset(garnish, garnish[0] == "")

            glass = re.findall(r"drinkware\s*</th>[\s\n]*<td[^>]*>(.*?)</td>",
                    html, reOpts)
            glass = arr0Str(glass)
            glassTxt = stripTags(glass).strip()
            glassImg = re.findall(r"""<img[^>]*?src[\s='"]*(.*?)['"]""",
                    glass, reOpts)
            glassImg = glassImg if len(glassImg) > 0 else None
            glass = makeAsset(glassTxt, glassTxt == "", glassImg)

            prep = re.findall(r"preparation\s*</th>[\s\n]*<td[^>]*>(.*?)</td>",
                    html, reOpts)
            prep = arr0Str(prep)
            prep = makeAsset(prep, prep == "")

            isIba = drink["htmlClean"].lower().find(
                    "iba official cocktail") >= 0

            optiData[drink["name"]] = {
                "name": name,
                "baseName": drink["baseName"],
                "url": drink["url"],
                "pic": pic,
                "serve": served,
                "garnish": garnish,
                "glass": glass,
                "prep": prep,
                "ibaCls": "iba" if isIba else "",
                "ingredients": ingList
            }

f = open(optiDataFile, 'w')
f.write("mix.data.drinks=" + json.dumps(optiData) + ";")
f.close()

f = open(ingDataFile, 'w')
f.write("mix.data.ingredients=" + json.dumps(ingredients))
f.close()
