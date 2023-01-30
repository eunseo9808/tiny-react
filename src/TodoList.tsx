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

    useEffect(() => {
        const intervalId = setInterval(() => {
            setTodos(prev => [...prev, {
                id: nextTodoId,
                content: 'todo' + nextTodoId
            }])
            setNextTodoId(prev => prev + 1)
        }, 1000)

        return () => {
            clearInterval(intervalId)
        }
    }, [nextTodoId])

    return <div>
        Hi This is My Tiny React
        {todos.map(todo => <Todo key={todo.id} todo={todo} />)}
    </div>
}
