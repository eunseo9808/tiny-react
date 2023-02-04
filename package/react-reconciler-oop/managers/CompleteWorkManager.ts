import {Fiber} from "../ReactFiber";
import {singleton} from "tsyringe";
import {ComponentProvider} from "../ComponentProvider";


@singleton()
export class CompleteWorkManager {
    constructor(private componentProvider?: ComponentProvider) {
    }

    completeWork = (
        current: Fiber | null,
        workInProgress: Fiber
    ): Fiber | null => {
        const component = this.componentProvider.getComponent(workInProgress.tag)
        component.completeWork(current, workInProgress)

        return null
    }
}
