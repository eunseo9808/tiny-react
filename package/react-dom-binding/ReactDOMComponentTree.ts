import { Fiber } from '../react-reconciler/ReactInternalTypes'
import { Container } from './ReactDomRoot'

const randomKey = Math.random().toString(36).slice(2)

const internalContainerInstanceKey = '__reactContainer$' + randomKey

export const markContainerAsRoot = (hostRoot: Fiber, node: Container) => {
    node[internalContainerInstanceKey] = hostRoot
}

//Todo: Event 처리를 위한 함수들 구현
