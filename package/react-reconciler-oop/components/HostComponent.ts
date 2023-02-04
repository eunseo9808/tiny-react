import {ReactComponent} from "./ReactComponent";
import {HostText, WorkTag, HostComponent as HostTag} from "../types/ReactWorkTags";
import {ContentReset} from "../types/ReactFiberFlags";
import {
    appendInitialChild, commitUpdate, createInstance,
    finalizeInitialChildren, prepareUpdate, Props,
    shouldSetTextContent, UpdatePayload
} from "../../react-dom-binding/ReactDOMHostConfig";
import {container, registry, singleton} from "tsyringe";
import {Fiber} from "../ReactFiber";


@singleton()
export class HostComponent extends ReactComponent {
    static tag: WorkTag = 5

    appendAllChildren = (parent: Element, workInProgress: Fiber): void => {
        let node: Fiber | null = workInProgress.child
        while (node !== null) {
            if (node.tag === HostTag || node.tag === HostText) {
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

    updateHostComponent = (
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
            this.markUpdate(workInProgress)
        }
    }

    commitWork(current: Fiber, finishedWork: Fiber): void {
        const instance: Element = finishedWork.stateNode

        if (instance) {
            const newProps = finishedWork.memoizedProps
            const oldProps = current !== null ? current.memoizedProps : newProps
            const type = finishedWork.type

            const updatePayload: null | UpdatePayload =
                finishedWork.updateQueue as any

            finishedWork.updateQueue = null

            if (updatePayload !== null) {
                commitUpdate(
                    instance,
                    updatePayload,
                    type,
                    oldProps,
                    newProps,
                    finishedWork
                )
            }
        }
    }

    completeWork(current: Fiber | null, workInProgress: Fiber): boolean {
        const type = workInProgress.type
        const newProps = workInProgress.pendingProps

        if (current !== null && workInProgress.stateNode != null) {
            this.updateHostComponent(current, workInProgress, type, newProps)
        } else {
            const instance = createInstance(type, newProps, workInProgress)

            this.appendAllChildren(instance, workInProgress)
            workInProgress.stateNode = instance

            if (finalizeInitialChildren(instance, type, newProps)) {
                throw new Error('Not Implement')
            }
        }

        return this.bubbleProperties(workInProgress)
    }

    updateComponent(current: Fiber | null, workInProgress: Fiber): Fiber | null {
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

        this.reconcileChildren(current, workInProgress, nextChildren)
        return workInProgress.child
    }
}
