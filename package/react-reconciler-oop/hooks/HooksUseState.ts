import {NoLanes, SyncLane} from "../types/ReactFiberLane";
import {singleton} from "tsyringe";

import {BasicStateAction, Dispatch, Hook, Update, UpdateQueue} from "../types/ReactHooksTypes";
import {workLoopSchedule} from "../Scheduler";
import {Fiber} from "../ReactFiber";
import {Hooks} from "./Hooks";
import {hooksContext} from "./hooksContext";
import {didReceiveUpdate} from "../GlobalVariable";


@singleton()
export class HooksUseState extends Hooks {

    basicStateReducer = <S>(state: S, action: BasicStateAction<S>): S => {
        return typeof action === 'function' ? (action as (s: S) => S)(state) : action
    }

    dispatchAction = <S, A>(
        fiber: Fiber,
        queue: UpdateQueue<S, A>,
        action: A
    ) => {
        const alternate = fiber.alternate

        const update: Update<S, A> = {
            action,
            next: null as any
        }
        const pending = queue.pending
        if (pending === null) {
            update.next = update
        } else {
            update.next = pending.next
            pending.next = update
        }
        queue.pending = update

        if (
            fiber.lanes === NoLanes &&
            (alternate === null || alternate.lanes === NoLanes)
        ) {
            const lastRenderedReducer = queue.lastRenderedReducer

            if (lastRenderedReducer !== null) {
                try {
                    const currentState: S = queue.lastRenderedState as any
                    const eagerState = lastRenderedReducer(currentState, action)
                    if (Object.is(eagerState, currentState)) {
                        return
                    }
                } catch (error) {
                }
            }
        }

        workLoopSchedule.current(fiber)
    }

    mountState = <S>(
        initialState: (() => S) | S
    ): [S, Dispatch<BasicStateAction<S>>] => {
        const hook = this.mountWorkInProgressHook()

        if (typeof initialState === 'function') {
            initialState = (initialState as () => S)()
        }

        hook.memoizedState = hook.baseState = initialState

        const queue = (hook.queue = {
            pending: null,
            lastRenderedReducer: this.basicStateReducer,
            lastRenderedState: initialState,
            dispatch: null,
            interleaved: null,
        })

        const dispatch: Dispatch<BasicStateAction<S>> = (queue.dispatch =
            this.dispatchAction.bind(null, hooksContext.current.currentlyRenderingFiber, queue) as any)

        return [hook.memoizedState, dispatch]
    }

    updateReducer = <S, I, A>(
        reducer: (s: S, a: A) => S,
        initialArg: I,
        init?: (i: I) => S
    ): [S, Dispatch<A>] => {

        const hook = this.updateWorkInProgressHook()
        const queue = hook.queue!

        queue.lastRenderedReducer = reducer
        const current: Hook = hooksContext.current.currentHook as any

        let baseQueue = current.baseQueue

        const pendingQueue = queue.pending

        if (pendingQueue !== null) {
            if (baseQueue !== null) {
                const baseFirst = baseQueue.next

                const pendingFirst = pendingQueue.next

                baseQueue.next = pendingFirst
                pendingQueue.next = baseFirst
            }

            current.baseQueue = baseQueue = pendingQueue
            queue.pending = null
        }

        if (baseQueue !== null) {
            const first = baseQueue.next
            let newState = current.baseState

            let newBaseState = null
            let newBaseQueueFirst: Update<S, A> | null = null
            let newBaseQueueLast: Update<S, A> | null = null

            let update = first

            do {

                if (newBaseQueueLast !== null) {
                    const clone: Update<S, A> = {
                        action: update.action,
                        next: null as any,
                    }

                    newBaseQueueLast.next = clone
                    newBaseQueueLast = clone
                }

                const action = update.action
                newState = reducer(newState, action)

                update = update.next
            } while (update !== null && update !== first)

            if (newBaseQueueLast === null) {
                newBaseState = newState
            } else {
                newBaseQueueLast.next = newBaseQueueFirst!
            }

            if (!Object.is(newState, hook.memoizedState)) {
                didReceiveUpdate.current = true
            }

            hook.memoizedState = newState
            hook.baseState = newBaseState
            hook.baseQueue = newBaseQueueLast

            queue.lastRenderedState = newState
        }

        const lastInterleaved = queue.interleaved

        if (lastInterleaved !== null) {
            throw new Error('Not Implement')
        }

        const dispatch: Dispatch<A> = queue.dispatch!
        return [hook.memoizedState, dispatch]
    }

    updateState = <S>(
        initialState: (() => S) | S
    ): [S, Dispatch<BasicStateAction<S>>] => {
        return this.updateReducer(this.basicStateReducer, initialState)
    }
}
