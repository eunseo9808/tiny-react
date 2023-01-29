import {
    scheduleMicrotask
} from './ReactFiberHostConfig'
import {createWorkInProgress} from './ReactFiber'
import {beginWork} from './ReactFiberBeginWork'
import {
    commitBeforeMutationEffects,
    commitMutationEffects,
    commitPassiveMountEffects,
    commitPassiveUnmountEffects,
} from './ReactFiberCommitWork'
import {completeWork} from './ReactFiberCompleteWork'
import {MutationMask, NoFlags, PassiveMask} from './ReactFiberFlags'
import {
    Lane,
    Lanes,
    markRootFinished,
    markRootUpdated,
    NoLanes,
    SyncLane,
} from './ReactFiberLane'
import {
    flushSyncCallbacks,
    scheduleSyncCallback,
} from './ReactFiberSyncTaskQueue'
import {Fiber, FiberRoot} from './ReactInternalTypes'
import {HostRoot} from './ReactWorkTags'


type ExecutionContext = number
export const NoContext = /*             */ 0b000000
const BatchedContext = /*               */ 0b000001
const EventContext = /*                 */ 0b000010
const LegacyUnbatchedContext = /*       */ 0b000100
const RenderContext = /*                */ 0b001000
const CommitContext = /*                */ 0b010000

type RootExitStatus = 5 | 0
const RootIncomplete = 0
const RootCompleted = 5

let executionContext: ExecutionContext = NoContext

let workInProgressRoot: FiberRoot | null = null
let workInProgress: Fiber | null = null
let workInProgressRootRenderLanes: Lanes = NoLanes

let rootDoesHavePassiveEffects: boolean = false
let rootWithPendingPassiveEffects: FiberRoot | null = null

export let subtreeRenderLanes: Lanes = NoLanes

const completeUnitOfWork = (unitOfWork: Fiber): void => {
    let completedWork: Fiber | null = unitOfWork

    do {
        const current = completedWork.alternate

        const returnFiber: Fiber | null = completedWork.return

        let next = completeWork(current, completedWork)

        const siblingFiber = completedWork.sibling
        if (siblingFiber !== null) {
            workInProgress = siblingFiber
            return
        }

        completedWork = returnFiber
        workInProgress = completedWork
    } while (completedWork !== null)
}

const performUnitOfWork = (unitOfWork: Fiber): void => {
    const current = unitOfWork.alternate

    let next: Fiber | null = null

    next = beginWork(current, unitOfWork, subtreeRenderLanes)

    unitOfWork.memoizedProps = unitOfWork.pendingProps
    if (next === null) {
        completeUnitOfWork(unitOfWork)
    } else {
        workInProgress = next
    }
}

const prepareFreshStack = (root: FiberRoot, lanes: Lanes) => {
    root.finishedWork = null

    workInProgressRoot = root
    workInProgress = createWorkInProgress(root.current, null)
    workInProgressRootRenderLanes = subtreeRenderLanes = lanes
}

const flushPassiveEffectsImpl = () => {
    if (rootWithPendingPassiveEffects === null) return false

    const root = rootWithPendingPassiveEffects
    rootWithPendingPassiveEffects = null

    const prevExecutionContext = executionContext
    executionContext |= CommitContext
    commitPassiveUnmountEffects(root.current)
    commitPassiveMountEffects(root, root.current)

    executionContext = prevExecutionContext

    flushSyncCallbacks()

    return true
}


export const flushPassiveEffects = (): boolean => {
    if (rootWithPendingPassiveEffects !== null) {
        try {
            return flushPassiveEffectsImpl()
        } finally {
        }
    }

    return false
}

const renderRootSync = (root: FiberRoot, lanes: Lanes) => {
    const prevExecutionContext = executionContext
    executionContext |= RenderContext

    if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
        prepareFreshStack(root, lanes)
    }

    while (workInProgress !== null) {
        performUnitOfWork(workInProgress)
    }

    executionContext = prevExecutionContext

    workInProgressRoot = null
    workInProgressRootRenderLanes = NoLanes
}

const commitRootImpl = (root: FiberRoot): null => {
    do {
        flushPassiveEffects()
    } while (rootWithPendingPassiveEffects !== null)

    const finishedWork = root.finishedWork

    if (finishedWork === null) return null

    root.finishedWork = null

    root.callbackNode = null
    markRootFinished(root)

    workInProgressRoot = null
    workInProgress = null

    if (
        (finishedWork.subtreeFlags & PassiveMask) !== NoFlags ||
        (finishedWork.flags & PassiveMask) !== NoFlags
    ) {
        if (!rootDoesHavePassiveEffects) {
            rootDoesHavePassiveEffects = true
            scheduleCallback(
                () => {
                    flushPassiveEffects()
                    return null
                },
                null
            )
        }
    }

    const subtreeHasEffects =
        (finishedWork.subtreeFlags & MutationMask) !== NoFlags
    const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags

    if (rootHasEffect || subtreeHasEffects) {
        commitBeforeMutationEffects(root, finishedWork)

        commitMutationEffects(root, finishedWork)

        root.current = finishedWork
    } else {
        root.current = finishedWork
    }

    const rootDidHavePassiveEffects = rootDoesHavePassiveEffects

    if (rootDidHavePassiveEffects) {
        rootDoesHavePassiveEffects = false
        rootWithPendingPassiveEffects = root
    }

    ensureRootIsScheduled(root)

    return null
}

const commitRoot = (root: FiberRoot): null => {
    commitRootImpl(root)
    return null
}

export const performSyncWorkOnRoot = (root: FiberRoot) => {
    const lanes = root.pendingLanes

    if (lanes !== SyncLane) return null

    const exitStatus = renderRootSync(root, lanes)

    const finishedWork: Fiber | null = root.current.alternate

    root.finishedWork = finishedWork

    commitRoot(root)

    return null
}


const ensureRootIsScheduled = (root: FiberRoot) => {
    const existingCallbackNode = root.callbackNode

    const nextLanes = workInProgressRootRenderLanes

    if (nextLanes === NoLanes) {
        if (existingCallbackNode !== null) {
            throw new Error('Not Implement')
        }
        root.callbackNode = null
        return
    }

    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root))
    scheduleMicrotask(flushSyncCallbacks)
}


export const requestEventTime = () => {
    if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
        throw new Error('Not Implement')
    }
}

export const scheduleUpdateOnFiber = (
    root: FiberRoot,
    fiber: Fiber,
    lane: Lane
): FiberRoot | null => {

    if (root === null) {
        return null
    }

    markRootUpdated(root, lane)

    if (root === workInProgressRoot) {
        // throw new Error('Not Implement')
    }

    if (lane === SyncLane) {
        if (
            (executionContext & LegacyUnbatchedContext) !== NoContext &&
            (executionContext & (RenderContext | CommitContext)) === NoContext
        ) {
            performSyncWorkOnRoot(root)
        } else {
            ensureRootIsScheduled(root)

            if (
                executionContext === NoContext
            ) {
                throw new Error('Not Implement')
            }
        }
    } else {
        ensureRootIsScheduled(root)
    }

    return root
}

// export const batchedEventUpdates = <A, R>(fn: (a: A) => R, a: A): R => {
//     const prevExecutionContext = executionContext
//     executionContext |= EventContext
//     try {
//         return fn(a)
//     } finally {
//         executionContext = prevExecutionContext
//     }
// }


