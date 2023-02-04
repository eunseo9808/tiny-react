import {ReactComponent} from "./ReactComponent";
import {WorkTag} from "../types/ReactWorkTags";
import {HasEffect, HookFlags} from "../types/ReactHookEffectTags";
import {container, singleton} from "tsyringe";
import {BeginWorkManager} from "../BeginWorkManager";
import {NoLanes} from "../types/ReactFiberLane";
import {
    Passive as PassiveEffect,
    Update as UpdateEffect,
} from '../types/ReactFiberFlags'
import {ReactCurrentDispatcher} from "../../react/ReactCurrentDispatcher";

import {PassiveEffectManager} from "../PassiveEffectManager";
import {Dispatcher} from "../types/ReactHooksTypes";
import {HooksUseState} from "../hooks/HooksUseState";
import {HooksUseEffect} from "../hooks/HooksUseEffect";
import {Fiber} from "../ReactFiber";
import {hooksContext} from "../hooks/hooksContext";

@singleton()
export class FunctionComponent extends ReactComponent {
    static tag: WorkTag = 0

    constructor(private beginWorkManager?: BeginWorkManager,
                private passiveEffectManager?: PassiveEffectManager) {
        super()
    }


    commitWork(current: Fiber, finishedWork: Fiber): void {
        this.passiveEffectManager.commitHookEffectListUnmount(HasEffect, finishedWork)
    }

    completeWork(current: Fiber | null, workInProgress: Fiber): boolean {
        return this.bubbleProperties(workInProgress)
    }

    updateComponent(current: Fiber | null, workInProgress: Fiber): Fiber | null {
        const Component = workInProgress.type
        const nextProps = workInProgress.pendingProps

        const nextChildren = this.renderWithHooks(
            current,
            workInProgress,
            Component as any,
            nextProps,
            null
        )

        if (current !== null && !this.beginWorkManager.didReceiveUpdate) {
            this.bailoutHooks(current, workInProgress)
            return this.beginWorkManager.bailoutOnAlreadyFinishedWork(current, workInProgress)
        }

        this.reconcileChildren(current, workInProgress, nextChildren)
        return workInProgress.child
    }


    renderWithHooks = <Props, SecondArg>(
        current: Fiber | null,
        workInProgress: Fiber,
        Component: (p: Props, arg: SecondArg) => any,
        props: Props,
        secondArg: SecondArg,
    ) => {
        hooksContext.current.currentlyRenderingFiber = workInProgress

        workInProgress.updateQueue = null
        workInProgress.memoizedState = null
        workInProgress.lanes = NoLanes

        ReactCurrentDispatcher.current = this.getDispatcher(current)

        let children = Component(props, secondArg)

        hooksContext.current.renderLanes = NoLanes
        hooksContext.current.currentlyRenderingFiber = null
        hooksContext.current.currentHook = null
        hooksContext.current.workInProgressHook = null

        return children
    }

    bailoutHooks = (
        current: Fiber,
        workInProgress: Fiber
    ) => {
        workInProgress.updateQueue = current.updateQueue
        workInProgress.flags &= ~(PassiveEffect | UpdateEffect)

        current.lanes = NoLanes
    }


    getDispatcher(current: Fiber): Dispatcher {
        const useState = container.resolve(HooksUseState)
        const useEffect = container.resolve(HooksUseEffect)

        if (current === null || current.memoizedState === null) {
            return {
                useState: useState.mountState,
                useEffect: useEffect.mountEffect,
            }
        } else {
            return {
                useState: useState.updateState,
                useEffect: useEffect.updateEffect
            }
        }
    }
}
