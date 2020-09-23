import { $$ } from './dispatcher.js';

/**
 * @typedef {import("./dispatcher").Dispatcher} Dispatcher
 * @typedef {import("./dispatcher").SyntheticEvent} SyntheticEvent
 * @typedef {import("../lib/snabbdom/vnode").VNode} VNode
 */

/**
 * @template T the union of all enum values this option can represent
 * @typedef {Object} ChooserOption this represents an option a user can pick
 * @prop {T} value the enum value this choice represents internally
 * @prop {string} text the externally displayed text for the user
 */

/**
 * @template T a union of all the enum values this choice can result in
 * @typedef {Object} Chooser the data backing a user-driven choice
 * @prop {T} value the enum value representing the currently chosen value
 * @prop {number} index the index into `options` for which option is chosen
 * @prop {ChooserOption<T>[]} options the list of all options presented
 * @prop {number[][]} [offsets] the X [start, end] positions of each option
 * @prop {boolean} [isSetup] true if this UI is ready to operate
 */

/**
 * Forces the segmented control to remeasure itself in the next frame. This
 * will cause an extra dispatcher update.
 * @template T the possible enum values this choice can result in
 * @param {Chooser<T>} choice the data representing the options in this control
 */
export const reset = choice => {
    delete choice.isSetup;
    delete choice.offsets;
};

/**
 * Gets a virtual node displaying a segmented control used to make a choice.
 * @template T the possible enum values this choice can result in
 * @param {Dispatcher} dispatcher the global event dispatcher
 * @param {Chooser<T>} choice the data representing the options in this control
 * @return {VNode} a virtual node displaying a segmented control
 */
export const segmentedControl = (dispatcher, choice) => {
    const h = dispatcher.h;
    const { offsets, index } = choice;

    /**
     * Measure offsets if they don't exist. Then, set the isSetup flag if off.
     * @param {SyntheticEvent} ev the event that triggers this setup
     */
    const setup = ev => {
        const target = /** @type {HTMLElement|null} */(ev.target);

        if (!offsets && target) {
            choice.offsets = $$('button', target).map(
                child => [ child.offsetLeft || 0, child.offsetWidth ]);
            return !offsets;

        } else if (!choice.isSetup && target) {
            choice.isSetup = true;
            window.setTimeout(() => {
                target.classList.add('is-setup');
            }, 1);
        }
    };

    const onRootUpdate = !offsets || !choice.isSetup ? setup : undefined;

    // Draw the shade in the correct position based on measured offsets.
    const [x=0, width=0] = (offsets && offsets[index]) || [ ];
    const shade = h('div', {
        className: 'segmented-shade',
        style: { transform: `translateX(${x}px)`, width: `${width}px` }
    }, []);

    // Create a segmented button for each option
    const buttons = choice.options.map((option, i) =>
        h('button', {
            className:
                'segmented-' + option.value
                + (choice.value === option.value ? ' selected' : ''),
            onClick: () => {
                choice.index = i;
                choice.value = option.value;
            }
        }, [
            option.text
        ])
    );

    // Return the Virtual Node
    const className = 'segmented' + (choice.isSetup ? ' is-setup' : '');
    return h('div', { className, onRootUpdate }, [ shade, ...buttons ]);
};
