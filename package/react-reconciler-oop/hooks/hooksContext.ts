import {Lanes, NoLanes} from "../types/ReactFiberLane";

import {Hook} from "../types/ReactHooksTypes";
import {Fiber} from "../ReactFiber";


type hooksContextType = {
    workInProgressHook?: Hook | null,
    currentlyRenderingFiber?: Fiber,
    currentHook?: Hook | null
    renderLanes?: Lanes
}

export const hooksContext: { current: hooksContextType | null } = {
    current: {
        workInProgressHook: null,
        currentlyRenderingFiber: null,
        currentHook: null,
        renderLanes: NoLanes
    }
}
