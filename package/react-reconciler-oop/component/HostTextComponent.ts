import {ReactComponent} from "./ReactComponent";
import {WorkTag} from "../types/ReactWorkTags";
import {commitTextUpdate, createTextInstance, prepareUpdate, Props} from "../../react-dom-binding/ReactDOMHostConfig";
import {singleton} from "tsyringe";
import {Fiber} from "../ReactFiber";

@singleton()
export class HostTextComponent extends ReactComponent {
    static tag: WorkTag = 6

    updateHostText = (
        current: Fiber,
        workInProgress: Fiber,
        oldText: string,
        newText: string
    ) => {
        if (oldText !== newText) {
            this.markUpdate(workInProgress)
        }
    }

    commitWork(current: Fiber, finishedWork: Fiber): void {
        const textInstance: Text = finishedWork.stateNode
        const newText = finishedWork.memoizedProps

        const oldText = current !== null ? current.memoizedProps : newText

        commitTextUpdate(textInstance, oldText, newText)
    }

    completeWork(current: Fiber | null, workInProgress: Fiber): boolean {
        const newProps = workInProgress.pendingProps
        const newText = newProps

        if (current && workInProgress.stateNode !== null) {
            const oldText = current.memoizedProps
            this.updateHostText(current, workInProgress, oldText, newText)
        } else {
            workInProgress.stateNode = createTextInstance(newText)
        }
        return this.bubbleProperties(workInProgress)
    }

    updateComponent(): Fiber | null {
        return null;
    }
}
