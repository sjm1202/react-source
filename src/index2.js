import React from './react';
import ReactDOM from './react-dom';
let style = {border: '3px solid red', margin: '5px'};
//JSX其实是一种特殊语法 在webpack打包扽时候  babel编译的时候会编译成JS
// let element = (
//   <div id='A1' style={style}>
//     A1
//     <div id='B1' style={style}>
//       B1
//       <div id='C1' style={style}>c1</div>
//       <div id='C2' style={style}>c2</div>
//     </div>
//     <div id='B2' style={style}></div>
//   </div> 
// )
// console.log(element);
//虚拟DOM就是一个JS对象，以JS对象的方式描述界面上DOM的样子
let element1 = React.createElement('div', 
    {id: 'A1', style}, 
    "A1",
    React.createElement('div', 
        {id: 'B1', style},
        "B1",
        React.createElement('div', {id: 'C1', style}, "c1"),
        React.createElement('div', {id: 'C2', style}, "c2"),
        React.createElement('div', {id: 'C3', style}, "c3")
    ),
    React.createElement('div', {id: 'B2', style}, 'B2')
)
console.log(element1)

ReactDOM.render(
    element1,
    document.getElementById('root')
);

let render2 = document.getElementById('render2');
render2.addEventListener('click', () => {
    let element2 = React.createElement('div', 
        {id: 'A1-new', style}, 
        "A1-new",
        React.createElement('div', 
            {id: 'B1-new', style},
            "B1-new",
            React.createElement('div', {id: 'C1-new', style}, "c1-new"),
            React.createElement('div', {id: 'C2-new', style}, "c2-new"),
            React.createElement('div', {id: 'C3-new', style}, "c3-new")
        ),
        React.createElement('div', {id: 'B2-new', style}, 'B2-new'),
        React.createElement('div', {id: 'B3', style}, 'B3')
    );
    ReactDOM.render(
        element2,
        document.getElementById('root')
    );
})

let render3 = document.getElementById('render3');
render3.addEventListener('click', () => {
    let element3 = React.createElement('div', 
        {id: 'A1-new2', style}, 
        "A1-new2",
        React.createElement('div', 
            {id: 'B1-new2', style},
            "B1-new2",
            React.createElement('div', {id: 'C1-new2', style}, "c1-new2"),
            React.createElement('div', {id: 'C2-new2', style}, "c2-new2"),
            React.createElement('div', {id: 'C3-new2', style}, "c3-new2")
        ),
        React.createElement('div', {id: 'B2-new', style}, 'B2-new2')
    );
    ReactDOM.render(
        element3,
        document.getElementById('root')
    );
})