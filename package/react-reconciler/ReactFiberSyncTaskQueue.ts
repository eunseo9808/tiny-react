let syncQueue: Array<Function> | null = null
let isFlushingSyncQueue: boolean = false

export const scheduleSyncCallback = (callback: Function) => {
    if (syncQueue === null) {
        syncQueue = [callback]
    } else {
        syncQueue.push(callback)
    }
}

export const flushSyncCallbacks = () => {
    if (!isFlushingSyncQueue && syncQueue !== null) {
        isFlushingSyncQueue = true
        let i = 0
        try {

            for (; i < syncQueue.length; ++i) {
                let callback: Function | null = syncQueue[i]
                do {
                    callback = callback()
                } while (callback !== null)
            }

            syncQueue = null
        } catch (error) {
            throw error
        } finally {
            isFlushingSyncQueue = false
        }
    }
}
