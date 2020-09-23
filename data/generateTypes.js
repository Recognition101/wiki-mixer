#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const regexInterface = /^\s*interface\s.*{\s*$/;
const regexEvent = /^\s*on[A-Z]\w+\?:/;

/**
 * Given an interface declaration line, get the name of that interface.
 * @param {string} interfaceLine the declaration, ex: 'interface Test<G> {'
 * @return {string} the name, including any generic, ex: 'Test<G>'
 */
const getInterfaceName = interfaceLine => {
    const name = interfaceLine.replace(/^\s*interface\s+/, '');
    let braceCount = 0; // the count of remaining open '<' (char-code 60)
    let endIndex = -1;

    for(let i = 0; endIndex < 0 && i < name.length; i += 1) {
        const code = name.charCodeAt(i);
        braceCount += code === 60 ? 1 : (code === 62 ? -1 : 0); // (62 is '>')
        if (code === 32 && braceCount === 0) {
            endIndex = i; // End if we see space with no open angle braces
        }
    }

    return endIndex < 0 ? name : name.substr(0, endIndex);
};

/**
 * Gets a map of interface lines to event names.
 * @param {string} inputFile the type-definition input file, as a string
 * @return {{[interfaceLine: string]: string[]}} a map of interface lines to
 *      a list of event names existing within that interface
 */
const getEvents = (inputFile) => {
    const events = /** @type {{[interfaceLine: string]: string[]}} */({ });
    let interfaceLine = '';

    for(const line of inputFile.split('\n')) {
        interfaceLine = regexInterface.test(line) ? line.trim() : interfaceLine;
        if (regexEvent.test(line)) {
            events[interfaceLine] = events[interfaceLine] || [];
            events[interfaceLine].push(line.trim().replace(/\?:.*/, ''));
        }
    }

    return events;
};

const main = async () => {
    const inputRelPath = '../node_modules/@types/react/index.d.ts';
    const outputRelPath = '../generatedTypes.d.ts';
    const inputPath = path.join(__dirname, inputRelPath);
    const outputPath = path.join(__dirname, outputRelPath);
    let input = '';

    try {
        input = fs.readFileSync(inputPath).toString();
    } catch(e) {
        console.error(`ERROR: Could not read file: ${inputPath}\n`
            + '  > Make sure you have run `npm i` before running this!\n');
        return;
    }

    const events = getEvents(input);

    let output = '/**\n * THIS FILE IS GENERATED. DO NOT EDIT.\n'
        + ' * TO RE-GENERATE: RUN `node ./data/generateTypes.js`\n */\n\n'
        + 'import * as React from \'react\';\n\n'
        + 'declare module \'React\' {\n'
        + 'interface DOMAttributes<T> {\n'
        + '    onRootUpdate?: (ev: { type: \'update\', target: HTMLElement })\n'
        + '        => boolean | null | undefined | void;\n'
        + '    onRootResize?: () => boolean | null | undefined | void;\n'
        + '}\n\n';

    for(const interfaceLine in events) {
        const interfaceName = getInterfaceName(interfaceLine);
        const eventNames = events[interfaceLine] || [];

        output += interfaceLine + '\n';
        for(const eventHandler of eventNames) {
            const event = eventHandler.replace(/^on/, '');
            output += `    onRoot${event}?: ${interfaceName}['on${event}'];\n`;
        }
        output += '}\n';
    }

    output += '}\n';
    fs.writeFileSync(outputPath, output);
};

main();
