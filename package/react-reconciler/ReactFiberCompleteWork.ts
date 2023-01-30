import {
    createTextInstance,
    finalizeInitialChildren,
    prepareUpdate,
    Props
} from '../react-dom-binding/ReactDOMHostConfig'
import {NoFlags, StaticMask, Update} from './ReactFiberFlags'
import { appendInitialChild, createInstance } from './ReactFiberHostConfig'
import { NoLanes } from './ReactFiberLane'
import { Fiber } from './ReactInternalTypes'
import {
    Fragment,
    FunctionComponent,
    HostComponent,
    HostRoot,
    HostText
} from './ReactWorkTags'

const appendAllChildren = (parent: Element, workInProgress: Fiber): void => {
    let node: Fiber | null = workInProgress.child
    while (node !== null) {
        if (node.tag === HostComponent || node.tag === HostText) {
            appendInitialChild(parent, node.stateNode)
        } else if (node.child !== null) {
            node.child.return = node
            node = node.child
            continue
        }

        if (node === workInProgress) {
            return
        }

        while (node.sibling === null) {
            if (node.return === null || node.return === workInProgress) return

            node = node?.return ?? null
        }

        node.sibling.return = node.return
        node = node.sibling
    }
}

const bubbleProperties = (completedWork: Fiber): boolean => {
    const didBailout =
        completedWork.alternate !== null &&
        completedWork.alternate.child === completedWork.child
    let subtreeFlags = NoFlags
    let newChildLanes = NoLanes

    if (!didBailout) {
        let child = completedWork.child

        while (child !== null) {
            newChildLanes = child.lanes & child.childLanes

            subtreeFlags |= child.subtreeFlags
            subtreeFlags |= child.flags
            child.return = completedWork

            child = child.sibling
        }
        completedWork.subtreeFlags |= subtreeFlags
    } else {
        let child = completedWork.child

        while (child !== null) {
            newChildLanes = child.lanes & child.childLanes

            subtreeFlags |= child.subtreeFlags & StaticMask
            subtreeFlags |= child.flags & StaticMask

            child.return = completedWork

            child = child.sibling
        }

        completedWork.subtreeFlags |= subtreeFlags
    }

    completedWork.childLanes = newChildLanes
    return didBailout
}

const markUpdate = (workInProgress: Fiber) => {
    workInProgress.flags |= Update
}

const updateHostText = (
    current: Fiber,
    workInProgress: Fiber,
    oldText: string,
    newText: string
) => {
    if (oldText !== newText) {
        markUpdate(workInProgress)
    }
}

const updateHostComponent = (
    current: Fiber,
    workInProgress: Fiber,
    type: string,
    newProps: Props
) => {
    const oldProps = current.memoizedProps
    if (oldProps === newProps) {
        return
    }

    const instance: Element = workInProgress.stateNode

    const updatePayload = prepareUpdate(instance, type, oldProps, newProps)

    workInProgress.updateQueue = updatePayload
    if (updatePayload) {
        markUpdate(workInProgress)
    }
}

export const completeWork = (
    current: Fiber | null,
    workInProgress: Fiber
): Fiber | null => {
    const newProps = workInProgress.pendingProps

    switch (workInProgress.tag) {
        case Fragment:
        case FunctionComponent:
            bubbleProperties(workInProgress)
            return null
        case HostRoot: {
            bubbleProperties(workInProgress)
            return null
        }
        case HostComponent: {
            const type = workInProgress.type
            if (current !== null && workInProgress.stateNode != null) {
                updateHostComponent(current, workInProgress, type, newProps)
            } else {
                const instance = createInstance(type, newProps, workInProgress)

                appendAllChildren(instance, workInProgress)
                workInProgress.stateNode = instance

                if (finalizeInitialChildren(instance, type, newProps)) {
                    throw new Error('Not Implement')
                }
            }

            bubbleProperties(workInProgress)
            return null
        }
        case HostText: {
            const newText = newProps

            if (current && workInProgress.stateNode !== null) {
                const oldText = current.memoizedProps
                updateHostText(current, workInProgress, oldText, newText)
            } else {
                workInProgress.stateNode = createTextInstance(newText)
            }
            bubbleProperties(workInProgress)
            return null
        }
    }

    throw new Error('Not implement')
}
