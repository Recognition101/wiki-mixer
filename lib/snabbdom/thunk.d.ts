import { VNode, VNodeData } from './vnode';
export interface ThunkData extends VNodeData {
    fn: () => VNode;
    args: any[];
}
export interface Thunk extends VNode {
    data: ThunkData;
}
export interface ThunkFn {
    (sel: string, fn: Function, args: any[]): Thunk;
    (sel: string, key: any, fn: Function, args: any[]): Thunk;
}
export declare const thunk: ThunkFn;
