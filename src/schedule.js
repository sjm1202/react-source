import { ELEMENT_TEXT, TAG_HOST, TAG_ROOT, TAG_TEXT, PLACEMENT, DELETION, UPDATE, TAG_CLASS, TAG_FUNCTION_COMPONENT } from "./constants";
import { Update, UpdateQueue } from "./UpdateQueue";
import { setProps } from './utils'
/**
 * 从根节点开始渲染和调度 
 * 两个阶段
 * diff阶段  对比新旧的虚拟DOM，进行增量 更新或创建，render阶段
 * 这个阶段可能比较花时间，可以我们对任务进行拆分，拆分的纬度虚拟DOM 
 * render阶段成果是effect list知道哪些节点更新了，哪些节点删除，哪些节点增加
 * render阶段有两个任务 1、根据虚拟dom生成fiber树  2、收集effectList
 * commit阶段，进行DOM更新创建阶段，此阶段不能暂停，要一气呵成
 */
let nextUnitOfWork = null; //下一个工作单元
let workInProgressRoot = null; //RootFiber应用的根 (正在渲染的)
let currentRoot = null; //渲染成功之后当前的根
let deletions = []; //删除的节点并不放在effect list里，所以需要单独记录并执行
let workInProgressFiber = null; //正在工作中的Fiber
let hookIndex = 0;  //hooks索引
export function scheduleRoot(rootFiber) {  // {tag: TAG_ROOT, stateNode: container, props: {children: [element] }}
    //双缓存机制，
    if(currentRoot && currentRoot.alternate){
        workInProgressRoot = currentRoot.alternate //第一次渲染的fiber树
        workInProgressRoot.alternate = currentRoot;  //让它的替身指向当前树
        if(rootFiber){
            workInProgressRoot.props = rootFiber.props;  //让它的props更新成新的props
        }
    }else if(currentRoot){ //说明已经至少渲染过一次了
        if(rootFiber){
            rootFiber.alternate = currentRoot;
            workInProgressRoot = rootFiber;
        } else{
            workInProgressRoot = {
                ...currentRoot,
                alternate: currentRoot,
            }
        }
    }else{  //如果是第一次渲染
        workInProgressRoot = rootFiber;
    }
    workInProgressRoot.firstEffect = workInProgressRoot.lastEffect = workInProgressRoot.nextEffect = null;
    nextUnitOfWork = workInProgressRoot;
}
function performUnitWork(currentFiber) {
    // debugger
    beginWork(currentFiber)
    // debugger
    if(currentFiber.child){
        return currentFiber.child
    }
    while(currentFiber){
        completeUnitWork(currentFiber);// 没有儿子让自己完成
        if(currentFiber.sibling){ //看有没有弟弟
            return currentFiber.sibling; // 有弟弟返回弟弟
        }
        currentFiber = currentFiber.return; //找父亲 然后让父亲完成
    }
}
/**
 * 在完成的时候要你收集有副作用的fiber，然后组成effect list
 */
//每一个fiber有两个属性  firstEffect 指向第一个有副作用的子fiber lastEffect 指向最后一个有副作用的子节点
//中间用nextEffect做成一个单链表 firstEffect = 大儿子.nextEffect = 二儿子
function completeUnitWork(currentFiber) {   //第一个完成是A1（text）
    // debugger
    let returnFiber = currentFiber.return;
    if(returnFiber){
        //这段是把自己儿子的effect链挂到父亲身上
        if(!returnFiber.firstEffect){
            returnFiber.firstEffect = currentFiber.firstEffect;
        }
        if(!!currentFiber.lastEffect){
            if(returnFiber.lastEffect){
                returnFiber.lastEffect.nextEffect = currentFiber.firstEffect;
            }
            returnFiber.lastEffect = currentFiber.lastEffect;
            
        }
        //这段是把自己挂到父亲身上 
        const effectTag = currentFiber.effectTag;
        if(effectTag){ //自己有副作用
            if(!!returnFiber.lastEffect){
                returnFiber.lastEffect.nextEffect = currentFiber;
            }else{
                returnFiber.firstEffect = currentFiber; 
            }
            returnFiber.lastEffect = currentFiber;
        } 
    }
}


/**
 * beginWork 开始收下线的前
 * completeUnitOfWork把下线的钱收完了，再加上自己的钱
 * 1、创建真实DOM元素
 * 2、创建子Fiber
 * 
 */
function beginWork(currentFiber){
    // debugger
    if(currentFiber.tag === TAG_ROOT){ // 根Fiber
        updateHostRoot(currentFiber)
    }else if(currentFiber.tag === TAG_TEXT){// 文本Fiber
        updateHostText(currentFiber);
    }else if(currentFiber.tag === TAG_HOST){//原生DOM节点  stateNode  dom
        updateHost(currentFiber);
    }else if(currentFiber.tag === TAG_CLASS){//类组件
        updateClassComponent(currentFiber);
    }else if(currentFiber.tag === TAG_FUNCTION_COMPONENT){//函数组件
        updateFunctionComponent(currentFiber);
    }
}
function updateFunctionComponent(currentFiber){
    workInProgressFiber = currentFiber;
    hookIndex = 0;
    workInProgressFiber.hooks = []
    const newChildren = [currentFiber.type(currentFiber.props)];
    
    reconcileChildren(currentFiber, newChildren);
}
function updateClassComponent(currentFiber){
    // debugger
    if(!currentFiber.stateNode){    //类组件的stateNode 是组件的实例
        //new ClassCounter()   类组件实例 和 fiber双向指向
        currentFiber.stateNode = new currentFiber.type(currentFiber.props)
        currentFiber.stateNode.internalFiber = currentFiber;
        currentFiber.updateQueue =  new UpdateQueue();
    }
    //给组件的实例的state赋值
    currentFiber.stateNode.state = currentFiber.updateQueue.forceUpdate(currentFiber.stateNode.state);
    console.log(currentFiber)
    let newElement = currentFiber.stateNode.render();
    const newChildren = [newElement];
    reconcileChildren(currentFiber, newChildren);
}

function updateHost(currentFiber){
    if(!currentFiber.stateNode){
        currentFiber.stateNode = createDOM(currentFiber)
    }
    const newChildren = currentFiber.props.children;
    reconcileChildren(currentFiber, newChildren);
}

function createDOM(currentFiber){
    if(currentFiber.tag === TAG_TEXT){
        return document.createTextNode(currentFiber.props.text);
    }else if(currentFiber.tag === TAG_HOST){
        let stateNode = document.createElement(currentFiber.type);
        updateDOM(stateNode, {}, currentFiber.props);
        return stateNode;
    }
}
function updateDOM(stateNode, oldProps, newProps){
    setProps(stateNode, oldProps, newProps)
}
function updateHostText(currentFiber){
    if(!currentFiber.stateNode){ //如果此fiber没有创建DOM节点
        currentFiber.stateNode = createDOM(currentFiber)
    }
}

function updateHostRoot(currentFiber){
    //1、先处理自己  如果是一个原生DOM节点，创建真实DOM  2、创建子fiber
    let newChildren = currentFiber.props.children;     // [element]
    reconcileChildren(currentFiber, newChildren);
}
function reconcileChildren(currentFiber, newChildren){
    let newChildIndex = 0;  //新子节点的索引
    //如果说，currentFiber 有alternate 并且alternate有child属性  
    let oldFiber = currentFiber.alternate && currentFiber.alternate.child;
    if(oldFiber){
        oldFiber.firstEffect = oldFiber.lastEffect = oldFiber.nextEffect = null;
    }
    let prevSibling; //上一个新的子Fiber
    //遍历我们的子虚拟DOM元素数组，为每个虚拟DOM元素创建子Fiber
    while(newChildIndex < newChildren.length || oldFiber){
        let newChild = newChildren[newChildIndex]
        let newFiber; //新fiber
        const sameType = oldFiber && newChild && oldFiber.type === newChild.type;
        let tag;
        // debugger
        if(newChild && typeof newChild.type === 'function' && newChild.type.prototype.isReactComponent){
            tag = TAG_CLASS;
        }else if(newChild && typeof newChild.type === 'function'){
            tag = TAG_FUNCTION_COMPONENT;
        }else if(newChild && newChild.type === ELEMENT_TEXT){
            tag = TAG_TEXT;    //这是一个文本节
        }else if(newChild && typeof newChild.type === 'string'){
            tag = TAG_HOST; // 如果type是一个字符串，那么这个是一个原生DOM节点
        }//在deginWork创建Fiber  在completeUnitOfWork的时候收集effect
        
        // debugger
        if(sameType){ //说明老的fiber和新的虚拟类型一样，可以复用老的DOM节点。更新即可
            if(oldFiber.alternate){
                newFiber = oldFiber.alternate;
                newFiber.props = newChild.props;
                newFiber.alternate = oldFiber;
                newFiber.effectTag = UPDATE;
                newFiber.updateQueue = oldFiber.updateQueue || new UpdateQueue(),
                newFiber.nextEffect = null;
            }else{
                newFiber = {
                    tag: oldFiber.tag,
                    type: newChild.type,
                    props: newChild.props, //一定要用新的元素的props
                    stateNode: oldFiber.stateNode,    //复用老的DOM
                    return: currentFiber,
                    alternate: oldFiber,   //让新的Fiber节点指向老的Fiber
                    effectTag: UPDATE,
                    updateQueue: oldFiber.updateQueue || new UpdateQueue(),
                    nextEffect: null,
                }
            }
            oldFiber = oldFiber.sibling;
        }else{
            if(newChild){
                newFiber = {
                    tag,
                    type: newChild.type,
                    props: newChild.props,
                    stateNode: null, //div还没有创建DOM元素
                    return: currentFiber, //父Fiber   returnFiber
                    effectTag: PLACEMENT,  //副作用标识 render我们会收集副作用  增加  删除  更新
                    updateQueue: new UpdateQueue(),
                    nextEffect: null,   //effect list 也是一个单链表
                    //effect list顺序和 完成顺序是一样的，但节点只会放那些出钱的人的Fiber节点， 不出钱的就绕过去了 
                }
            }
            if(oldFiber){
                oldFiber.effectTag = DELETION;
                deletions.push(oldFiber);
                oldFiber = oldFiber.sibling;
            }
        }
        
        //最小的儿子是没有弟弟的
        if(newFiber){
            if(newChildIndex === 0){ //如果当前索引为0，说明这是太子
                currentFiber.child = newFiber;
            }else{
                prevSibling.sibling = newFiber;// 让太子的sibling（弟弟）指向二皇子
            }
            prevSibling = newFiber;
        }
        newChildIndex++
    }

}
//循环执行工作
function workLoop(deadLine){
    let shouldYield = false;  //是否要让出时间片或者说是控制权
    while(nextUnitOfWork && !shouldYield){
        console.log(nextUnitOfWork)
        nextUnitOfWork = performUnitWork(nextUnitOfWork);
        
        shouldYield = deadLine.timeRemaining() < 1; //没有时间的话就要让出控制权了
    }
    if(!nextUnitOfWork && workInProgressRoot){  //如果时间片到期后，还有任务没有完成，就需要请求浏览器再次调度
        console.log("render阶段结束");
        console.log(workInProgressRoot)
        commitRoot();
    }
    //不管有没有任务，都请求再次调度  每一帧都要执行一次workLoop
    requestIdleCallback(workLoop, {timeout: 500});
}
function commitRoot(){
    deletions.forEach(commitWork);//执行effect list之前先把该删的元素删掉
    let currentFiber = workInProgressRoot.firstEffect;
    while(currentFiber){
        commitWork(currentFiber);
        currentFiber = currentFiber.nextEffect
    }
    deletions.length = 0; //提交之后要清空deletion数组
    currentRoot = workInProgressRoot;  //把当前渲染成功的根Fiber 赋值给currentRoot
    workInProgressRoot = null; 
}
function commitWork(currentFiber){
    if(!currentFiber) return;
    let returnFiber = currentFiber.return;
    while(returnFiber.tag !== TAG_HOST && returnFiber.tag !== TAG_ROOT && returnFiber.tag !== TAG_TEXT){
        returnFiber = returnFiber.return;
    }
    let domReturn = returnFiber.stateNode;
    if(currentFiber.effectTag === PLACEMENT){  //新增节点
        let nextFiber = currentFiber;
        if(nextFiber.tag === TAG_CLASS){
            return
        }
        //如果要挂载的节点不是DOM节点，往下找，直到找到一个DOM节点为止
        // debugger
        while(nextFiber.tag !== TAG_HOST && nextFiber.tag !== TAG_TEXT){
            nextFiber = currentFiber.child;
        }
        domReturn.appendChild(nextFiber.stateNode);
    }else if(currentFiber.effectTag === DELETION){ //删除节点
        commitDeletion(currentFiber, domReturn)
        domReturn.removeChild(currentFiber.stateNode);
    }else if(currentFiber.effectTag === UPDATE){

        if(currentFiber.type === ELEMENT_TEXT){
            if(currentFiber.alternate.props.text !== currentFiber.props.text){
                currentFiber.stateNode.textContent = currentFiber.props.text;
            }
        }else{
            if(currentFiber.tag === TAG_CLASS){
                // currentFiber.effectTag = null;
                return
            }
            updateDOM(currentFiber.stateNode, currentFiber.alternate.props, currentFiber.props);
        }
    }
    // currentFiber.effectTag = null;
}
function commitDeletion(currentFiber, domReturn){
    if(currentFiber.tag === TAG_HOST || currentFiber.tag === TAG_TEXT){
        domReturn.removeChild(currentFiber.stateNode);
    }else{
        commitDeletion(currentFiber.child, domReturn);
    }
}

export function useReducer(reducer, initialValue) {
    let oldHook = workInProgressFiber.alternate && 
    workInProgressFiber.alternate.hooks 
    && workInProgressFiber.alternate.hooks[hookIndex];
    let newHook = oldHook;
    // debugger
    if(oldHook){
        //第二次渲染
        newHook.state = newHook.updateQueue.forceUpdate(oldHook.state);
    }else{
        newHook = {
            state: initialValue,
            updateQueue: new UpdateQueue()
        }
    }
    const dispatch = action => {
        let payload = reducer ? reducer(newHook.state, action) : action;
        newHook.updateQueue.enqueueUpdate(
            new Update(payload)
        )
        scheduleRoot()
    }
    workInProgressFiber.hooks[hookIndex] = newHook;
    hookIndex++;
    return [newHook.state, dispatch]
}
export function useState(initialValue) {
    return useReducer(null, initialValue);
}
//react告诉浏览器，我现在有任务，请你在闲的时候
//有一个优先级的概念。expirationTime
requestIdleCallback(workLoop, {timeout: 500});