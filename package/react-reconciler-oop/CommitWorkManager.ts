import {HookFlags} from "./types/ReactHookEffectTags";
import {singleton} from "tsyringe";
import {FunctionComponentUpdateQueue} from "./types/RectHooksTypes";
import {Fiber} from "./types/ReactInternalTypes";
import {getComponent} from "./getComponent";

@singleton()
export class CommitWorkManager {
    commitWork = (current: Fiber | null, finishedWork: Fiber) => {
        getComponent(finishedWork.tag).commitWork(current, finishedWork)
    }
}
