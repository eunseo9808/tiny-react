import {singleton} from "tsyringe";


@singleton()
export class Scheduler {
    syncQueue: Array<Function> | null = null
    isFlushingSyncQueue: boolean = false

    scheduleSyncCallback = (callback: Function) => {
        if (this.syncQueue === null) {
            this.syncQueue = [callback]
        } else {
            this.syncQueue.push(callback)
        }
    }

    flushSyncCallbacks = () => {
        if (!this.isFlushingSyncQueue && this.syncQueue !== null) {
            this.isFlushingSyncQueue = true
            let i = 0
            try {

                for (; i < this.syncQueue.length; ++i) {
                    let callback: Function | null = this.syncQueue[i]
                    do {
                        callback = callback()
                    } while (callback !== null)
                }

                this.syncQueue = null
            } catch (error) {
                throw error
            } finally {
                this.isFlushingSyncQueue = false
            }
        }
    }
}

export const workLoopSchedule = {
    current: null
}
