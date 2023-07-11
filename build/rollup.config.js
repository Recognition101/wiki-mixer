import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
    input: 'build/lib-entry.js',
    plugins: [ nodeResolve() ],
    output: {
        file: 'src/lib/lib.js',
        format: 'esm'
    }
}
