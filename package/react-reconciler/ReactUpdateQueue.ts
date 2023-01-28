import {Fiber} from './ReactInternalTypes'

export type SharedQueue = {
    pending: Update | null
}

export type UpdateQueue<State> = {
    baseState: State
    shared: SharedQueue
    firstBaseUpdate: Update | null
    lastBaseUpdate: Update | null
}

export const UpdateState = 0

export type Update = {
    payload: any
    next: null | Update
    tag: 0 | 1 | 2 | 3
}

export const initializeUpdateQueue = <State>(fiber: Fiber): void => {
    const queue: UpdateQueue<State> = {
        baseState: fiber.memoizedState,
        shared: {
            pending: null,
        },
        lastBaseUpdate: null,
        firstBaseUpdate: null,
    }

    fiber.updateQueue = queue
}

export const createUpdate = (): Update => {
    const update: Update = {
        payload: null,
        next: null,
        tag: UpdateState,
    }
    return update
}

export const enqueueUpdate = (fiber: Fiber, update: Update): void => {
    const updateQueue = fiber.updateQueue
    if (!updateQueue) return

    const sharedQueue: SharedQueue = (updateQueue as any).shared

    const pending: Update | null = sharedQueue.pending

    if (pending === null) {
        update.next = update
    } else {
        update.next = pending.next
        pending.next = update
    }

    sharedQueue.pending = update
}

export const cloneUpdateQueue = <State>(
    current: Fiber,
    workInProgress: Fiber
): void => {
    const queue: UpdateQueue<State> = workInProgress.updateQueue as any

    const currentQueue: UpdateQueue<State> = current.updateQueue as any

    if (queue === currentQueue) {
        const clone: UpdateQueue<State> = {
            shared: currentQueue.shared,
            firstBaseUpdate: currentQueue.firstBaseUpdate,
            lastBaseUpdate: currentQueue.lastBaseUpdate,
            baseState: currentQueue.baseState,
        }

        workInProgress.updateQueue = clone
    }
}

export const processUpdateQueue = <State>(
    workInProgress: Fiber,
    props: any,
    instance: any
) => {
    const queue: UpdateQueue<State> = workInProgress.updateQueue as any


    let firstBaseUpdate = queue.firstBaseUpdate
    let lastBaseUpdate = queue.lastBaseUpdate

    let pendingQueue = queue.shared.pending
    if (pendingQueue !== null) {
        queue.shared.pending = null

        const lastPendingUpdate = pendingQueue
        const firstPendingUpdate = lastPendingUpdate.next
        lastPendingUpdate.next = null

        if (lastBaseUpdate === null) {
            firstBaseUpdate = firstPendingUpdate
        } else {
            lastBaseUpdate.next = firstPendingUpdate
        }

        lastBaseUpdate = lastPendingUpdate

        const current = workInProgress.alternate
        if (current !== null) {
            const currentQueue: UpdateQueue<State> = current.updateQueue as any
            const currentLastBaseUpdate = currentQueue.lastBaseUpdate

            if (currentLastBaseUpdate !== lastBaseUpdate) {
                if (currentLastBaseUpdate === null) {
                    currentQueue.firstBaseUpdate = firstPendingUpdate
                } else {
                    currentLastBaseUpdate.next = firstPendingUpdate
                }
                currentQueue.lastBaseUpdate = lastPendingUpdate
            }
        }
    }

    if (firstBaseUpdate !== null) {
        let newState = queue.baseState

        let newBaseState = null
        let newFirstBaseUpdate = null
        let newLastBaseUpdate = null

        let update: Update | null = firstBaseUpdate

        do {
            newState = getStateFromUpdate(
                workInProgress,
                queue,
                update!,
                newState,
                props,
                instance
            )
            update = update!.next

            if (update === null) {
                pendingQueue = queue.shared.pending
                if (pendingQueue === null) break
                else {
                    const lastPendingUpdate = pendingQueue
                    const firstPendingUpdate = lastPendingUpdate.next
                    lastPendingUpdate.next = null

                    update = firstPendingUpdate
                    queue.lastBaseUpdate = lastPendingUpdate
                    queue.shared.pending = null
                }
            }
        } while (true)

        if (newLastBaseUpdate === null) {
            newBaseState = newState
        }

        queue.baseState = newBaseState as any

        queue.firstBaseUpdate = newFirstBaseUpdate
        queue.lastBaseUpdate = newLastBaseUpdate

        workInProgress.memoizedState = newState
    }
}

export const getStateFromUpdate = <State>(
    _workInProgress: Fiber,
    _queue: UpdateQueue<State>,
    update: Update,
    prevState: State,
    nextProps: any,
    instance: any
): any => {
    switch (update.tag) {
        case UpdateState: {
            const payload = update.payload
            let partialState
            if (typeof payload === 'function') {
                partialState = payload.call(instance, prevState, nextProps)
            } else {
                partialState = payload
            }

            if (partialState === null || partialState === undefined) {
                return prevState
            }

            return Object.assign({}, prevState, partialState)
        }
    }
}
