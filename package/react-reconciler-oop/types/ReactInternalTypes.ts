import {Flags} from "./ReactFiberFlags";
import {Lanes} from "./ReactFiberLane";
import {WorkTag} from "./ReactWorkTags";

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
