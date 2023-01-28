import {FiberRoot} from "./ReactInternalTypes";
import {createHostRootFiber} from "./ReactFiber";
import {NoLanes} from "./ReactFiberLane";
import {initializeUpdateQueue} from "./ReactUpdateQueue";

class FiberRootNode {
    callbackNode = null
    pendingLanes = NoLanes
    finishedWork = null
    current = null as any

    constructor(public containerInfo: any) {
    }
}

export const createFiberRoot = (
    containerInfo: any,
): FiberRoot => {
    const root: FiberRoot = new FiberRootNode(containerInfo)

    const uninitializedFiber = createHostRootFiber()
    root.current = uninitializedFiber
    uninitializedFiber.stateNode = root

    initializeUpdateQueue(uninitializedFiber)

    return root
}
