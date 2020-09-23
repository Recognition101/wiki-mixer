/// <reference path="../types.d.ts" />
import { manifest } from '../data/drinks.js';
import { startDispatch, $$ } from './dispatcher.js';
import { segmentedControl, reset as scReset } from './segmentedControl.js';
import { uiDrinks } from './drinks.js';
import { uiShelf } from './shelf.js';
import { preUpdate as preUpdateFilter, filterDrinks, uiFilters }
    from './filter.js';

// Types

/**
 * @template T
 * @typedef {import("./segmentedControl.js").Chooser<T>} Chooser
 */

/**
 * @typedef {import('./dispatcher.js').Dispatcher} Dispatcher
 * @typedef {import('../lib/snabbdom/vnode').VNode} VNode
 * @typedef {import('./filter.js').Filter} Filter
 * @typedef {import('./shelf.js').IngredientManifest} IngredientManifest
 *
 * @typedef {'shelf'|'drinks'|'filter'} UiMode Each main-panels type
 * @typedef {typeof rootData.filters} FilterData Data for the filter panel
 * @typedef {{x: number, y: number, h: number}} ViewportState a structure
 *      describing a snapshot of the viewport rectangle dimensions
 */

/**
 * This is a list of all viewports. JS will use this to automatically add a
 * `viewport-${name}` class to the body corresponding with the browser's width
 * being constrained between `min` and `max`.
 */
const viewports = [
    { name: 'small', min: 0, max: 410 }
];

/**
 * An enumeration of all local-storage key names.
 */
const localKeys = {
    have: 'wikimixer.have',
    filters: 'wikimixer.filters'
};

/**
 * All elements the app creates or modifies will be within this element.
 */
const anchor = document.getElementById('anchor') || document.body;

/**
 * All user-mutable data is kept within this object.
 */
const rootData = {
    viewport: '',

    localStorageTimerId: 0,

    tabs: {
        /** @type {Chooser<UiMode>} */
        mode: {
            value: /** @type {UiMode} */('drinks'),
            index: 0,
            options: [ {
                text: 'Drinks',
                value: /** @type {UiMode} */('drinks')
            }, {
                text: 'Ingredients',
                value: /** @type {UiMode} */('shelf')
            }, {
                text: 'Filter',
                value: /** @type {UiMode} */('filter')
            } ]
        },
        oldValue: /** @type {UiMode} */('drinks'),
        oldIndex: 0,
        scrolls: /** @type {ViewportState[]} */([ ])
    },

    /** @type {DrinkManifestUi} */
    drinks: manifest,

    /** @type {IngredientManifest} */
    have: { },

    filters: {
        maxId: 1,
        list: /** @type {Filter[]} */([ ])
    }
};

// @ts-ignore
window.rootData = rootData; // For debug purposes

// Read rootData from Local Storage
try {
    const haveJson = (window.localStorage.getItem(localKeys.have));
    if (haveJson) {
        const have = /** @type {IngredientManifest} */(JSON.parse(haveJson));
        rootData.have = have;
    }

    const filtersJson = (window.localStorage.getItem(localKeys.filters));
    if (filtersJson) {
        const filters = /** @type {FilterData} */(JSON.parse(filtersJson));
        rootData.filters = filters;
    }

} catch(e) { }


/**
 * Writes the user-mutable parts of the data tree to local storage.
 * @param {typeof rootData} data the root data, pieces of which we will write
 */
const saveToLocalStorage = (data) => {
    try {
        const haveJson = JSON.stringify(data.have);
        const filtersJson = JSON.stringify(data.filters);

        window.localStorage.setItem(localKeys.have, haveJson);
        window.localStorage.setItem(localKeys.filters, filtersJson);
    } catch(e) { }
};

// Remove the loading screen
const loadingDom = $$('#loading')[0];
if (loadingDom) {
    loadingDom.remove();
}

// Insert the application DOM and start the dispatch loop
startDispatch(document.body, rootData, (dispatcher, data) => {
    const h = dispatcher.h;

    preUpdateFilter(data.filters);

    // Filter Drinks
    const totalPassed = filterDrinks(data.drinks.drinks, data.filters.list);
    const optionFilter = data.tabs.mode.options.find(x => x.value === 'filter');
    if (optionFilter) {
        optionFilter.text = `Filter (${totalPassed})`;
    }

    // Update viewport
    const setupViewport = () => {
        const width = window.innerWidth;
        const oldViewport = rootData.viewport || 'default';

        rootData.viewport = 'default';
        for(const viewport of viewports) {
            if (width > viewport.min && width <= viewport.max ) {
                rootData.viewport = viewport.name;
            }
        }
        const didChange = rootData.viewport !== oldViewport;

        if (didChange) {
            document.body.classList.remove('viewport-' + oldViewport);
            document.body.classList.add('viewport-' + rootData.viewport);
            scReset(data.tabs.mode);
        }
        return didChange;
    };

    if (!data.viewport) {
        setupViewport();
    }

    // Save To Local Storage (Long Debounce)
    window.clearTimeout(data.localStorageTimerId);
    const saveRootData = saveToLocalStorage.bind(null, data);
    data.localStorageTimerId = window.setTimeout(saveRootData, 2000);

    // Tab UI: Handles switching between panels
    const { oldValue, oldIndex } = data.tabs;
    const { value, index, options } = data.tabs.mode;

    if (oldValue !== value) {
        const scrolls = data.tabs.scrolls;
        scrolls[oldIndex] = scrolls[oldIndex] || { x: 0, y: 0, h: 0 };
        scrolls[oldIndex].x = window.scrollX;
        scrolls[oldIndex].y = window.scrollY;
        scrolls[oldIndex].h = document.body.offsetHeight;

        const newScroll = scrolls[index];
        if (newScroll) {
            document.body.style.height = newScroll.h + 'px';
            window.scrollTo(newScroll.x, newScroll.y);
            window.setTimeout(() => { document.body.style.height = ''; }, 1);
        } else {
            window.scrollTo(0, 0);
        }
    }

    data.tabs.oldValue = value;
    data.tabs.oldIndex = index;

    // Panel UI: Display the panels themselves (when showing)
    const panelChildren = [
        uiDrinks(dispatcher, data.drinks, data.have),
        uiShelf(dispatcher, data.drinks.ingredientHashes, data.have),
        uiFilters(
            dispatcher,
            data.filters,
            data.drinks.ingredientHashes,
            data.drinks.vesselHashes)
    ];

    const panels = panelChildren.map((panel, i) =>
        h('div', {
            className: 'panel panel-' + options[i].value
                + (i === index ? ' shown' : '')
        }, [ panel ])
    );

    return h('div', { className: 'root', onRootResize: setupViewport }, [
        h('nav', { className: 'modes' }, [
            segmentedControl(dispatcher, data.tabs.mode),
        ]),
        ...panels
    ]);
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('../cache-worker.js');
}
