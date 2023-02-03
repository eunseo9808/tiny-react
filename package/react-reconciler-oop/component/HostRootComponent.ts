import {ReactComponent} from "./ReactComponent";
import {WorkTag} from "../types/ReactWorkTags";
import {Fiber} from "../types/ReactInternalTypes";
import {singleton} from "tsyringe";

@singleton()
export class HostRootComponent extends ReactComponent {
    static tag: WorkTag = 3

    commitWork(current: Fiber, finishedWork: Fiber): void {
    }

    completeWork(current: Fiber | null, workInProgress: Fiber): boolean {
        return this.bubbleProperties(workInProgress)
    }

    updateComponent(current: Fiber | null, workInProgress: Fiber): Fiber | null {

        const nextChildren = workInProgress.memoizedState.element
        this.reconcileChildren(current, workInProgress, nextChildren)

        return workInProgress.child
    }
}
