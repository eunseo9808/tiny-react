import {Container} from "../react-dom-binding/shared/ContainerType";
import {NoLanes} from "./types/ReactFiberLane";

export class FiberRoot {
    pendingLanes = NoLanes
    finishedWork = null
    current = null as any

    constructor(public containerInfo: Container) {
    }
}
