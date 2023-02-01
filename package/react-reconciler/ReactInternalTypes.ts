import {Flags} from './ReactFiberFlags'
import {WorkTag} from './ReactWorkTags'
import {Lanes} from "./ReactFiberLane";

export type FiberRoot = {
    finishedWork: Fiber | null
    current: Fiber
    containerInfo: any
    pendingLanes: Lanes
}

export type Fiber = {
    index: number
    deletions: Fiber[] | null
    subtreeFlags: Flags
    flags: Flags
    pendingProps: any
    memoizedProps: any
    child: Fiber | null
    sibling: Fiber | null
    memoizedState: any
    stateNode: any
    updateQueue: unknown
    tag: WorkTag
    return: Fiber | null
    alternate: Fiber | null
    key: string | null
    type: any
    lanes: Lanes
    childLanes: Lanes
    elementType: any
}

type Dispatch<A> = (a: A) => void
type BasicStateAction<S> = ((a: S) => S) | S

export type Dispatcher = {
    useState<S>(initialState: (() => S) | S): [S, Dispatch<BasicStateAction<S>>]
    useEffect(
        create: () => (() => void) | void,
        deps: unknown[] | void | null
    ): void
}
