import {ReactElement, ReactFragment} from '../shared/ReactTypes'
import {Fiber} from './ReactInternalTypes'
import {
    WorkTag,
    HostRoot,
    HostComponent,
    HostText,
    FunctionComponent, Fragment,
} from './ReactWorkTags'
import {Flags, NoFlags} from './ReactFiberFlags'
import {Lanes, NoLanes} from "./ReactFiberLane";

class FiberNode {
    stateNode: any = null
    updateQueue: unknown = null
    return: Fiber | null = null
    alternate: Fiber | null = null
    memoizedState: any = null
    child: Fiber | null = null
    sibling: Fiber | null = null
    type: any = null
    memoizedProps: any = null
    flags: Flags = 0
    subtreeFlags: Flags = 0
    deletions: Fiber[] | null = null
    index: number = 0
    lanes = NoLanes
    childLanes = NoLanes
    elementType = null

    constructor(
        public tag: WorkTag,
        public pendingProps: unknown,
        public key: null | string,
    ) {
    }
}

export const createHostRootFiber = (): Fiber => {
    return new FiberNode(HostRoot, null, null)
}

export const createFiber = (
    tag: WorkTag,
    pendingProps: unknown,
    key: string | null,
) => {
    return new FiberNode(tag, pendingProps, key)
}

export const createWorkInProgress = (
    current: Fiber,
    pendingProps: any
): Fiber => {
    let workInProgress = current.alternate

    if (workInProgress === null) {

        workInProgress = createFiber(
            current.tag,
            pendingProps,
            current.key
        )

        workInProgress.elementType = current.elementType
        workInProgress.type = current.type
        workInProgress.stateNode = current.stateNode

        workInProgress.alternate = current
        current.alternate = workInProgress
    } else {
        workInProgress.pendingProps = pendingProps
        workInProgress.type = current.type
        workInProgress.flags = NoFlags
        workInProgress.subtreeFlags = NoFlags
        workInProgress.deletions = null

    }

    workInProgress.lanes = current.lanes
    workInProgress.updateQueue = current.updateQueue
    workInProgress.childLanes = current.childLanes
    workInProgress.flags = current.flags
    workInProgress.child = current.child
    workInProgress.memoizedProps = current.memoizedProps
    workInProgress.memoizedState = current.memoizedState

    return workInProgress
}

export const createFiberFromTypeAndProps = (
    type: any,
    key: null | string,
    pendingProps: any
) => {
    let fiberTag: WorkTag = FunctionComponent

    if (typeof type === 'function') {
    } else if (typeof type === 'string') {
        fiberTag = HostComponent
    }

    const fiber = createFiber(fiberTag, pendingProps, key)
    fiber.type = type
    return fiber
}

export const createFiberFromElement = (
    element: ReactElement,
): Fiber => {
    const type = element.type
    const key = element.key as any
    const pendingProps = element.props

    const fiber = createFiberFromTypeAndProps(
        type,
        key,
        pendingProps,
    )

    return fiber
}

export const createFiberFromText = (
    content: string,
): Fiber => {
    const fiber = createFiber(HostText, content, null)
    return fiber
}


export function createFiberFromFragment(
    elements: ReactFragment,
    key: null | string,
): Fiber {
    const fiber = createFiber(Fragment, elements, key);
    return fiber;
}
