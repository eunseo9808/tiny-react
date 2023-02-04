import {singleton} from "tsyringe";
import {getComponent} from "./getComponent";
import {Fiber} from "./ReactFiber";

@singleton()
export class CommitWorkManager {
    commitWork = (current: Fiber | null, finishedWork: Fiber) => {
        getComponent(finishedWork.tag).commitWork(current, finishedWork)
    }
}
