import {createFiberRoot} from './ReactFiberRoot'
import {Fiber, FiberRoot} from './ReactInternalTypes'
import {createUpdate, enqueueUpdate} from "./ReactUpdateQueue";
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
    // const lane = requestUpdateLane(current)
    const update = createUpdate()

    update.payload = {element}
    enqueueUpdate(current, update)

    scheduleUpdateOnFiber(current, SyncLane)
}


// export { discreteUpdates, batchedEventUpdates }
