import React, {} from './react';
import ReactDOM from './react-dom';
class ClassCounter extends React.Component{
    constructor(props){
        super(props);
        this.state = {number: 0}
    }
    onClick = () => {
        this.setState(state => ({number: state.number + 1}));
    }
    render(){
        return (
            <div id='counter'>
                <span>{this.state.number}</span>
                <button onClick={this.onClick}>加一</button>
                <hr></hr>
                <FunctionCounter></FunctionCounter>
            </div>
        )
    }
}
//useState是一个语法糖，基于useReduce实现的
const ADD = 'ADD'
function reducer(state, action) {
    switch(action.type){
        case ADD:
            return {count: state.count + 1}
        default:
            return state;
    }
}
function FunctionCounter() {
    const [countState, dispatch] = React.useReducer(reducer, {count: 0})
    const [numberState, numberDispatch] = React.useReducer(reducer, {count: 0});
    const [b, setB] = React.useState({count: 0});
    return (
        <div id='counter'> 
            <span>{countState.count}</span>
            <button onClick={() => dispatch({type: ADD})}>加一</button>
            <hr></hr>
            <span>{numberState.count}</span>
            <button onClick={() => numberDispatch({type: ADD})}>加一</button>
            <hr></hr>
            <span>{b.count}</span>
            <button onClick={() => setB({count: b.count+1})}>加一</button>
        </div>
    )
}
ReactDOM.render(
    <ClassCounter name="计数器"></ClassCounter>,
    document.getElementById('root')
)