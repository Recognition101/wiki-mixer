import {
    snabbdomInit,
    snabbdomAttributes,
    snabbdomProps,
    snabbdomClass,
    snabbdomStyle,
    snabbdomDataset,
    snabbdomJsx
} from './lib/lib.js';

/**
 * @typedef {import('snabbdom').VNode} VNode
 * @typedef {import('snabbdom').VNodeData} VNodeData
 * @typedef {import('../types').EventLike} EventLike
 *
 * @typedef {ReturnType<startDispatch>} Dispatcher
 */
/**
 * @template {keyof HTMLElementTagNameMap} T
 * @typedef {import('../types').HtmlAttributeSet<T>} HtmlAttributeSet
 */
/**
 * @template {keyof HTMLElementTagNameMap} T
 * @typedef {import('../types').HtmlOptions<T>} HtmlOptions
 */

const patch = snabbdomInit([
    snabbdomAttributes,
    snabbdomProps,
    snabbdomClass,
    snabbdomStyle,
    snabbdomDataset
]);

const evKeyPrefix = 'ev-';
const evKeyRootPrefix = 'ev-root-';

/**
 * Gets all children of a given element matching a given selector.
 * @param {string} sel the selector to match all children against
 * @param {Element} [root] children of this element will be matched (if none
 *  given, `document` will be used).
 * @return {HTMLElement[]} an array of matching children
 */
export const $$ = (sel, root) =>
    Array.from((root || document).querySelectorAll(sel));

/**
 * Forces a value to be in an array if and only if it is not already an array.
 * @template T the type of the value / array elements
 * @param {Array<T>|T} x the value (or array of values)
 * @return {Array<T>} an array of values
 */
const boxArray = x => Array.isArray(x) ? x : [ x ];

/**
 * Converts any type of value into something we can store in an attribute.
 * @param {any} x the value to convert
 * @return {string|number|boolean} the converted value
 */
const toAttributeValue = x => typeof x === 'string' || typeof x === 'number'
    || typeof x === 'boolean' ? x : '' + x;

/**
 * Gets whether or not to set a given JSX property as a DOM attribute.
 * @param {string} n the JSX property name (ex: "id" or "checked")
 * @return {boolean} true if we should set the JSX property as a DOM attribute
 */
const isAttribute = n =>
    n === 'for' || n === 'role' || n === 'novalidate' || n === 'disabled';

/**
 * Determine if this JSX property should be set as a DOM property and attribute.
 * @param {string} n the JSX property name (ex: "id" or "checked")
 * @return {boolean} true if we should set the JSX property as a DOM property
 */
const isAttributeAndProperty = n =>
    n === 'value' || n === 'selected' || n === 'checked';

/**
 * Gets whether or not a given event type uses capture or bubbling.
 * @param {string} t the name of the event type to test (ex: 'click')
 * @return {boolean} true if the event uses capture, false if it uses bubbling
 */
const isCaptured = t => t === 'scroll' || t === 'error' || t === 'load'
    || t === 'focus' || t === 'blur';

/**
 * Creates a controller that delegates events and then patches a Snabbdom tree.
 * @template V the type of the view's input data
 * @param {Element} anchor the DOM element the snabbdom tree is anchored to
 * @param {V} data the view data to be passed into the view each update
 * @param {(main: Dispatcher, data: V) => VNode} view the snabbdom tree creator 
 */
export const startDispatch = (anchor, data, view) => {
    const States = { DISPATCH: 0, UPDATE: 1, SLEEP: 2 };
    const ListenTo = { NONE: 0, ANCHOR: 1, ROOT: 2 };

    let state = States.SLEEP;
    const listenTo = /** @type {Object<string, number>} */({});
    let rootTargets = /** @type {Object<string, Element[]>} */({});
    let oldVirtualNodes = /** @type {VNode|null} */(null);
    let doUpdate = true;

    const anchorChild = document.createElement('div');
    anchor.appendChild(anchorChild);

    /**
     * @param {Event} nativeEvent the native event we are dispatching
     */
    const dispatchNative = (nativeEvent) => {
        const { type, target, timeStamp } = nativeEvent;
        dispatch({ type, target, timeStamp, nativeEvent });
    };

    /**
     * Delegates an event to handlers in the DOM and then (potentially) calls
     * `update` to patch the tree with snabbdom.
     * @param {EventLike} ev the event to dispatch
     * @param {boolean} [isInternal] true only for internal events. Do not use.
     */
    const dispatch = (ev, isInternal) => {
        if (state === States.UPDATE && !isInternal) { return; }

        const isStart = state === States.SLEEP;
        const type = ev.type.toLowerCase();
        const evKey = evKeyPrefix + type;
        const evRootKey = evKeyRootPrefix + type;

        let target = /** @type {Element|null} */(ev.target);
        state = States.DISPATCH;

        while(target && !/** @type {any} */(ev).stop) {
            ev.target = target;
            const handlers = /** @type {any} */(target)[evKey] || [];
            for(let i = 0; handlers[i]; i += 1) {
                const result = handlers[i](ev, target) ?? !isInternal;
                if (result instanceof Promise) {
                    result.then(x => (x ?? !isInternal) ? update() : null);
                } else {
                    doUpdate = doUpdate || !!result;
                }
            }
            target = target.parentElement;
        }

        for(const rootTarget of (rootTargets[type] || [])) {
            const handlers = /** @type {any} */(rootTarget)[evRootKey] || [];
            for(let i = 0; handlers[i]; i += 1) {
                ev.target = rootTarget;
                const result = handlers[i](ev, rootTarget) ?? !isInternal;
                if (result instanceof Promise) {
                    result.then(x => (x ?? !isInternal) ? update() : null);
                } else {
                    doUpdate = doUpdate || !!result;
                }
            }
        }

        if (isStart || isInternal) {
            if (doUpdate) { update(); }
            doUpdate = false;
            state = States.SLEEP;
        }
    };

    /**
     * The Snabbdom hook that records an element as a `rootTarget`.
     * @param {string[]} rootEvents list of event types listened on the root
     * @param {boolean} setFocus true if this node should be focused
     * @param {VNode} vNodeOld the previous virtual node
     * @param {VNode} [vNodeNew] the new virtual node
     */
    const hook = (rootEvents, setFocus, vNodeOld, vNodeNew) => {
        const vNodeCurrent = vNodeNew || vNodeOld;
        if (vNodeCurrent && vNodeCurrent.elm instanceof HTMLElement) {
            if (setFocus) { vNodeCurrent.elm.focus(); }
            for(const eventType of rootEvents) {
                rootTargets[eventType] = rootTargets[eventType] || [];
                rootTargets[eventType].push(vNodeCurrent.elm);
            }
        }
    };

    /**
     * Populates a Virtual Node Data object from a property/attribute map.
     * @template {keyof HTMLElementTagNameMap} T a union of all tag names
     * @param {T} tag the tag name to create (ex: "div")
     * @param {HtmlAttributeSet<T>} map maps property/attribute names to values
     * @param {string[]} rootEvents event types to listen for on the root
     * @param {VNodeData} data the virtual node data to populate
     */
    const setAttributes = (tag, map, rootEvents, data) => {
        data.attrs = data.attrs ?? { };
        data.props = data.props ?? { };

        for(const [key, value] of Object.entries(map)) {
            const lowerKey = key.toLowerCase();
            const hasValue = value !== undefined && value !== null;

            if (lowerKey === 'key' && map.key) {
                data.key = map.key;
            } else if (lowerKey === 'class' && map.class) {
                data.class = map.class;
            } else if (lowerKey === 'style' && map.style) {
                data.style = map.style;
            } else if (lowerKey === 'dataset' && map.dataset) {
                data.dataset = map.dataset;
            } else if (lowerKey.startsWith('on')) {
                const isRoot = lowerKey.substring(2, 6) === 'root';
                const eventType = lowerKey.substring(isRoot ? 6 : 2);
                const prefix = isRoot ? evKeyRootPrefix : evKeyPrefix;

                const valueArray = Array.isArray(value) ? value : [ value ];
                data.props[prefix + eventType] = valueArray;

                if (!isRoot && (listenTo[eventType] || 0) < 1) {
                    const capture = isCaptured(eventType);
                    anchor.addEventListener(eventType, dispatchNative, capture);
                }
                if (isRoot && (listenTo[eventType] || 0) < 2) {
                    window.addEventListener(eventType, dispatchNative);
                    anchor.removeEventListener(eventType, dispatchNative);
                }

                listenTo[eventType] = isRoot ? ListenTo.ROOT : ListenTo.ANCHOR;

                if (isRoot) {
                    rootEvents.push(eventType);
                }

            } else if (key !== "focus" && hasValue) {
                const prefix = key.substring(0, 4);
                const isPrefixed = prefix === 'data' || prefix === 'aria';
                const isAttr = isPrefixed || isAttribute(key);
                const isBoth = isAttributeAndProperty(key);
                if (isBoth || isAttr) {
                    data.attrs[key] = toAttributeValue(value);
                }
                if (isBoth || !isAttr) {
                    data.props[key] = value;
                }
            }
        }
    };

    /**
     * The virtual hyperscript function.
     * @template {keyof HTMLElementTagNameMap} T a union of all tag names
     * @param {T} tag the tag name to create (ex: "div")
     * @param {HtmlOptions<T>} options attribute/property maps and child nodes
     */
    const h = (tag, options) => {
        const data = /** @type {VNodeData} */({ attrs: { }, props: { } });
        const rootEvents = /** @type {string[]} */([]);
        /** @type {(VNode|string)[]} */
        const children = [];

        let doFocus = false;
        for(const child of boxArray(options)) {
            const isString = typeof child === 'string';
            const isNode = child && !isString && 'data' in child;
            if (isString || isNode) {
                children.push(child);
            } else if (child) {
                setAttributes(tag, child, rootEvents, data);
                doFocus = doFocus || !!child.focus;
            }
        }

        if (rootEvents.length > 0 || doFocus) {
            const boundHook = hook.bind(null, rootEvents, doFocus);
            data.hook = { insert: boundHook, update: boundHook };
        }

        return snabbdomJsx(tag, data, children);
    };

    /**
     * Uses snabbdom to patch the DOM tree.
     */
    const update = () => {
        if (state === States.UPDATE) { return; }
        state = States.UPDATE;
        rootTargets = { };

        const newVirtualNodes = view(dispatcher, data);
        patch(oldVirtualNodes || anchorChild, newVirtualNodes);
        oldVirtualNodes = newVirtualNodes;

        doUpdate = false;
        state = States.SLEEP;
        dispatch({ type: 'update', target: null }, true);
    };

    const dispatcher = { dispatch, h, update };

    update();

    return dispatcher;
};
