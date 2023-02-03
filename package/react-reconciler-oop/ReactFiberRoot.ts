import {Container} from "../react-dom-binding/shared/ContainerType";
import {NoLanes} from "./types/ReactFiberLane";

export class FiberRootNode {
    pendingLanes = NoLanes
    finishedWork = null
    current = null as any

    constructor(public containerInfo: Container) {
    }
}
