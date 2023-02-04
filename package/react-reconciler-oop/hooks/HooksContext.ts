import {Lanes, NoLanes} from "../types/ReactFiberLane";
import {container, singleton} from "tsyringe";
import {Dispatcher, Hook} from "../types/RectHooksTypes";
import {Fiber} from "../ReactFiber";


@singleton()
export class HooksContext {
    workInProgressHook: Hook | null = null
    currentlyRenderingFiber: Fiber
    currentHook: Hook | null = null
    renderLanes: Lanes = NoLanes

    mountWorkInProgressHook = (): Hook => {
        const hook: Hook = {
            next: null,
            memoizedState: null,
            baseState: null,
            queue: null,
            baseQueue: null,
        }

        if (this.workInProgressHook === null) {
            this.currentlyRenderingFiber.memoizedState = this.workInProgressHook = hook
        } else {
            this.workInProgressHook = this.workInProgressHook.next = hook
        }

        return this.workInProgressHook
    }

    updateWorkInProgressHook = (): Hook => {
        let nextCurrentHook: null | Hook

        if (this.currentHook === null) {
            const current = this.currentlyRenderingFiber.alternate
            if (current !== null) {
                nextCurrentHook = current.memoizedState
            } else {
                throw new Error('Not Implement')
            }
        } else {
            nextCurrentHook = this.currentHook.next
        }

        let nextWorkInProgressHook: Hook | null = null

        if (this.workInProgressHook === null) {
            nextWorkInProgressHook = this.currentlyRenderingFiber.memoizedState
        } else {
            nextWorkInProgressHook = this.workInProgressHook.next
        }

        if (nextWorkInProgressHook !== null) {
            throw new Error('Not Implement')
        } else {
            this.currentHook = nextCurrentHook!
            const newHook: Hook = {
                memoizedState: this.currentHook.memoizedState,
                baseState: this.currentHook.baseState,
                queue: this.currentHook.queue,
                next: null,
                baseQueue: this.currentHook.baseQueue,
            }

            if (this.workInProgressHook === null) {
                this.currentlyRenderingFiber.memoizedState = this.workInProgressHook = newHook
            } else {
                this.workInProgressHook = this.workInProgressHook.next = newHook
            }
        }

        return this.workInProgressHook
    }
}

