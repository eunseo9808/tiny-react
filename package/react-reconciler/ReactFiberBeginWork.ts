import { shouldSetTextContent } from './ReactFiberHostConfig'
import {
    cloneChildFibers,
    mountChildFibers,
    reconcileChildFibers,
} from './ReactChildFiber'
import { bailoutHooks, renderWithHooks } from './ReactFiberHooks'
import { Fiber } from './ReactInternalTypes'
import { cloneUpdateQueue, processUpdateQueue } from './ReactUpdateQueue'
import {
    Fragment,
    FunctionComponent,
    HostComponent,
    HostRoot,
    HostText
} from './ReactWorkTags'
import {Lanes, NoLanes, SyncLane} from './ReactFiberLane'
import { ContentReset } from './ReactFiberFlags'

let didReceiveUpdate = false

function updateFragment(
    current: Fiber | null,
    workInProgress: Fiber,
) {
    const nextChildren = workInProgress.pendingProps;
    reconcileChildren(current, workInProgress, nextChildren);
    return workInProgress.child;
}

const updateFunctionComponent = (
    current: Fiber | null,
    workInProgress: Fiber,
    Component: Function,
    nextProps: any
): Fiber | null => {
    const nextChildren = renderWithHooks(
        current,
        workInProgress,
        Component as any,
        nextProps,
        null
    )

    if (current !== null && !didReceiveUpdate) {
        bailoutHooks(current, workInProgress)
        return bailoutOnAlreadyFinishedWork(current, workInProgress)
    }

    reconcileChildren(current, workInProgress, nextChildren)
    return workInProgress.child
}

const bailoutOnAlreadyFinishedWork = (
    current: Fiber | null,
    workInProgress: Fiber
): Fiber | null => {
    if(workInProgress.childLanes !== SyncLane) return null

    cloneChildFibers(current, workInProgress)
    return workInProgress.child
}


const updateHostRoot = (
    current: Fiber,
    workInProgress: Fiber
) => {
    cloneUpdateQueue(current, workInProgress)
    const prevState = workInProgress.memoizedState
    const prevChildren = prevState !== null ? prevState.element : null
    const nextProps = workInProgress.pendingProps
    processUpdateQueue(workInProgress, nextProps, null)
    const nextState = workInProgress.memoizedState

    const nextChildren = nextState.element

    if (nextChildren === prevChildren) {
        return bailoutOnAlreadyFinishedWork(current, workInProgress)
    }

    reconcileChildren(current, workInProgress, nextChildren)

    return workInProgress.child
}

const reconcileChildren = (
    current: Fiber | null,
    workInProgress: Fiber,
    nextChildren: any,
) => {
    if (current === null) {
        workInProgress.child = mountChildFibers(
            workInProgress,
            null,
            nextChildren
        )
    } else {
        workInProgress.child = reconcileChildFibers(
            workInProgress,
            current.child,
            nextChildren
        )
    }

}

const updateHostComponent = (
    current: Fiber | null,
    workInProgress: Fiber
) => {
    const type = workInProgress.type
    const nextProps = workInProgress.pendingProps
    const prevProps = current !== null ? current.memoizedProps : null

    let nextChildren = nextProps.children
    const isDirectTextChild = shouldSetTextContent(type, nextProps)

    if (isDirectTextChild) {
        nextChildren = null
    } else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
        workInProgress.flags |= ContentReset
    }

    reconcileChildren(current, workInProgress, nextChildren)
    return workInProgress.child
}


export const beginWork = (
    current: Fiber | null,
    workInProgress: Fiber,
): Fiber | null => {

    if (current !== null) {
        const oldProps = current.memoizedProps
        const newProps = workInProgress.pendingProps

        if (oldProps !== newProps) {
            didReceiveUpdate = true
        } else if (workInProgress.lanes !== SyncLane) {
            didReceiveUpdate = false
            return bailoutOnAlreadyFinishedWork(current, workInProgress)
        }
    } else {
        didReceiveUpdate = false
    }

    workInProgress.lanes = NoLanes

    switch (workInProgress.tag) {
        case Fragment:
            return updateFragment(current, workInProgress);
        case FunctionComponent: {
            const Component = workInProgress.type
            const unresolvedProps = workInProgress.pendingProps
            const resolvedProps = unresolvedProps
            return updateFunctionComponent(
                current!,
                workInProgress,
                Component,
                resolvedProps
            )
        }
        case HostRoot: {
            return updateHostRoot(current!, workInProgress)
        }
        case HostComponent:
            return updateHostComponent(current, workInProgress)
        case HostText:
            return null
    }
    throw new Error('Not Implement')
}

export const markWorkInProgressReceivedUpdate = () => {
    didReceiveUpdate = true
}
