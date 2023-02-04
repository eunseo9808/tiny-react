import {HookFlags} from "./ReactHookEffectTags";

export type Dispatch<A> = (a: A) => void
export type BasicStateAction<S> = ((a: S) => S) | S

export type Dispatcher = {
    useState<S>(initialState: (() => S) | S): [S, Dispatch<BasicStateAction<S>>]
    useEffect(
        create: () => (() => void) | void,
        deps: unknown[] | void | null
    ): void
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

export type Hook = {
    next: Hook | null
    memoizedState: any
    baseState: any
    queue: UpdateQueue<any, any> | null
    baseQueue: Update<any, any> | null
}

export type Update<S, A> = {
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
