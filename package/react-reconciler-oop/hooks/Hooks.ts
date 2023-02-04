import {Hook} from "../types/ReactHooksTypes";
import {hooksContext} from "./hooksContext";

export abstract class Hooks {
    mountWorkInProgressHook = (): Hook => {
        const hook: Hook = {
            next: null,
            memoizedState: null,
            baseState: null,
            queue: null,
            baseQueue: null,
        }
        if (hooksContext.current.workInProgressHook === null) {
            hooksContext.current.workInProgressHook = hook
            hooksContext.current.currentlyRenderingFiber.memoizedState = hook
        } else {
            hooksContext.current.workInProgressHook.next = hook
            hooksContext.current.workInProgressHook = hook
        }

        return hooksContext.current.workInProgressHook
    }

    updateWorkInProgressHook = (): Hook => {
        let nextCurrentHook: null | Hook

        if (hooksContext.current.currentHook === null) {
            const current = hooksContext.current.currentlyRenderingFiber.alternate
            if (current !== null) {
                nextCurrentHook = current.memoizedState
            } else {
                throw new Error('Not Implement')
            }
        } else {
            nextCurrentHook = hooksContext.current.currentHook.next
        }

        let nextWorkInProgressHook: Hook | null

        if (hooksContext.current.workInProgressHook === null) {
            nextWorkInProgressHook = hooksContext.current.currentlyRenderingFiber.memoizedState
        } else {
            nextWorkInProgressHook = hooksContext.current.workInProgressHook.next
        }

        if (nextWorkInProgressHook !== null) {
            throw new Error('Not Implement')
        } else {
            hooksContext.current.currentHook = nextCurrentHook!
            const newHook: Hook = {
                memoizedState: hooksContext.current.currentHook.memoizedState,
                baseState: hooksContext.current.currentHook.baseState,
                queue: hooksContext.current.currentHook.queue,
                next: null,
                baseQueue: hooksContext.current.currentHook.baseQueue,
            }

            if (hooksContext.current.workInProgressHook === null) {
                hooksContext.current.workInProgressHook = newHook
                hooksContext.current.currentlyRenderingFiber.memoizedState = newHook
            } else {
                hooksContext.current.workInProgressHook.next = newHook
                hooksContext.current.workInProgressHook = newHook

            }
        }

        return hooksContext.current.workInProgressHook
    }
}
