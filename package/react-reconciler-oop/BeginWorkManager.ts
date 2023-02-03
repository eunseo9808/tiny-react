import {NoLanes, SyncLane} from "./types/ReactFiberLane";
import {ReactFiberFactory} from "./ReactFiberFactory";
import {inject, injectable, singleton} from "tsyringe";
import {Fiber} from "./types/ReactInternalTypes";

@singleton()
export class BeginWorkManager {
    constructor(private reactFiberFactory?: ReactFiberFactory) {
    }

    didReceiveUpdate = false

    bailoutOnAlreadyFinishedWork = (
        current: Fiber | null,
        workInProgress: Fiber
    ): Fiber | null => {
        if (workInProgress.childLanes !== SyncLane) return null

        this.reactFiberFactory.cloneChildFibers(current, workInProgress)
        return workInProgress.child
    }

    markWorkInProgressReceivedUpdate = () => {
        this.didReceiveUpdate = true
    }
}
