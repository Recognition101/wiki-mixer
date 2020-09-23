import { Module } from './modules/module';
import { VNode } from './vnode';
import { DOMAPI } from './htmldomapi';
export declare function init(modules: Array<Partial<Module>>, domApi?: DOMAPI): (oldVnode: VNode | Element, vnode: VNode) => VNode;
