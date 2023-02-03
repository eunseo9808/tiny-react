import {ReactComponent} from "./ReactComponent";
import {WorkTag} from "../types/ReactWorkTags";
import {Fiber} from "../types/ReactInternalTypes";
import {singleton} from "tsyringe";


@singleton()
export class FragmentComponent extends ReactComponent {
    static tag: WorkTag = 7

    commitWork(current: Fiber, finishedWork: Fiber): void {
    }

    completeWork(): boolean {
        return false
    }

    updateComponent(current: Fiber | null, workInProgress: Fiber): Fiber | null {
        const nextChildren = workInProgress.pendingProps
        this.reconcileChildren(current, workInProgress, nextChildren)
        return workInProgress.child
    }
}
