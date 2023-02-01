import {createFiberRoot} from './ReactFiberRoot'
import {Fiber, FiberRoot} from './ReactInternalTypes'
import {ReactElement} from "../shared/ReactTypes";
import {Container} from "../react-dom-binding/shared/ContainerType";
import {scheduleUpdateOnFiber} from "./ReactFiberWorkLoop";
import {SyncLane} from "./ReactFiberLane";
// import { discreteUpdates, batchedEventUpdates } from './ReactFiberWorkLoop'

export const createContainer = (
    containerInfo: Container,
): FiberRoot => {
    return createFiberRoot(containerInfo)
}

export const updateContainer = (
    element: ReactElement,
    container: FiberRoot
) => {
    const current: Fiber = container.current
    current.memoizedState = { element }

    scheduleUpdateOnFiber(current, SyncLane)
}


// export { discreteUpdates, batchedEventUpdates }
