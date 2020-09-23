/**
 * @typedef {import('./dispatcher.js').Dispatcher} Dispatcher
 * @typedef {import('../lib/snabbdom/vnode').VNode} VNode
 *
 * @typedef {{[drinkHash: string]: boolean}} IngredientManifest
 */

/**
 * Gets the UI displaying all ingredients.
 * @param {Dispatcher} dispatcher the dispatcher delegating all events
 * @param {string[]} ingredientHashes a list of all ingredient hashes
 * @param {IngredientManifest} have a map of ingredients owned => true
 * @return {VNode} the ingredient list UI
 */
export const uiShelf = (dispatcher, ingredientHashes, have) => {
    const h = dispatcher.h;

    return h('ul', { className: 'shelf' }, ingredientHashes.map(hash => {
        const className = 'shelf-item ' + (have[hash] ? 'is-had' : '');
        return h('li', { className }, [
            h('label', { }, [
                h('input', {
                    type: 'checkbox',
                    onChange: ev => {
                        have[hash] = Boolean(ev.target && ev.target.checked);
                    }
                }, []),
                hash
            ])
        ]);
    }));
};
