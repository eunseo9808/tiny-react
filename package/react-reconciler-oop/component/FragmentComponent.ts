import {ReactComponent} from "./ReactComponent";
import {WorkTag} from "../types/ReactWorkTags";
import {singleton} from "tsyringe";
import {Fiber} from "../ReactFiber";


@singleton()
export class FragmentComponent extends ReactComponent {
    static tag: WorkTag = 7

    commitWork(current: Fiber, finishedWork: Fiber): void {
    }

    completeWork(current: Fiber | null, workInProgress: Fiber): boolean {
        return this.bubbleProperties(workInProgress)
    }

    updateComponent(current: Fiber | null, workInProgress: Fiber): Fiber | null {
        const nextChildren = workInProgress.pendingProps
        this.reconcileChildren(current, workInProgress, nextChildren)
        return workInProgress.child
    }
}
