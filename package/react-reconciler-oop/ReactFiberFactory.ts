import {Fragment, FunctionComponent, HostComponent, HostRoot, HostText, WorkTag} from "./types/ReactWorkTags";
import {NoFlags} from "./types/ReactFiberFlags";
import {ReactElement, ReactFragment} from "../shared/ReactTypes";

import {singleton} from "tsyringe";
import {Fiber, FiberRoot} from "./types/ReactInternalTypes";
import {FiberNode} from "./ReactFiber";
import {FiberRootNode} from "./ReactFiberRoot";

@singleton()
export class ReactFiberFactory {
    createHostRootFiber = (): Fiber => {
        return new FiberNode(HostRoot, null, null)
    }
    createFiberRoot = (
        containerInfo: any,
    ): FiberRoot => {
        const root: FiberRoot = new FiberRootNode(containerInfo)

        const uninitializedFiber = this.createHostRootFiber()
        root.current = uninitializedFiber
        uninitializedFiber.stateNode = root

        return root
    }

    createFiber = (
        tag: WorkTag,
        pendingProps: unknown,
        key: string | null,
    ) => {
        return new FiberNode(tag, pendingProps, key)
    }

    createWorkInProgress = (
        current: Fiber,
        pendingProps: any
    ): Fiber => {
        let workInProgress = current.alternate

        if (workInProgress === null) {

            workInProgress = this.createFiber(
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
        workInProgress.elementType = current.elementType

        return workInProgress
    }

    createFiberFromTypeAndProps = (
        type: any,
        key: null | string,
        pendingProps: any
    ) => {
        let fiberTag: WorkTag = FunctionComponent

        if (typeof type === 'function') {
        } else if (typeof type === 'string') {
            fiberTag = HostComponent
        }

        const fiber = this.createFiber(fiberTag, pendingProps, key)
        fiber.type = type
        fiber.elementType = type
        return fiber
    }

    createFiberFromElement = (
        element: ReactElement,
    ): Fiber => {
        const type = element.type
        const key = element.key as any
        const pendingProps = element.props

        return this.createFiberFromTypeAndProps(
            type,
            key,
            pendingProps,
        )
    }

    createFiberFromText = (
        content: string,
    ): Fiber => {
        return this.createFiber(HostText, content, null)
    }


    createFiberFromFragment = (
        elements: ReactFragment,
        key: null | string,
    ): Fiber => {
        return this.createFiber(Fragment, elements, key);
    }

    cloneChildFibers = (
        current: Fiber | null,
        workInProgress: Fiber
    ): void => {
        if (workInProgress.child === null) return

        let currentChild = workInProgress.child

        let newChild = this.createWorkInProgress(currentChild, currentChild.pendingProps)
        workInProgress.child = newChild

        newChild.return = workInProgress

        while (currentChild.sibling !== null) {
            currentChild = currentChild.sibling
            newChild = newChild.sibling = this.createWorkInProgress(
                currentChild,
                currentChild.pendingProps
            )
            newChild.return = workInProgress
        }

        newChild.sibling = null
    }

}

