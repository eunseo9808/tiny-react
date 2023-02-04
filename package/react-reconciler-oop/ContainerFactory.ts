import {ReactElement} from "../shared/ReactTypes";
import {Container} from "../react-dom-binding/shared/ContainerType";
import {SyncLane} from "./types/ReactFiberLane";
import {container, inject, injectable, Lifecycle, scoped, singleton} from "tsyringe";
import {ReactFiberFactory} from "./ReactFiberFactory";
import {WorkManager} from "./WorkManager";
import {Fiber, FiberRoot} from "./types/ReactInternalTypes";

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

