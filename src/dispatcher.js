import { jsx } from '../lib/snabbdom/jsx.js';
import { init } from '../lib/snabbdom/init.js';
import { classModule } from '../lib/snabbdom/modules/class.js';
import { propsModule } from '../lib/snabbdom/modules/props.js';
import { styleModule } from '../lib/snabbdom/modules/style.js';
import { attributesModule } from '../lib/snabbdom/modules/attributes.js';

const patch = init([ classModule, propsModule, attributesModule, styleModule ]);

const evKeyPrefix = 'ev-';
const evKeyRootPrefix = 'ev-root-';

/**
 * @typedef {import("../lib/snabbdom/vnode").VNode} VNode
 * @typedef {import("../lib/snabbdom/vnode").VNodeData} VNodeData
 * @typedef {import("../lib/snabbdom/modules/attributes").Attrs} VNodeAttrs
 * @typedef {import("../lib/snabbdom/modules/props").Props} VNodeProps
 * @typedef {import("../lib/snabbdom/jsx").JsxVNodeChild} JsxVNodeChild
 * @typedef {import("../lib/snabbdom/jsx").JsxVNodeChildren} JsxVNodeChildren
 * @typedef {keyof JSX.IntrinsicElements} TagUnion 
 *
 * @typedef {Object} SyntheticEvent A simplified `Event`-like object.
 * @prop {boolean} [stop] if true, event delegation will stop
 * @prop {string} type the type of the event (ex: "click")
 * @prop {number} [timeStamp] the time when this event was fired
 * @prop {EventTarget|null} target the element this event is targeting
 * @prop {Event} [nativeEvent] the actual event triggering this dispatch
 *
 * @typedef {Object} Dispatcher a controller managing a dispatch-update loop
 * @prop {(ev: Event)=>void} dispatch starts the dispatch-update process
 * @prop {()=>void} update updates the view and patches the DOM with snabbdom
 * @prop {<T extends TagUnion>(tag: T,
 *      attrs: JSX.IntrinsicElements[T],
 *      children: JsxVNodeChild[]) => VNode} h the virtual hyperscript function
 */

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
const isAttribute = n => n === 'for' || n === 'role' || n === 'novalidate';

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
 * @return {Dispatcher} the created delegate
 */
export const startDispatch = (anchor, data, view) => {
    const States = { DISPATCH: 0, UPDATE: 1, SLEEP: 2 };
    const ListenTo = { NONE: 0, ANCHOR: 1, ROOT: 2 };

    let state = States.SLEEP;
    const listenTo = /** @type {{[eventType: string]: number}} */({});
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
     * @param {SyntheticEvent} ev the event we are dispatching
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
                const result = handlers[i](ev);
                doUpdate = doUpdate
                    || (isInternal ? result === true : result !== false);
            }
            target = target.parentElement;
        }

        for(const rootTarget of (rootTargets[type] || [])) {
            const handlers = /** @type {any} */(rootTarget)[evRootKey] || [];
            for(let i = 0; handlers[i]; i += 1) {
                ev.target = rootTarget;
                const result = handlers[i](ev);
                doUpdate = doUpdate
                    || (isInternal ? result === true : result !== false);
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
     * The virtual hyperscript function.
     * @template {TagUnion} T a union of all tag names (ex: "div" | "a" | ...)
     * @param {T} tag the tag name to create (ex: "div")
     * @param {JSX.IntrinsicElements[T]} attributesAndProperties set on DOM
     * @param {JsxVNodeChild[]} children any children to attach
     */
    const h = (tag, attributesAndProperties, children) => {
        const attrs = /** @type {VNodeAttrs} */({});
        const props = /** @type {VNodeProps} */({});
        const data = /** @type {VNodeData} */({ attrs, props });
        const rootEvents = /** @type {string[]} */([]);

        let doFocus = false;
        for(const key in attributesAndProperties) {
            const value = attributesAndProperties[key];
            const lowerKey = key.toLowerCase();

            if (lowerKey === 'key') {
                data.key = attributesAndProperties.key || '';

            } else if (lowerKey === 'style') {
                data.style = /** @type {any} */(value);

            } else if (lowerKey.startsWith('on')) {
                const isRoot = lowerKey.substr(2, 4) === 'root';
                const eventType = lowerKey.substr(isRoot ? 6 : 2);
                const prefix = isRoot ? evKeyRootPrefix : evKeyPrefix;

                props[prefix + eventType] = boxArray(value);

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

            } else if (value !== undefined && value !== null) {
                doFocus = doFocus || (key === 'focused' && Boolean(value));
                const prefix = key.substr(0, 4);
                const isPrefixed = prefix === 'data' || prefix === 'aria';
                const isAttr = isPrefixed || isAttribute(key);
                const isBoth = isAttributeAndProperty(key);
                if (isBoth || isAttr) { attrs[key] = toAttributeValue(value); }
                if (isBoth || !isAttr) { props[key] = value; }
            }
        }

        if (rootEvents.length > 0 || doFocus) {
            const boundHook = hook.bind(null, rootEvents, doFocus);
            data.hook = { insert: boundHook, update: boundHook };
        }

        return jsx(tag, data, children);
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
