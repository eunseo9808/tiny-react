import React, {useEffect, useState} from '../package/react'


interface Todo {
    id: number,
    content: string
}

function Todo(props: { todo: Todo }) {
    return <li>{props.todo.content}</li>
}

export function TodoList() {

    const [nextTodoId, setNextTodoId] = useState<number>(0)
    const [todos, setTodos] = useState<Todo[]>([])
    const [value, setValue] = useState<string>("")

    const addTodo = () => {
        setNextTodoId(prev => prev + 1)
        setTodos(prev => [...prev, { id: nextTodoId, content: value }])
    }


    return <div>
        Hi This is My Tiny React
        <div>
            <input type="text" onChange={e => setValue(e.target.value)} value={value}/>
            <button onClick={addTodo}>Add</button>
        </div>
        {todos.map(todo => <Todo key={todo.id} todo={todo} />)}
    </div>
}
