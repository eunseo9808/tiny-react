import {singleton} from "tsyringe";
import {Fiber} from "../ReactFiber";
import {ComponentProvider} from "../ComponentProvider";

@singleton()
export class CommitWorkManager {
    constructor(private componentProvider?: ComponentProvider) {
    }

    commitWork = (current: Fiber | null, finishedWork: Fiber) => {
        const component = this.componentProvider.getComponent(finishedWork.tag)
        component.commitWork(current, finishedWork)
    }
}
