import {NoLanes, SyncLane} from "../types/ReactFiberLane";
import {ReactFiberFactory} from "../ReactFiberFactory";
import {delay, inject, singleton} from "tsyringe";
import {Fiber} from "../ReactFiber";
import {ComponentProvider} from "../ComponentProvider";
import { didReceiveUpdate } from "../GlobalVariable";


@singleton()
export class BeginWorkManager {
    constructor(private reactFiberFactory?: ReactFiberFactory,
                private componentProvider?: ComponentProvider) {
    }

    beginWork = (
        current: Fiber | null,
        workInProgress: Fiber,
    ): Fiber | null => {
        if (current !== null) {
            const oldProps = current.memoizedProps
            const newProps = workInProgress.pendingProps

            if (oldProps !== newProps) {
                didReceiveUpdate.current = true
            } else if (workInProgress.lanes !== SyncLane) {
                didReceiveUpdate.current = false
                return this.bailoutOnAlreadyFinishedWork(current, workInProgress)
            }
        } else {
            didReceiveUpdate.current = false
        }
        workInProgress.lanes = NoLanes

        const component = this.componentProvider.getComponent(workInProgress.tag)
        return component.updateComponent(current, workInProgress)
    }

    bailoutOnAlreadyFinishedWork = (
        current: Fiber | null,
        workInProgress: Fiber
    ): Fiber | null => {
        if (workInProgress.childLanes !== SyncLane) return null

        this.reactFiberFactory.cloneChildFibers(current, workInProgress)
        return workInProgress.child
    }
}
