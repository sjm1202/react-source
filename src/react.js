import { ELEMENT_TEXT } from './constants';
import { scheduleRoot, useReducer, useState } from './schedule';
import { Update, UpdateQueue } from './UpdateQueue';
/**
 * 创建元素（虚拟DOM）的方法
 * @param {} type       元素的类型div  span p
 * @param {*} config    配置对象   属性  key  ref
 * @param  {...any} children   放的所有的儿子，这里会做成一个数组
 */
function createElement(type, config, ...children){
    config = config || {}
    delete config.__self;
    delete config.__source;   //表示这个元素是在哪行哪列哪个文件生成的
    return {
        type,
        props: {
            ...config,        //做了一个兼容处理，如果所示React元素的话返回自己，如果是一个字符串的话，返回元素对象
            children: children.map(child => {
                //如果这个child是一个React.createElement返回的React元素不转换，如果是字符串话就进行转换
                return typeof child === 'object' ? child : {
                    type: ELEMENT_TEXT,
                    props: { text: child, child: [] }
                }
            })
        }
    }
}
class Component{
    constructor(props){
        this.props = props;
        // this.internalFiber.updateQueue = new UpdateQueue();
    }
    setState(payload){ // 可能是一个对象，也可能是一个函数
        let update = new Update(payload);
        // updateQueue其实是放在此类组件对应的fiber节点的internalFiber
        this.internalFiber.updateQueue.enqueueUpdate(update);
        scheduleRoot(); //从根节点开始调度
    }
}
Component.prototype.isReactComponent = {} 
const React = {
    createElement,
    Component,
    useReducer,
    useState
}
export default React;