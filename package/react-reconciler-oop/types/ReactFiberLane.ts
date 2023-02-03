import {FiberRoot} from "./ReactInternalTypes";


export type Lanes = number
export type Lane = number

export const NoLane: Lane = /*                         */ 0b0000000000000000000000000000000
export const NoLanes: Lane = /*                         */ 0b0000000000000000000000000000000
export const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000001

export const markRootUpdated = (
    root: FiberRoot,
    updateLane: Lane,
): void => {
    root.pendingLanes |= updateLane
}

export const markRootFinished = (root: FiberRoot) => {
    root.pendingLanes = NoLanes
}
