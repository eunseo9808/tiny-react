import {ReactElement} from "../shared/ReactTypes";
import {Container} from "../react-dom-binding/shared/ContainerType";
import {SyncLane} from "./types/ReactFiberLane";
import {singleton} from "tsyringe";
import {ReactFiberFactory} from "./ReactFiberFactory";
import {WorkManager} from "./managers/WorkManager";
import {FiberRoot} from "./ReactFiberRoot";
import {Fiber} from "./ReactFiber";

@singleton()
export class ContainerFactory {
    constructor(private reactFiberFactory?: ReactFiberFactory,
                private workManager?: WorkManager) {
    }

    public createContainer = (
        containerInfo: Container,
    ): FiberRoot => {
        return this.reactFiberFactory.createFiberRoot(containerInfo)
    }

    public updateContainer = (
        element: ReactElement,
        container: FiberRoot
    ) => {
        const current: Fiber = container.current
        current.memoizedState = { element }
        this.workManager.scheduleUpdateOnFiber(SyncLane, current)
    }
}

