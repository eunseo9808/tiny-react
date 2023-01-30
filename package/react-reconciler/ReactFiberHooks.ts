import {Dispatcher, Fiber} from './ReactInternalTypes'
import {ReactSharedInternals} from '../shared/ReactInternalsTypes'
import {
    scheduleUpdateOnFiber,
} from './ReactFiberWorkLoop'
import {
    Lanes,
    NoLanes,
    SyncLane,
} from './ReactFiberLane'
import {markWorkInProgressReceivedUpdate} from './ReactFiberBeginWork'
import {
    Flags as FiberFlags,
    Passive as PassiveEffect,
    Update as UpdateEffect,
} from './ReactFiberFlags'
import {
    HookFlags,
    Passive as HookPassive,
    HasEffect as HookHasEffect,
} from './ReactHookEffectTags'

const {ReactCurrentDispatcher} = ReactSharedInternals
type BasicStateAction<S> = ((a: S) => S) | S

type Dispatch<A> = (a: A) => void

export type Hook = {
    next: Hook | null
    memoizedState: any
    baseState: any
    queue: UpdateQueue<any, any> | null
    baseQueue: Update<any, any> | null
}

export type FunctionComponentUpdateQueue = {
    lastEffect: Effect | null
}

export type Effect = {
    tag: HookFlags
    create: () => (() => void)
    destroy: (() => void) | undefined
    deps: unknown[] | null
    next: Effect
}

let workInProgressHook: Hook | null = null
let currentlyRenderingFiber: Fiber
let currentHook: Hook | null = null
let renderLanes: Lanes = NoLanes

const mountWorkInProgressHook = (): Hook => {
    const hook: Hook = {
        next: null,
        memoizedState: null,
        baseState: null,
        queue: null,
        baseQueue: null,
    }

    if (workInProgressHook === null) {
        currentlyRenderingFiber.memoizedState = workInProgressHook = hook
    } else {
        workInProgressHook = workInProgressHook.next = hook
    }

    return workInProgressHook
}

type Update<S, A> = {
    action: A
    next: Update<S, A>
}

export type UpdateQueue<S, A> = {
    pending: Update<S, A> | null
    lastRenderedReducer: ((s: S, a: A) => S) | null
    lastRenderedState: S | null
    dispatch: null | ((a: A) => any)
    interleaved: Update<S, A> | null
}

const dispatchAction = <S, A>(
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

    scheduleUpdateOnFiber(fiber, SyncLane)
}

const basicStateReducer = <S>(state: S, action: BasicStateAction<S>): S => {
    return typeof action === 'function' ? (action as (s: S) => S)(state) : action
}

const mountState = <S>(
    initialState: (() => S) | S
): [S, Dispatch<BasicStateAction<S>>] => {
    const hook = mountWorkInProgressHook()

    if (typeof initialState === 'function') {
        initialState = (initialState as () => S)()
    }

    hook.memoizedState = hook.baseState = initialState

    const queue = (hook.queue = {
        pending: null,
        lastRenderedReducer: basicStateReducer,
        lastRenderedState: initialState,
        dispatch: null,
        interleaved: null,
    })

    const dispatch: Dispatch<BasicStateAction<S>> = (queue.dispatch =
        dispatchAction.bind(null, currentlyRenderingFiber, queue) as any)

    return [hook.memoizedState, dispatch]
}

const updateWorkInProgressHook = (): Hook => {
    let nextCurrentHook: null | Hook

    if (currentHook === null) {
        const current = currentlyRenderingFiber.alternate
        if (current !== null) {
            nextCurrentHook = current.memoizedState
        } else {
            throw new Error('Not Implement')
        }
    } else {
        nextCurrentHook = currentHook.next
    }

    let nextWorkInProgressHook: Hook | null = null

    if (workInProgressHook === null) {
        nextWorkInProgressHook = currentlyRenderingFiber.memoizedState
    } else {
        nextWorkInProgressHook = workInProgressHook.next
    }

    if (nextWorkInProgressHook !== null) {
        throw new Error('Not Implement')
    } else {
        currentHook = nextCurrentHook!
        const newHook: Hook = {
            memoizedState: currentHook.memoizedState,
            baseState: currentHook.baseState,
            queue: currentHook.queue,
            next: null,
            baseQueue: currentHook.baseQueue,
        }

        if (workInProgressHook === null) {
            currentlyRenderingFiber.memoizedState = workInProgressHook = newHook
        } else {
            workInProgressHook = workInProgressHook.next = newHook
        }
    }

    return workInProgressHook
}

const updateReducer = <S, I, A>(
    reducer: (s: S, a: A) => S,
    initialArg: I,
    init?: (i: I) => S
): [S, Dispatch<A>] => {
    const hook = updateWorkInProgressHook()
    const queue = hook.queue!

    queue.lastRenderedReducer = reducer
    const current: Hook = currentHook as any

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
            markWorkInProgressReceivedUpdate()
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

const updateState = <S>(
    initialState: (() => S) | S
): [S, Dispatch<BasicStateAction<S>>] => {
    return updateReducer(basicStateReducer, initialState)
}

export const renderWithHooks = <Props, SecondArg>(
    current: Fiber | null,
    workInProgress: Fiber,
    Component: (p: Props, arg: SecondArg) => any,
    props: Props,
    secondArg: SecondArg,
) => {
    currentlyRenderingFiber = workInProgress

    workInProgress.updateQueue = null
    workInProgress.memoizedState = null
    workInProgress.lanes = NoLanes

    ReactCurrentDispatcher.current =
        current === null || current.memoizedState === null
            ? HooksDispatcherOnMount
            : HooksDispatcherOnUpdate
    let children = Component(props, secondArg)

    renderLanes = NoLanes
    currentlyRenderingFiber = null as any

    currentHook = null
    workInProgressHook = null

    return children
}

const areHookInputsEqual = (
    nextDeps: unknown[] | null,
    prevDeps: unknown[] | null
) => {
    if (prevDeps === null) {
        throw new Error('Not Implement')
    }

    for (let i = 0; i < prevDeps.length && i < nextDeps.length; ++i) {
        if (Object.is(nextDeps[i], prevDeps[i])) continue

        return false
    }

    return true
}

const updateEffectImpl = (
    fiberFlags: FiberFlags,
    hookFlags: HookFlags,
    create: () => (() => void),
    deps: unknown[] | null
): void => {
    const hook = updateWorkInProgressHook()
    const nextDeps = deps === undefined ? null : deps

    let destroy = undefined

    if (currentHook !== null) {
        const prevEffect = currentHook.memoizedState
        destroy = prevEffect.destroy
        if (nextDeps !== null) {
            const prevDeps = prevEffect.deps
            if (areHookInputsEqual(nextDeps, prevDeps)) {
                hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps)
                return
            }
        }
    }

    currentlyRenderingFiber.flags |= fiberFlags
    hook.memoizedState = pushEffect(
        HookHasEffect | hookFlags,
        create,
        destroy,
        nextDeps
    )
}

const updateEffect = (
    create: () => (() => void),
    deps: unknown[] | null
): void => {
    return updateEffectImpl(PassiveEffect, HookPassive, create, deps)
}

const pushEffect = (
    tag: HookFlags,
    create: Effect['create'],
    destroy: Effect['destroy'],
    deps: Effect['deps']
) => {

    const effect: Effect = {
        tag,
        create,
        destroy,
        deps,
        next: null as any,
    }

    let componentUpdateQueue: null | FunctionComponentUpdateQueue =
        currentlyRenderingFiber.updateQueue as any

    if (componentUpdateQueue === null) {
        componentUpdateQueue = {
            lastEffect: null,
        }
        currentlyRenderingFiber.updateQueue = componentUpdateQueue
        componentUpdateQueue.lastEffect = effect.next = effect
    } else {
        const lastEffect = componentUpdateQueue.lastEffect
        if (lastEffect === null) {
            componentUpdateQueue.lastEffect = effect.next = effect
        } else {
            const firstEffect = lastEffect.next
            lastEffect.next = effect
            effect.next = firstEffect
            componentUpdateQueue.lastEffect = effect
        }
    }

    return effect
}

const mountEffectImpl = (
    fiberFlags: FiberFlags,
    hookFlags: HookFlags,
    create: () => (() => void),
    deps: unknown[] | null
): void => {
    const hook = mountWorkInProgressHook()
    const nextDeps = deps === undefined ? null : deps
    currentlyRenderingFiber.flags |= fiberFlags
    hook.memoizedState = pushEffect(
        HookHasEffect | hookFlags,
        create,
        undefined,
        nextDeps
    )
}

const mountEffect = (
    create: () => (() => void),
    deps: unknown[] | null
) => {
    return mountEffectImpl(PassiveEffect, HookPassive, create, deps)
}

const HooksDispatcherOnMount: Dispatcher = {
    useState: mountState,
    useEffect: mountEffect,
}

const HooksDispatcherOnUpdate: Dispatcher = {
    useState: updateState,
    useEffect: updateEffect
}

export const bailoutHooks = (
    current: Fiber,
    workInProgress: Fiber
) => {
    workInProgress.updateQueue = current.updateQueue
    workInProgress.flags &= ~(PassiveEffect | UpdateEffect)

    current.lanes = NoLanes
}
