export function setProps(dom, oldProps, newProps){
    for(let key in oldProps){
        if(key !== 'children'){
            if(newProps.hasOwnProperty(key)){
                setProp(dom, key, newProps[key]); //新老都有，更新
            }else{
                
                dom.removeAttribute(key); //老的有新没有，删除
            }
        }
    }
    for(let key in newProps){
        if(key !== 'children'){
            if(!oldProps.hasOwnProperty(key)){ //老的没有新的有，添加
                setProp(dom, key, newProps[key]);
            }
            
        }
    }
}
export function setProp(dom, key, value){
    if(/^on/.test(key)){
        dom[key.toLowerCase()] = value; //没有用合成事件
    }else if(key === 'style'){
        if(value){
            for(let styleName in value){
                dom.style[styleName] = value[styleName];
            }
        }
    }else{
        dom.setAttribute(key, value);
    }
}