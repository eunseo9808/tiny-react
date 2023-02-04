import {NoFlags, StaticMask, Update} from "../types/ReactFiberFlags";
import {NoLanes} from "../types/ReactFiberLane";
import {ChildReconciler} from "../ChildReconciler";
import {container} from "tsyringe";
import {Fiber} from "../ReactFiber";


interface IReactComponent {
    updateComponent: (current: Fiber | null, workInProgress: Fiber) => Fiber | null
    completeWork: (current: Fiber | null, workInProgress: Fiber) => boolean
    commitWork: (current: Fiber, finishedWork: Fiber) => void
}

export abstract class ReactComponent implements IReactComponent {
    reconcileChildren(
        current: Fiber | null,
        workInProgress: Fiber,
        nextChildren: any,
    ) {
        const childReconciler = container.resolve(ChildReconciler)

        if (current === null) childReconciler.shouldTrackSideEffects = false
        else childReconciler.shouldTrackSideEffects = true

        workInProgress.child = childReconciler.reconcileChildFibers(workInProgress,
            current?.child ?? null,
            nextChildren)
    }

    markUpdate(workInProgress: Fiber) {
        workInProgress.flags |= Update
    }

    bubbleProperties(completedWork: Fiber): boolean {
        const didBailout =
            completedWork.alternate !== null &&
            completedWork.alternate.child === completedWork.child
        let subtreeFlags = NoFlags
        let newChildLanes = NoLanes

        if (!didBailout) {
            let child = completedWork.child

            while (child !== null) {
                newChildLanes = child.lanes & child.childLanes

                subtreeFlags |= child.subtreeFlags
                subtreeFlags |= child.flags
                child.return = completedWork

                child = child.sibling
            }
            completedWork.subtreeFlags |= subtreeFlags
        } else {
            let child = completedWork.child

            while (child !== null) {
                newChildLanes = child.lanes & child.childLanes

                subtreeFlags |= child.subtreeFlags & StaticMask
                subtreeFlags |= child.flags & StaticMask

                child.return = completedWork

                child = child.sibling
            }

            completedWork.subtreeFlags |= subtreeFlags
        }

        completedWork.childLanes = newChildLanes
        return didBailout
    }

    abstract commitWork(current: Fiber, finishedWork: Fiber): void;

    abstract completeWork(current: Fiber | null, workInProgress: Fiber): boolean;

    abstract updateComponent(current: Fiber | null, workInProgress: Fiber): Fiber | null;

}
