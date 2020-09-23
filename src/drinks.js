
/**
 * @typedef {import('./dispatcher.js').Dispatcher} Dispatcher
 * @typedef {import('../lib/snabbdom/vnode').VNode} VNode
 * @typedef {import('./shelf.js').IngredientManifest} IngredientManifest
 */

const imagePrefix = './data/images/';

/**
 * Gets the number of owned ingredients in a given drink.
 * @param {Drink} drink the drink to analyze
 * @param {IngredientManifest} have the map of all owned ingredient hashes
 * @return {number} the number of ingredients owned in `drink`
 */
const countIngredients = (drink, have) => {
    let owned = 0;
    for(const hashSet of drink.ingredientHashes) {
        let haveHash = false;
        for(const hash of hashSet) {
            haveHash = haveHash || have[hash];
        }
        owned += haveHash ? 1 : 0;
    }
    return owned;
};

/**
 * Gets the virtual nodes used for displaying the UI of a single drink.
 * @param {Dispatcher} dispatcher the dispatcher delegating all events
 * @param {DrinkManifestUi} drinkManifest the data describing all drinks
 * @param {DrinkUi} drink the data describing the single drink to get UI for
 * @param {IngredientManifest} have a mapping of ingredients we have => true
 */
const uiDrink = (dispatcher, drinkManifest, drink, have) => {
    const h = dispatcher.h;
    const key = drink.url + ' :: ' + drink.name;
    const colors = drink.imageColors;

    const emojiCode = drinkManifest.vesselEmoji[drink.vesselHash || '']
        || drinkManifest.vesselEmoji['default']
        || [ 0x1F378 ]; // cocktail

    const emoji = emojiCode.map(c => String.fromCodePoint(c)).join('');

    let background = /** @type {string|undefined} */(undefined);
    if (colors) {
        const rgb = colors.map(color => `rgb(${color.join(', ')})`);
        const c1 = 'circle at 0% 100%';
        const c2 = 'circle at 100% 0%';
        background = `radial-gradient(${c1}, ${rgb[2]}, transparent 50%), `
            + `radial-gradient(${c2}, ${rgb[3]}, transparent 50%), `
            + `linear-gradient(45deg, ${rgb[0]}, ${rgb[1]})`;
    }

    const className = 'drink'
        + (drink.isRejected ? ' drink-rejected' : '');

    return h('li', { className, key }, [
        drink.imageUrl
            ? h('div', { className: 'drink-image', style: { background } }, [
                h('img', { src: imagePrefix + drink.imageUrl }, [])
            ])
            : h('div', { className: 'drink-image-empty' }, [ emoji ]),

        h('h3', { }, [ drink.name ]),

        h('div', { className: 'metadata-small' }, [
            h('a', { href: drink.url }, [ '(Link)' ]),
            drink.isIba
                ?  h('span', { className: 'iba' }, [ 'IBA' ])
                : null,
            drink.vesselUrl || drink.vessel ?
                h(drink.vesselUrl ? 'img' : 'div', {
                    className: 'vessel',
                    src: drink.vesselUrl
                        ? imagePrefix + drink.vesselUrl
                        : undefined,
                    onClick: () => {
                        alert('Vessel: ' + (drink.vessel || ''));
                        return false;
                    }
                }, drink.vessel ? [ '(Vessel)' ] : []) : null,

        ]),
        h('ul', { className: 'ingredients' }, drink.ingredients.map(
            (text, i) => h('li', {
                className: (drink.ingredientHashes[i] || [])
                    .some(hash => have[hash])
                    ? 'present'
                    : 'missing'
            }, [ text ])
        )),
        h('p', { className: 'preparation' }, [ drink.preparation ]),
        h('dl', { className: 'metadata-large' }, [
            drink.served ? h('dt', { }, [ 'Served:' ]) : null,
            drink.served ? h('dd', { }, [ drink.served ]) : null,

            drink.garnish ? h('dt', { }, [ 'Garnish:' ]) : null,
            drink.garnish ? h('dd', { }, [ drink.garnish ]) : null,

            drink.notes ? h('dt', { }, [ 'Notes:' ]) : null,
            drink.notes ? h('dd', { }, [ drink.notes ]) : null
        ])
    ]);
};

/**
 * Gets the UI for a list of all drinks. It also handles sorting the drinks.
 * @param {Dispatcher} dispatcher the dispatcher delegating all events
 * @param {DrinkManifestUi} drinkManifest the manifest of all drink data
 * @param {IngredientManifest} have a mapping of ingredients we have => true
 * @return {VNode} the UI for the list of drinks
 */
export const uiDrinks = (dispatcher, drinkManifest, have) => {
    const h = dispatcher.h;
    
    drinkManifest.drinks.sort((a, b) => {
        const haveA = countIngredients(a, have);
        const haveB = countIngredients(b, have);
        const countA = a.ingredientHashes.length;
        const countB = b.ingredientHashes.length;

        return ((haveB === countB ? 1 : 0) - (haveA === countA ? 1 : 0))
            || Math.round(((haveB / countB) - (haveA / countA)) * 1000)
            || ((b.isIba ? 1 : 0) - (a.isIba ? 1 : 0))
            || (b.name < a.name ? 1 : -1);
    });

    return h('ul', { className: 'drinks' }, drinkManifest.drinks.map(drink =>
        uiDrink(dispatcher, drinkManifest, drink, have)
    ));
};

