import {Flags} from './types/ReactFiberFlags'
import {NoLanes} from "./types/ReactFiberLane";
import {WorkTag} from "./types/ReactWorkTags";

export class Fiber {
    stateNode: any = null
    updateQueue: unknown = null
    return: Fiber = null
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
        public pendingProps: any,
        public key: null | string,
    ) {
    }
}
