import { VNode as _VNode, VNodeData as _VNodeData } from './vnode';
declare type VNode = _VNode;
declare type VNodeData = _VNodeData;
declare global {
    /**
     * opt-in jsx intrinsic global interfaces
     * see: https://www.typescriptlang.org/docs/handbook/jsx.html#type-checking
     */
    namespace JSX {
        type Element = VNode;
        interface IntrinsicElements {
            [elemName: string]: VNodeData;
        }
    }
}
export {};
