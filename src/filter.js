
/**
 * @typedef {import('./dispatcher.js').Dispatcher} Dispatcher
 * @typedef {import('../lib/snabbdom/vnode').VNode} VNode
 * @typedef {import('./main.js').FilterData} FilterData
 *
 * @typedef {['ingredient', 'vessel', 'filter', 'remove']} FilterTypeList a list
 *  of every valid filter property type
 * @typedef {FilterTypeList[number]} FilterType a filter property types enum
 *
 * @typedef {Object} FilterProperty a single property to match a drink with
 * @prop {FilterType} type filter within this category
 * @prop {string} value we make sure the category includes this value
 * @prop {number} id the unique (among siblings) identifier of this property
 *
 * @typedef {Object} Filter The filter itself, containing all properties
 * @prop {number} id the unique identifier for this particular filter
 * @prop {string} name the user-friendly (non-unique) name of this filter
 * @prop {boolean} isAll true if we match all properties, false if we match any
 * @prop {boolean} isEnabled if true, apply this filter to the drinks
 * @prop {number} maxId a number larger than all `properties[number].id` values
 * @prop {FilterProperty[]} properties to pass the filter, each drink must
 *      have all/any of these properties
 *
 * @typedef {Object} FilterOptions the options that make a filter drop-down
 * @prop {string[]} ingredients all ingredients that can be chosen from
 * @prop {string[]} vessels all vessels that can be chosen from
 * @prop {Filter[]} filters all filters that can be chosen from
 *
 * @typedef {{[key in FilterType]: string}} FilterTypeNameMap maps filter
 *  types to their user-friendly names
 * @typedef {{[key: string]: FilterType}} FilterTypeMap maps filter type
 *  strings => actual enum values
 * @typedef {{[id: string]: Filter}} FilterIdMap maps filter ID => filter
 */

/** @type {FilterTypeList} */
const filterTypes = [ 'ingredient', 'vessel', 'filter', 'remove' ];

/** @type {FilterTypeNameMap} */
const filterTypeNames = {
    'ingredient': 'Ingredient',
    'vessel': 'Vessel',
    'filter': 'Filter',
    'remove': 'Delete This'
};

/** @type {FilterTypeMap} */
const filterTypeMap = { };
for(const type of filterTypes) { filterTypeMap[type] = type; }

/**
 * Filters an array in-place without creating any new arrays.
 * @template T the type of the list we are filtering
 * @param {T[]} list the list we are filtering items out of
 * @param {(item: T, index?: number)=>boolean} filter if false, delete the item
 */
const filterInPlace = (list, filter) => {
    for(let i = 0; i < list.length; i += 1) {
        if (!filter(list[i], i)) {
            list.splice(i, 1);
            i -= 1;
        }
    }
};

/**
 * Adds a new, empty filter to a given collection of filters.
 * @param {FilterData} filterData the collection of filters to add to
 */
const addFilter = (filterData) => {
    const filter = {
        id: filterData.maxId,
        isEnabled: true,
        maxId: 0,
        name: '',
        isAll: true,
        properties: []
    };
    filterData.list.push(filter);
    filterData.maxId += 1;
};

/**
 * Given a drink and a filter, check if `drink` passes `filter`.
 * @param {Drink} drink the drink to test with a given filter
 * @param {Filter} filter the filter to apply to the drink
 * @param {Filter[]} filters the list of filters we may recursively call
 * @param {Set<number>} [filterStack] filter ids already recursively called
 * @return {boolean} true if filter accepts the drink, false if it rejects
 */
const filterDrink = (drink, filter, filters, filterStack = new Set()) => {
    let result = Boolean(filter.isAll);
    filterStack.add(filter.id);

    for(const property of filter.properties) {
        const { type, value } = property;
        const isFilter = type === 'filter';
        const filterId = isFilter ? parseInt(value, 10) : 0;
        const filterSub = isFilter && filters.find(sub => sub.id === filterId);
        const filterSeen = filterStack.has(filterId);

        if (value && type !== 'remove' && !(isFilter && !filterSub)) {
            const subResult = Boolean(
                (type === 'ingredient'
                    && drink.ingredientHashes.some(
                        hashes => hashes.some(hash => value === hash)))

                || (type === 'vessel'
                    && drink.vesselHash === value)

                || (type === 'filter'
                    && filterSub 
                    && !filterSeen
                    && filterDrink(drink, filterSub, filters, filterStack))
                || (type === 'filter'
                    && filterSeen)
            );

            result = filter.isAll
                ? (result && subResult)
                : (result || subResult);
        }
    }

    return result;
};

/**
 * Applies a list of filters to each drink in a list, setting each drink's
 * `isRejected` property to match the result.
 * @param {Drink[]} drinks the list of drinks to apply filters to
 * @param {Filter[]} filters the list of filters to apply to all drinks
 * @return {number} the total number of drinks that passed the filters
 */
export const filterDrinks = (drinks, filters) => {
    return drinks.reduce((totalPassed, drink) => {
        drink.isRejected = filters.some(
            filter => filter.isEnabled && !filterDrink(drink, filter, filters));

        return totalPassed + (drink.isRejected ? 0 : 1);
    }, 0);
};

/**
 * The pre-update function validates and cleans a FilterData structure, and
 * must be run just prior to each UI update.
 * @param {FilterData} filters the filter collection to validate
 */
export const preUpdate = (filters) => {
    // Get a mapping of (filter ID => filter)
    const filterIdMap = /** @type {FilterIdMap} */({ });
    for(const filter of filters.list) {
        filterIdMap[filter.id] = filter;
    }

    // Ensure there is always at least one filter
    if (filters.list.length === 0) {
        addFilter(filters);
    }

    // Clean up filter properties for each filter
    for(const filter of filters.list) {
        // Remove properties that are: "remove"-type or broken "filter"-types
        filterInPlace(filter.properties, ({ type, value }) => 
            type !== 'remove'
            && (type !== 'filter' || !value || !!filterIdMap[value]));

        // Make sure each filter has a trailing "None"-value property
        const lastProperty = filter.properties[filter.properties.length - 1];
        if (!lastProperty || lastProperty.value) {
            filter.properties.push({
                id: filter.maxId,
                type: 'ingredient',
                value: ''
            });
            filter.maxId += 1;
        }
    }
};

/**
 * Given a string, convert it into the FilterType enumeration.
 * @param {string} str the string to convert
 * @return {FilterType} the filter type represented by the strong
 */
const getFilterType = str => filterTypeMap[str] || 'ingredient';

/**
 * Gets the UI for a filter property selection.
 * @param {Dispatcher} dispatcher the dispatcher delegating all events
 * @param {FilterProperty} property the property this UI controls
 * @param {FilterOptions} options all values to choose from presented in the UI
 * @return {VNode|null} the ui for choosing a filter property
 */
const uiFilterSelect = (dispatcher, property, options) => {
    const h = dispatcher.h;
    const { type, value } = property;
    const { ingredients, vessels, filters } = options;

    const optionNodes = (
        type === 'ingredient' ? ingredients.map(ingredient =>
            h('option', {
                value: ingredient,
                selected: ingredient === value || undefined
            }, [ ingredient ])) :

        type === 'vessel' ? vessels.map(vessel =>
            h('option', {
                value: vessel,
                selected: vessel === value || undefined
            }, [ vessel ]) ) :

        type === 'filter' ? filters.map(filter =>
            h('option', {
                value: filter.id.toString(),
                selected: filter.id.toString() === value || undefined
            }, [ `#${filter.id} - ${filter.name}` ])) :

        []);

    optionNodes.unshift(h('option', {
        value: '',
        selected: value === '' || undefined
    }, [ 'None' ]));

    return h('span', { className: 'filter-property' }, [
        h('select', {
            onChange: ev => {
                property.type = getFilterType(ev.target.value);
                property.value = '';
            }
        }, filterTypes.map((typeOption) =>
            filterTypeNames[typeOption]
                ? h('option', {
                    value: typeOption,
                    selected: typeOption === type || undefined
                }, [
                    filterTypeNames[typeOption]
                ])
                : undefined
        )),

        h('select',
            { onChange: ev => { property.value = ev.target.value; } },
            optionNodes)
    ]);
};

/**
 * Gets the UI for a single filter (composed of many properties).
 * @param {Dispatcher} dispatcher the dispatcher delegating all events
 * @param {Filter} filter the filter to get a UI for
 * @param {Filter[]} filters the list of all filters (in case we must delete)
 * @param {FilterOptions} options all property values the user chooses from
 */
const uiFilter = (dispatcher, filter, filters, options) => {
    const h = dispatcher.h;

    const isAll = filter.isAll || undefined;
    const isAny = !filter.isAll || undefined;

    return h('div', { className: 'filter-block' }, [
        h('div', { className: 'filter-title' }, [
            h('h3', { }, [ '#' + filter.id + ' - ' ]),
            h('input', {
                type: 'text',
                placeholder: 'Type Name Here',
                maxLength: 30,
                value: filter.name,
                onInput: ev => {
                    const target = /** @type {HTMLInputElement} */(ev.target);
                    filter.name = target.value || 'Default Name';
                }
            }, [ ]),
            h('button', {
                className: 'filter-delete',
                onClick: () => {
                    const question = 'Are you sure you want to delete '
                        + `Filter #${filter.id} - ${filter.name}`;
                    if (window.confirm(question)) {
                        filterInPlace(filters, other => other.id !== filter.id);
                    }
                }
            }, [ '\u232b' ]) // u2326 for right arrow
        ]),
        h('label', { className: 'filter-enabled' }, [
            'Enabled:',
            h('input', {
                type: 'checkbox',
                checked: filter.isEnabled || undefined,
                onChange: ev => { filter.isEnabled = !!ev.target.checked; }
            }, [])
        ]),
        h('div', { className: 'filter-match' }, [
            'Match ',
            h('select', {
                onChange: ev => { filter.isAll = ev.target.value === 'all'; }
            }, [
                h('option', { value: 'all', selected: isAll }, ['All']),
                h('option', { value: 'any', selected: isAny }, ['Any'])
            ]),
            ' of These:',
        ]),
        h('ul', { }, filter.properties.map(property =>
            h('li', {
                key: property.id.toString()
            }, [
                uiFilterSelect(dispatcher, property, options)
            ]))
        )
    ]);
};

/**
 * Gets the UI for the list of all filters the user has created.
 * @param {Dispatcher} dispatcher the dispatcher delegating all events
 * @param {FilterData} filterData the data describing all created filters
 * @param {string[]} ingredients a list of all ingredients that can be filtered
 * @param {string[]} vessels a list of all vessels that can be filtered
 */
export const uiFilters = (dispatcher, filterData, ingredients, vessels) => {
    const h = dispatcher.h;
    const filters = filterData.list;

    const clearFilters = () => {
        if (window.confirm('Are you sure you want to delete ALL filters?')) {
            filters.length = 0;
            filterData.maxId = 1;
        }
    };

    const options = { ingredients, vessels, filters };

    const addFilterBound = addFilter.bind(this, filterData);

    const filterControls = h('li',
        {
            className: 'filter-controls',
            key: '--controls--'
        }, [
            h('button', { onClick: addFilterBound }, [ '+ New Filter' ]),
            h('button', { onClick: clearFilters }, [ '\u2326 Filters' ])
        ]);

    const filterListItems = filters.map(filter => h(
        'li',
        { key: filter.id },
        [ uiFilter(dispatcher, filter, filters, options) ]));

    filterListItems.push(filterControls);

    return h('div', { className: 'filters' }, [
        h('ul', { className: 'filter-grid' }, filterListItems)
    ]);
};

