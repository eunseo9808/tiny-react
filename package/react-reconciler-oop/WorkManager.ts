import {Lane, Lanes, markRootFinished, markRootUpdated, NoLanes, SyncLane} from "./types/ReactFiberLane";

import {MutationMask, NoFlags, PassiveMask} from "./types/ReactFiberFlags";
import {HostRootComponent} from "./component/HostRootComponent";
import {singleton} from "tsyringe";
import {BeginWorkManager} from "./BeginWorkManager";
import {ReactFiberFactory} from "./ReactFiberFactory";
import {MutationEffectManager} from "./MutationEffectManager";
import {PassiveEffectManager} from "./PassiveEffectManager";
import {Scheduler, workLoopSchedule} from "./Scheduler";
import {Fiber, FiberRoot} from "./types/ReactInternalTypes";
import {getComponent} from "./getComponent";

@singleton()
export class WorkManager {
    public constructor(private beginWorkManager?: BeginWorkManager,
                       private reactFiberFactory?: ReactFiberFactory,
                       private mutationEffectManager?: MutationEffectManager,
                       private passiveEffectManager?: PassiveEffectManager,
                       private scheduler?: Scheduler) {
    }

    workInProgressRoot: FiberRoot | null = null
    workInProgress: Fiber | null = null
    workInProgressRootRenderLanes: Lanes = NoLanes

    rootDoesHavePassiveEffects: boolean = false
    rootWithPendingPassiveEffects: FiberRoot | null = null

    subtreeRenderLanes: Lanes = NoLanes

    completeUnitOfWork = (unitOfWork: Fiber): void => {
        let completedWork: Fiber | null = unitOfWork

        do {
            const current = completedWork.alternate

            const returnFiber: Fiber | null = completedWork.return

            let next = this.completeWork(current, completedWork)

            const siblingFiber = completedWork.sibling
            if (siblingFiber !== null) {
                this.workInProgress = siblingFiber
                return
            }

            completedWork = returnFiber
            this.workInProgress = completedWork
        } while (completedWork !== null)
    }

    performUnitOfWork = (unitOfWork: Fiber): void => {
        const current = unitOfWork.alternate

        let next: Fiber | null = null

        next = this.beginWork(current, unitOfWork)
        unitOfWork.memoizedProps = unitOfWork.pendingProps
        if (next === null) {
            this.completeUnitOfWork(unitOfWork)
        } else {
            this.workInProgress = next
        }
    }

    prepareFreshStack = (root: FiberRoot, lanes: Lanes) => {
        root.finishedWork = null

        this.workInProgressRoot = root
        this.workInProgress = this.reactFiberFactory.createWorkInProgress(root.current, null)
        this.workInProgressRootRenderLanes = this.subtreeRenderLanes = lanes
    }

    flushPassiveEffectsImpl = () => {
        if (this.rootWithPendingPassiveEffects === null) return false

        const root = this.rootWithPendingPassiveEffects
        this.rootWithPendingPassiveEffects = null

        this.passiveEffectManager.commitPassiveUnmountEffects(root.current)
        this.passiveEffectManager.commitPassiveMountEffects(root, root.current)

        this.scheduler.flushSyncCallbacks()

        return true
    }


    flushPassiveEffects = (): boolean => {
        if (this.rootWithPendingPassiveEffects !== null) {
            try {
                return this.flushPassiveEffectsImpl()
            } finally {
            }
        }

        return false
    }

    renderRootSync = (root: FiberRoot, lanes: Lanes) => {
        if (this.workInProgressRoot !== root || this.workInProgressRootRenderLanes !== lanes) {
            this.prepareFreshStack(root, lanes)
        }

        while (this.workInProgress !== null) {
            this.performUnitOfWork(this.workInProgress)
        }

        this.workInProgressRoot = null
        this.workInProgressRootRenderLanes = NoLanes
    }

    commitRootImpl = (root: FiberRoot): null => {
        do {
            this.flushPassiveEffects()
        } while (this.rootWithPendingPassiveEffects !== null)

        const finishedWork = root.finishedWork

        if (finishedWork === null) return null

        root.finishedWork = null

        markRootFinished(root)

        this.workInProgressRoot = null
        this.workInProgress = null

        if (
            (finishedWork.subtreeFlags & PassiveMask) !== NoFlags ||
            (finishedWork.flags & PassiveMask) !== NoFlags
        ) {
            if (!this.rootDoesHavePassiveEffects) {
                this.rootDoesHavePassiveEffects = true
                setTimeout(() => this.flushPassiveEffects(), 0)
            }
        }

        const subtreeHasEffects =
            (finishedWork.subtreeFlags & MutationMask) !== NoFlags
        const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags

        if (rootHasEffect || subtreeHasEffects) {
            this.mutationEffectManager.commitBeforeMutationEffects(root, finishedWork)
            this.mutationEffectManager.commitMutationEffects(root, finishedWork)

            root.current = finishedWork
        } else {
            root.current = finishedWork
        }

        const rootDidHavePassiveEffects = this.rootDoesHavePassiveEffects

        if (rootDidHavePassiveEffects) {
            this.rootDoesHavePassiveEffects = false
            this.rootWithPendingPassiveEffects = root
        }

        return null
    }

    commitRoot = (root: FiberRoot): null => {
        this.commitRootImpl(root)
        return null
    }

    performSyncWorkOnRoot = (root: FiberRoot) => {
        const lanes = root.pendingLanes
        if (lanes !== SyncLane) return null

        this.renderRootSync(root, lanes)

        const finishedWork: Fiber | null = root.current.alternate
        root.finishedWork = finishedWork
        this.commitRoot(root)

        return null
    }

    markUpdateLaneFromFiberToRoot = (
        sourceFiber: Fiber,
        lane: Lane
    ): FiberRoot | null => {
        sourceFiber.lanes = sourceFiber.lanes | lane
        let alternate = sourceFiber.alternate

        if (alternate !== null) {
            alternate.lanes = sourceFiber.lanes | lane
        }

        let node = sourceFiber
        let parent = sourceFiber.return

        while (parent !== null) {
            parent.childLanes = sourceFiber.lanes | lane
            alternate = parent.alternate

            if (alternate !== null) {
                alternate.childLanes = sourceFiber.lanes | lane
            }

            node = parent
            parent = node.return
        }

        if (node.tag === HostRootComponent.tag) {
            const root: FiberRoot = node.stateNode
            return root
        } else {
            return null
        }
    }

    scheduleUpdateOnFiber = (
        lane: Lane,
        fiber: Fiber
    ): FiberRoot | null => {
        const root = this.markUpdateLaneFromFiberToRoot(fiber, lane)

        if (root === null) {
            return null
        }
        markRootUpdated(root, lane)

        this.scheduler.scheduleSyncCallback(this.performSyncWorkOnRoot.bind(this, root))
        setTimeout(() => this.scheduler.flushSyncCallbacks(), 0)
        return root
    }

    beginWork = (
        current: Fiber | null,
        workInProgress: Fiber,
    ): Fiber | null => {
        if (current !== null) {
            const oldProps = current.memoizedProps
            const newProps = workInProgress.pendingProps

            if (oldProps !== newProps) {
                this.beginWorkManager.didReceiveUpdate = true
            } else if (workInProgress.lanes !== SyncLane) {
                this.beginWorkManager.didReceiveUpdate = false
                return this.beginWorkManager.bailoutOnAlreadyFinishedWork(current, workInProgress)
            }
        } else {
            this.beginWorkManager.didReceiveUpdate = false
        }
        workInProgress.lanes = NoLanes

        workLoopSchedule.current = this.scheduleUpdateOnFiber.bind(this, SyncLane)

        return getComponent(workInProgress.tag).updateComponent(current, workInProgress)
    }

    completeWork = (
        current: Fiber | null,
        workInProgress: Fiber
    ): Fiber | null => {
        getComponent(workInProgress.tag).completeWork(current, workInProgress)
        return
    }
}
