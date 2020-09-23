/* eslint-disable no-console */
/// <reference path="../types.d.ts" />

const fs = require('fs');
const http = require('http');
const https = require('https');
const urlLib = require('url');
const path = require('path');
const parse5 = require('parse5');
const { getColors } = require('./getColors.js');

/**
 * @typedef {Object} P5Node
 * @prop {string} [nodeName]
 * @prop {string} [value]
 * @prop {P5Node[]} [childNodes]
 * @prop {string} [tagName] 
 * @prop {P5Attribute[]} [attrs] 
 *
 * @typedef {Object} P5Attribute
 * @prop {string} name
 * @prop {string} value
 *
 * @typedef {{[attribute: string]: Specifier|string}} Selector
 *
 * @typedef {Object} Specifier
 * @prop {string} [prefix]
 * @prop {string} [prefixNot]
 * @prop {string} [suffix]
 * @prop {string} [suffixNot]
 * @prop {string[]} [has]
 * @prop {string[]} [hasNot]
 */

const wikiRoots = [
    '/wiki/List_of_cocktails',
    '/wiki/IBA_Official_Cocktail',
    '/wiki/Category:Cocktails_with_vodka',
    '/wiki/Category:Cocktails_with_gin',
    '/wiki/Category:Cocktails_with_rum',
    '/wiki/Category:Cocktails_with_whisky'
];
const getTextBlocks = new Set(['div', 'p']);
const badStrings = [
    ', according to taste',
    ', etc.', ' etc.',
    'for a classic buck, deeper more complex cocktail',
    'for a neutral/sweet, dive bar style buck.',
    'Whole, raw '
];
const badUrls = [
    '/File:', '/Category:', '/Wikipedia:', '/Portal:', 'action=edit'
];

const ingredientHashes = [
    ['Vodka'],
    ['Tequila'],
    ['Sloe Gin'], ['Gin', 'gin\\[.\\]'],
    ['Yellow Chartreuse'], ['Green Chartreuse'], ['Chartreuse'],
    ['Benedictine', 'b.n.dictine'],

    ['Overproof Rum', '151[- ]*proof(ed)? rum', 'over[- ]*proof(ed)? rum'],
    ['Light Rum', 'white rum', 'light puerto rican rum', 'Malibu'],
    ['Dark Rum', 'black rum', 'gold(en)? rum'],
    ['Rum'],

    ['Scotch Whisky', 'scotch whiske?y', 'scotch'],
    ['Bourbon Whisky', 'bourbon whiske?y', 'bourbon'],
    ['Rye Whisky', 'rye whiske?y'],
    ['Tennessee Whisky', 'tennessee whiske?y', 'jack daniel\'s'],
    ['Whisky', 'whiske?y'],

    ['Red Vermouth', 'sweet vermouth', 'carpano'],
    ['Blanc Vermouth', 'dry vermouth', 'white vermouth'],
    ['Vermouth'],

    ['Apple Schnapps'], ['Peach Schnapps'],
    ['Apple Brandy', 'Calvados'],
    ['Apricot Brandy'], ['Cherry Brandy'], ['Peach Brandy'], ['Brandy'],

    ['Orange Bitters'], ['Peach Bitters'],
    ['Angostura Bitters', 'angostura bitters?', 'bitters'],

    ['Pisco'],
    ['Grappa', 'Ouzo'],
    ['Cachaca', 'cacha.a'],
    ['Cognac'],
    ['Campari'],
    
    ['Aperol'],
    ['Noilly Prat'],
    ['Kummel', 'k.mmel'],
    ['Schlichte'],
    ['Lillet'], ['Dubonnet'], ['Drambuie'], ['Frangelico'],
    ['Fernet Branca', 'Fernet[ -]Branca'],
    ['Elixir d\'Anu', 'elixir d.anu'],
    ['Jagermeister', 'Jägermeister'],
    ['Midori'],
    ['Hypnotiq', 'hpnotiq'],
    ['Southern Comfort'],
    ['Applejack'],

    ['Amaretto'],
    ['Galliano'],
    ['Elderflower Liqueur'],
    ['Cocoa Liqueur'],
    ['Cream Liqueur', 'amarula'],
    ['Anise Liqueur', 'herbsaint', 'sambuca', 'anisette', 'Absinthe'],
    ['Whiskey Liqueur', 'irish mist'],
    ['Maraschino Liqueur', 'maraschino'],
    ['Heering Liqueur', 'cherry heering'],
    ['Coffee Liqueur', 'kahl.a'],
    ['Passion Fruit Liqueur', 'passo.'],
    ['Blackberry Liqueur', 'cr.me de mure' ],
    ['Strawberry Liqueur', 'Fraise de Bois Liqueur' ],
    ['Raspberry Liqueur', 'Chambord' ],
    ['Orange Liqueur',
        'cura.ao', 'cointreau', 'grand marnier', 'triple sec' ],
    ['Irish Creme Liqueur', 'bailey\'?s', 'irish cream' ],
    ['Creme de Cacao', 'cr.me de cacao' ],
    ['Creme de Menthe', 'cr.me de menthe' ],
    ['Creme de Peche Liqueur', 'cr.me de peche liqueur'],
    ['Creme de Cassis', 'cr.me de cassis'],
    ['Creme de Noyaux', 'cr.me de noyaux'],

    ['Champagne'], ['White Wine'], ['Red Wine'],
    ['Port'], ['Sherry'], ['Prosecco'], ['Sake'],

    ['Ginger Ale'], ['Ginger Beer'],
    ['Cola', 'Coke', 'Coca-Cola'],
    ['Lemon-Lime Soda', 'lemon-lime', 'Sprite', '7[ -]Up', 'Mountain Dew'],
    ['Lemon Squash'],
    ['Red Bull'],
    ['Creme Soda'],
    ['Lime Soda'],
    ['Grapefruit Soda'],
    ['Carbonated Water', 'Soda Water', 'Club Soda', 'Club[ -]Mate',
        'sparkling water', 'seltzer', 'soft drink'],
    ['Tonic Water'],
    ['Mineral Water'],
    ['Rosewater'],
    ['Orange Flower Water'],
    ['Black Tea'],
    ['Stout'], ['Lager'], ['Cider'], ['Beer'],

    ['Coconut Cream', 'cream of coconut'],
    ['Cream'],
    ['Milk'],
    ['Half & Half'],
    ['Vanilla Extract', 'Vanilla'],
    ['Worcestershire'],
    ['Hot Sauce', 'Tabasco'],
    ['Orange Juice', 'juice of [^ ]+ oranges?', 'orange peel'],
    ['Grapefruit Juice', 'juice of [^ ]+ grapefruits?'],
    ['Lemon Juice', 'juice of [^ ]+ lemons?', 'lemonade'],
    ['Lime Juice', 'juice of [^ ]+ limes?', 'lime squeeze'],
    ['Passion Fruit Juice', 'juice of [^ ]+ passion fruits?'],
    ['Pineapple Juice', 'juice of [^ ]+ pineapples?'],
    ['Tomato Juice', 'juice of [^ ]+ tomato(?:es)?', 'clamato juice'],
    ['Guava Juice', 'juice of [^ ]+ guavas?'],
    ['Carrot Juice', 'juice of [^ ]+ carrots?'],
    ['Apple Juice', 'juice of [^ ]+ apples?'],
    ['Cranberry Juice'],
    ['Mint Leaves', 'mint leaf', 'mint sprig', 'sprigs? of( fresh)? mint',
        'sprig mint'],
    ['Fruit Juice', 'fruit juices?'],
    ['Simple Syrup or Sugar', 'simple syrup', 'gomme syrup', 'sugar cube',
        'sugar', 'honey'],
    ['Sour Mix'],
    ['Grenadine'],
    ['Strawberry Syrup'],
    ['Raspberry Syrup'],
    ['Passion Fruit Syrup'],
    ['Ginger Syrup'],
    ['Orgeat Syrup'],
    ['Guava Nectar'],
    ['Agave Nectar'],
    ['Orange Marmalade'],
    ['Falernum'],
    ['Orange', 'Orange Peel', 'Orange Slice', 'oranges'],
    ['Lime', 'Lime Peel', 'Lime Slice', 'limes'],
    ['Lemon', 'Lemon Peel', 'Lemon Slice', 'lemons'],
    ['Strawberry', 'strawberries' ],
    ['Peach'],
    ['Onion'],
    ['Chili Pepper'],
    ['Celery Stalk'],
    ['Spices', 'cinnamon', 'nutmeg', 'celery salt',
        'black pepper', 'salt', 'ground pepper'],
    ['Various Nuts', 'cashews?', 'peanuts?', 'walnuts?', 'pecans?'],
    ['Coffee Beans', 'Coffee Beans?', 'Espresso', 'Coffee'],
    ['Egg']
];

const ingredientGroups = [
    'Chartreuse',
    'Rum',
    'Whisky',
    'Vermouth',
    'Schnapps',
    'Brandy',
    'Bitters',
    'Wine',
    'Juice',
    'Syrup',
    'Nectar',
    'Liqueur'
];

const vesselHashes = [
    ['Pilsner Glass'],
    ['Shot Glass', 'a [a-z]+ glass and a shot glass'],
    ['Pint Glass'],
    ['Snifter'],
    ['Rocks Glass', 'old.fashioned'],
    ['Champagne Flute', 'champagne'],
    ['Highball Glass', 'Highballs'],
    ['Coupe Glass', 'Coupe'],
    ['Hurricane Glass', 'Poco Grande', 'Hurricane'],
    ['Mug', 'Coffee', 'Copper cup'],
    ['Bowl', 'bucket'],
    ['Margarita Glass'],
    ['Zombie Glass'],
    ['Collins Glass'],
    ['Wine Glass'],
    ['Cocktail Glass', 'Cocktail']
];

/** @type {{ [vesselHash: string]: number[] }} */
const vesselEmoji = {
    'Pilsner Glass': [ 0x1F37A ], // beer stein
    'Shot Glass': [ 0x1F376 ], // sake
    'Pint Glass': [ 0x1F37A ], // beer stein
    'Snifter': [ 0x1F379 ], // tropical drink
    'Rocks Glass': [ 0x1F943 ], // tumbler
    'Champagne Flute': [ 0x1F942 ], // champagne glasses
    'Highball Glass': [ 0x1F95B ], // glass of milk
    'Coupe Glass': [ 0x1F378 ], // cocktail glass
    'Hurricane Glass': [ 0x1F379 ], // tropical drink
    'Mug': [ 0x2615, 0xFE0F ], // coffee mug
    'Bowl': [ 0x1F963 ], // bowl
    'Margarita Glass': [ 0x1F379 ], // tropical drink
    'Zombie Glass': [ 0x1F379 ], // tropical drink
    'Collins Glass': [ 0x1F95B ], // glass of milk
    'Wine Glass': [ 0x1F377 ], // wine glass
    'Cocktail Glass': [ 0x1F378 ], // cocktail glass
    'default': [ 0x1F378 ] // cocktail glass
};

const ingredientTests = ingredientHashes.map(test => ({
    name: test[0],
    tests: test.map(x => new RegExp(
        '([()., [\\]/]|^)' + x + '([()., [\\]/]|$)',
        'i'
    )),
    matches: /** @type {Set<string>} */(new Set())
}));

const vesselTests = vesselHashes.map(test => ({
    name: test[0],
    tests: test.map(x => new RegExp(x, 'i')),
    matches: /** @type {Set<string>} */(new Set())
}));

const wikiPrefix = 'https://en.wikipedia.org';
const cachePath = path.join(__dirname, './cache.json');
const drinkPath = path.join(__dirname, './drinks.js');
const imagePath = path.join(__dirname, './images/');
/** @type {{[url: string]: string}} */
const cache = { };

/**
 * Writes a transient status message to the console.
 * @param {string} msg the message to write
 */
const status = msg => {
    const canReturn = Boolean(process.stdout.cursorTo);
    process.stdout.write(msg + (canReturn ? '' : '\n'));
    if (canReturn) { process.stdout.cursorTo(0); }
};

/**
 * Downloads some text from a given URL and returns the result.
 * @param {string} url the URL to download JSON from
 * @param {'GET'|'POST'} [type] the type of HTTP request this is
 * @param {{[key: string]: string}} [headers] extra headers to add
 * @return {Promise<string>} downloaded string, or null if invalid
 */
const downloadText = (url, type='GET', headers) => new Promise((yes, no) => {
    const urlParsed = new urlLib.URL(url);
    const get = urlParsed.protocol === 'https:' ? https.get : http.get;
    let data = '';

    const options = {
        hostname: urlParsed.hostname,
        port: urlParsed.port,
        path: urlParsed.pathname + (urlParsed.search || ''),
        method: type,
        headers: headers || { 'charset': 'UTF-8' }
    };

    get(options, response => {
        response.on('data', chunk => { data += chunk; });
        response.on('error', e => no(e));
        response.on('end', () => yes(data));
    });
});

/**
 * Downloads some text from a given URL (or pulls it from the cache) and
 * returns (and caches) the result.
 * @param {string} url the URL to download JSON from
 * @param {'GET'|'POST'} [type] the type of HTTP request this is
 * @param {{[key: string]: string}} [headers] extra headers to add
 * @return {Promise<string>} downloaded string, or null if invalid
 */
const downloadTextCached = async (url, type='GET', headers) => {
    // eslint-disable-next-line require-atomic-updates
    cache[url] = cache[url] || await downloadText(url, type, headers);
    return cache[url];
};

/**
 * Downloads an image, if it hasn't already been downloaded.
 * @param {string} url the URL to download the image from
 * @param {string} [prefix] if given, prefix the name with this
 * @param {string|undefined|null} [name] the name of the depicted drink
 * @return {Promise<string>} the name of the downloaded file
 */
const downloadImageCached = (url, prefix, name) => new Promise((yes, no) => {
    url = url.startsWith('//') ? 'https:' + url : url;

    const indexName = url.lastIndexOf('/') + 1;
    const indexDot = url.indexOf('.', indexName);
    const format = url.substring(url.lastIndexOf('.')).toLowerCase();

    const formattedName = (prefix || '')
        + (name || url.substring(indexName, indexDot))
            .toLowerCase()
            .normalize('NFD')
            .replace(/[^-_% \w]/g, '')
            .replace(/%\d+|\d+px/g, '-')
            .replace(/[-_ ]+/g, '-')
            .replace(/^-+|-+$/g, '')
        + format;

    const outPath = path.join(imagePath, formattedName);

    if (fs.existsSync(outPath)) {
        yes(formattedName);

    } else {
        const get = url.startsWith('https') ? https.get : http.get;
        const writeStream = fs.createWriteStream(outPath);
        get(url, response => {
            // @ts-ignore
            response.pipe(writeStream);
            writeStream.on('finish', () => {
                writeStream.close();
                yes(formattedName);
            });
        }).on('error', () => {
            no();
        });
    }
});

/**
 * @param {string} name
 * @param {P5Node|null|undefined} [node]
 * @return {string|null}
 */
const getAttribute = (name, node) => {
    const attr = node && node.attrs && node.attrs.find(x => x.name === name);
    return attr ? attr.value : null;
};

/**
 * Gets the full text content of a given node (including children).
 * @param {P5Node} node the node to get the text of
 * @return {string} the text value of the node
 */
const getText = (node) => {
    if (node.nodeName === '#text') {
        return node.value || '';
    } else if (node.tagName === 'br') {
        return '\n';
    }
    let text = '';
    for(const child of (node.childNodes || [])) {
        text += getText(child);
    }
    return text.trim() + (getTextBlocks.has(node.tagName || '') ? '\n' : '');
};

/**
 * Matches a given node against a selector, returning true if and only if all
 * aspects of the selector match against the node.
 * @param {P5Node} node a P5 Node to compare against a selector
 * @param {Selector} selector the selector to evaluate the P5 Node against
 * @return {boolean} true if `node` matches `selector`, false otherwise
 */
const matches = (node, selector) => {
    let doesMatch = true;

    for(const attr in selector) {
        const value = attr === 'tag'
            ? node.tagName || ''
            : getAttribute(attr, node) || '';

        const paddedValue = ' ' + value + ' ';

        const spec = selector[attr];
        if (typeof spec === 'string') {
            doesMatch = doesMatch && value === spec;
        } else {
            doesMatch = doesMatch
                && (!spec.prefix || value.startsWith(spec.prefix))
                && (!spec.suffix || value.endsWith(spec.suffix))
                && (!spec.prefixNot || !value.startsWith(spec.prefixNot))
                && (!spec.suffixNot || !value.endsWith(spec.suffixNot));

            for(const has of spec.has || []) {
                doesMatch = doesMatch && paddedValue.indexOf(has) >= 0;
            }
            for(const hasNot of spec.hasNot || []) {
                doesMatch = doesMatch && paddedValue.indexOf(hasNot) < 0;
            }
        }
    }

    return doesMatch;
};

/**
 * Selects all nodes in a given tree against a given selector, returning
 * a list of all nodes that match the selector.
 * @param {P5Node} node the root node to evaluate (along with all children)
 * @param {Selector} selector the selector to validate each node against
 * @param {P5Node[]} [results] the list in which to append all matching nodes
 * @return {P5Node[]} the list of nodes that match the selector
 */
const select = (node, selector, results=[]) => {
    if (matches(node, selector)) {
        results.push(node);
    }
    for(const child of (node.childNodes || [])) {
        select(child, selector, results);
    }
    return results;
};

/**
 * Hashes Wikipedia URLs. URLs that lead to the same page content generate
 * equivalent hashes (but URL hashes leading to other pages will not collide).
 * @param {string} url the URL to get a hash for
 * @return {string} a hash that collides with hashes for alias URLs
 */
const getUrlHash = url => url
    .toLowerCase()
    .replace(/#.*$/, '')
    .replace(/_\(?cocktail\)?$/, '')
    .replace(/_\(?mixed_drink\)?$/, '')
    .replace(/_\(?drink\)?$/, '');

/**
 * Hashes a line describing an ingredient into a generic ingredient name.
 * For example, both "1oz vodka" and "2 Tbsp vodka (chilled)" hash to "vodka".
 * @param {string} ingredient the ingredient description, with adjectives
 * @return {string[]} the generic ingredient name(s), with fewer adjectives
 */
const getIngredientHashes = ingredient => {
    ingredient = ingredient.replace(/\u00A0/g, ' ');
    /** @type {string[]} */
    const hashes = [];
    let remaining = ingredient;
    for(const ingredientTest of ingredientTests) {
        let testPassed = false;
        for(const test of ingredientTest.tests) {
            if (test.test(remaining)) {
                testPassed = true;
                ingredientTest.matches.add(ingredient);
                remaining = remaining.replace(test, '|');
            }
        }
        if (testPassed) {
            hashes.push(ingredientTest.name);
        }
    }
    return hashes;
};

/**
 * Hashes a line describing the vessel into a generic vessel name.
 * For example, both TODO FILL THIS
 * @param {string|undefined|null} vessel the vessel description to hash
 * @return {string|undefined} the hash (or `undefined` if there is none)
 */
const getVesselHash = vessel => {
    const passed = vesselTests.find(vesselTest => {
        return vessel && vesselTest.tests.some(regEx => regEx.test(vessel));
    });

    if (passed && vessel) {
        passed.matches.add(vessel);
        return passed.name;
    }

    return undefined;
};

/**
 * @param {P5Node} node
 * @param {string} url
 * @param {DrinkManifest} manifest
 * @return {DrinkManifest}
 */
const getDrinks = (node, url, manifest) => {
    const ingSplitter = /,\s*(?:and|or)?\s*|\n/;
    const tableSelector = { tag: 'table', class: { has: [' infobox '] } };
    const tables = select(node, tableSelector);
    let tableCount = -1;
    tables.forEach(table => {
        tableCount += 1;
        const caption = select(table, { tag: 'caption' });
        const name = caption[0] ? getText(caption[0]) : '';
        /** @type {Drink} */
        const drink = {
            name, url,
            isIba: false,
            ingredients: [ ],
            ingredientHashes: [ ],
            preparation: ''
        };

        const rows = select(table, { tag: 'tr' });
        for(const row of rows) {
            const childElements = (row.childNodes || [])
                .filter(child => !(child.nodeName || '').startsWith('#'));

            const title = childElements[0];
            const value = childElements[1];
            if (title && value) {
                const titleText = getText(title).toLowerCase();

                drink.isIba = drink.isIba
                    || titleText.includes('iba official')
                    || titleText.includes('iba specified');
                
                if (titleText.includes('ingredients')) {
                    const bullets = select(value, { tag: 'li' });
                    if (bullets.length === 0) {
                        const ingText = badStrings.reduce(
                            (text, badString) => text.replace(badString, ''),
                            getText(value));

                        if (ingText.includes(',') || ingText.includes('\n')) {
                            drink.ingredients = ingText.split(ingSplitter);
                        } else if (ingText.includes('and')) {
                            drink.ingredients = ingText.split(/\s+and\s+/);
                        } else {
                            drink.ingredients = [ ingText ];
                        }
                    } else {
                        drink.ingredients = bullets.map(li => getText(li));
                    }
                    drink.ingredients = drink.ingredients
                        .filter(str => str.trim() !== '');

                } else if (titleText.includes('preparation')) {
                    drink.preparation = getText(value);

                } else if (titleText.includes('drinkware')) {
                    drink.vessel = getText(value);
                    const vesselImg = select(value, { tag: 'img' })[0];
                    const vesselWikiUrl = getAttribute('src', vesselImg);
                    if (vesselWikiUrl) {
                        drink.vesselWikiUrl = vesselWikiUrl;
                    }

                } else if (titleText.includes('notes')) {
                    drink.notes = getText(value);

                } else if (titleText.includes('served')) {
                    drink.served = getText(value);

                } else if (titleText.includes('garnish')) {
                    drink.garnish = getText(value);
                }
            } else {
                const mainImg = select(row, { tag: 'img' })[0];
                const src = getAttribute('src', mainImg) || '';
                const isValid = !drink.imageWikiUrl
                    && src
                    && !src.endsWith('Dagger-14-plain.png');

                drink.imageWikiUrl = isValid ? src : drink.imageWikiUrl;
            }
        }

        const canAdd = name
            && !(name in manifest.nameToUrl)
            && drink.ingredients.length > 0
            && drink.preparation;

        if (canAdd) {
            manifest.nameToUrl[name] = url;
            manifest.drinks.push(drink);
        }
    });

    return manifest;
};

const main = async () => {
    try {
        const fileCache = JSON.parse(fs.readFileSync(cachePath).toString());
        Object.assign(cache, fileCache);
    } catch(e) { }

    /** @type {Set<string>} */
    const urls = new Set();
    /** @type {Set<string>} */
    const urlHashes = new Set();
    /** @type {DrinkManifest} */
    const manifest = {
        drinks: [],
        nameToUrl: {},
        ingredientHashes: ingredientHashes.map(hash => hash[0]).sort((a, b) => {
            const aGroup = ingredientGroups.find(group => a.endsWith(group));
            const bGroup = ingredientGroups.find(group => b.endsWith(group));
            const aPrefixed = aGroup ? aGroup + ' ' + a : a;
            const bPrefixed = bGroup ? bGroup + ' ' + b : b;
            return aPrefixed < bPrefixed ? -1 : (aPrefixed > bPrefixed ? 1 : 0);
        }),
        vesselHashes: vesselHashes.map(hash => hash[0]).sort(),
        vesselEmoji
    };

    const linkSelector = { tag: 'a', href: { prefix: '/', hasNot: badUrls } };

    console.log('Downloading roots...');
    for(const root of wikiRoots) {
        const html = await downloadTextCached(wikiPrefix + root);
        const dom = parse5.parse(html);

        select(dom, linkSelector).forEach(a => {
            const url = getAttribute('href', a) || '';
            const hash = getUrlHash(url);
            if (!urlHashes.has(hash)) {
                urls.add(url);
            }
            urlHashes.add(hash);
        });
    }
    console.log('Downloading pages...');
    const linksList = Array.from(urls);
    for(let i=0; i < linksList.length; i += 1) {
        status(`Downloading page ${i+1} of ${linksList.length}...     `);
        const url = wikiPrefix + linksList[i];
        const html = await downloadTextCached(url);
        const dom = parse5.parse(html);
        getDrinks(dom, url, manifest);
    }

    console.log('Hashing Ingredients...                    ');
    for(const drink of manifest.drinks) {
        for(const ing of drink.ingredients) {
            drink.ingredientHashes.push(getIngredientHashes(ing));
        }
    }
    for(const drink of manifest.drinks) {
        drink.vesselHash = getVesselHash(drink.vessel);
    }

    console.log('Downloading images...');
    try { fs.mkdirSync(imagePath); } catch(e) { }
    for(let i = 0; i < manifest.drinks.length; i += 1) {
        status(`Downloading image ${i+1} of ${manifest.drinks.length}...    `);
        const drink = manifest.drinks[i];
        const vessel = drink.vesselWikiUrl;
        const image = drink.imageWikiUrl;
        if (vessel) {
            drink.vesselUrl = await downloadImageCached(vessel, 'vessel-');
        }
        if (image) {
            drink.imageUrl = await downloadImageCached(image, '', drink.name);
            const drinkImagePath = path.join(imagePath, drink.imageUrl);
            drink.imageColors = getColors(drinkImagePath) || undefined;
        }
    }

    // DEMO CODE TO PRINT ALL INGREDIENTS AND THEIR HASHES
    ///** @type {{[name: string]: string[]}} */
    //const nameToMatches = { };
    //for(const test of ingredientTests) {
    //    nameToMatches[test.name] = nameToMatches[test.name] || [];
    //    nameToMatches[test.name].push(...Array.from(test.matches));
    //}
    //for(const name in nameToMatches) {
    //    const matches = nameToMatches[name];
    //    console.log(`\n==== ${name} ====\n${matches.join('\n')}`);
    //}
    
    // DEMO CODE TO PRINT ALL NON-HASHING INGREDIENTS
    //for(const drink of manifest.drinks) {
    //    for(let i=0; i < drink.ingredients.length; i += 1) {
    //        if (drink.ingredientHashes[i].length === 0) {
    //            console.log(drink.ingredients[i] + `   (of ${drink.name})`);
    //        }
    //    }
    //}

    console.log('Writing cache and drinks...                    ');
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, '  '));
    fs.writeFileSync(drinkPath, ''
        + '/* eslint-disable quotes,max-len,indent */\n'
        + '/// <reference path="../types.d.ts" />\n'
        + '/** @type {DrinkManifest} */\n'
        + 'export const manifest = '
        + JSON.stringify(manifest, null, '  ')
        + ';');

    console.log('Done!');
};

main();
