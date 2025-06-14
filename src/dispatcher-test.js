import { startDispatch } from './dispatcher.js';

const anchor = document.getElementById('anchor') || document.body;

/**
 * @param {number} time the time to wait for (in ms)
 * @return {Promise<void>} a promise resolving after `time` ms
 */
const timeout = time =>
    new Promise(yes => { window.setTimeout(() => yes(), time); });

const rootData = {
    b1: 0,
    b2: 0,
    b3: 0,
    b4: 0,
    b5: 0,
    b6: 0,
    features: [
        'Click B1 to increment B1',
        'Click B2 to increment B2 (No-Update*)',
        'Click anywhere to increment B3 (No-Update*)',
        'Focus B4 to increment B4, logs event/target to console.',
        'Click B5 to increment B5 after 2 seconds.',
        'Click B6 to increment B6 after 2 seconds (No-Update*).',
        'Note: Console logs every update to check No-Update.',
        '(* = No-Update means the user-visible UI will not be ' +
        'updated. To view the latest count for that UI, trigger ' +
        'an update any other way, such as clicking B1).'
    ]
};

// @ts-ignore
window.rootData = rootData;

startDispatch(anchor, rootData, (dispatcher, data) => {
    const h = dispatcher.h;

    return h('div', [
        {
            className: 'foobar',
            onRootUpdate: ev => {
                console.log('root update, target = ' + ev.target);
            }
        },
        h('button', [
            { onClick: _ev => { data.b1 += 1; } },
            'B1 = ' + data.b1
        ]),
        h('button', [
            { onClick: _ev => { data.b2 += 1; return false; } },
            'B2 = ' + data.b2
        ]),
        h('button', [
            { onRootClick: _ev => { data.b3 += 1; return false; } },
            'B3 = ' + data.b3
        ]),
        h('button', [
            {
                onFocus: (ev, target) => {
                    console.log('Focus Event: ', ev);
                    console.log('Focus Target: ', target);
                    data.b4 += 1;
                }
            },
            'B4 = ' + data.b4
        ]),
        h('button', [
            {
                onClick: async () => {
                    await timeout(2000);
                    data.b5 += 1;
                }
            },
            'B5 = ' + data.b5
        ]),
        h('button', [
            {
                onClick: async () => {
                    await timeout(2000);
                    data.b6 += 1;
                    return false;
                }
            },
            'B6 = ' + data.b6
        ]),
        h('div', [
            'Features:',
            h('ul', [
                { id: 'features', style: { '--var-name': 'abc' } },
                ...data.features.map((text, i) =>
                    h('li', [
                        { key: (data.features.length - i).toString() },
                        text
                    ])
                )
            ]),
            h('button', [
                {
                    onClick: () => {
                        data.features.unshift('New Data!');
                        const oldFeature =
                            document.getElementById('features')?.children[0];

                        window.setTimeout(() => {
                            const newFeature =
                                document.getElementById('features')
                                ?.children[1];
                            console.log(oldFeature === newFeature
                                ? 'PASS: `key` works!'
                                : 'FAIL: `key` broken!');
                        }, 50);
                    }
                },
                'Click this to test `key` support ' +
                    '(check console.log for confirmation)'
            ])
        ]),
    ]);
});
