import {inject, injectable, singleton} from "tsyringe";
import {HooksContext} from "./HooksContext";
import {
    HookFlags,
    Passive as HookPassive,
    HasEffect as HookHasEffect,
} from '../types/ReactHookEffectTags'

import {
    Flags as FiberFlags,
    Passive as PassiveEffect,
} from '../types/ReactFiberFlags'
import {Effect, FunctionComponentUpdateQueue} from "../types/RectHooksTypes";

@singleton()
export class HooksUseEffect {
    constructor(private hooksContext?: HooksContext) {
    }

    areHookInputsEqual = (
        nextDeps: unknown[] | null,
        prevDeps: unknown[] | null
    ) => {
        if (prevDeps === null) {
            throw new Error('Not Implement')
        }

        for (let i = 0; i < prevDeps.length && i < nextDeps.length; ++i) {
            if (Object.is(nextDeps[i], prevDeps[i])) continue

            return false
        }

        return true
    }

    updateEffectImpl = (
        fiberFlags: FiberFlags,
        hookFlags: HookFlags,
        create: () => (() => void),
        deps: unknown[] | null
    ): void => {
        const hook = this.hooksContext.updateWorkInProgressHook()
        const nextDeps = deps === undefined ? null : deps

        let destroy = undefined

        if (this.hooksContext.currentHook !== null) {
            const prevEffect = this.hooksContext.currentHook.memoizedState
            destroy = prevEffect.destroy
            if (nextDeps !== null) {
                const prevDeps = prevEffect.deps
                if (this.areHookInputsEqual(nextDeps, prevDeps)) {
                    hook.memoizedState = this.pushEffect(hookFlags, create, destroy, nextDeps)
                    return
                }
            }
        }

        this.hooksContext.currentlyRenderingFiber.flags |= fiberFlags
        hook.memoizedState = this.pushEffect(
            HookHasEffect | hookFlags,
            create,
            destroy,
            nextDeps
        )
    }

    updateEffect = (
        create: () => (() => void),
        deps: unknown[] | null
    ): void => {
        return this.updateEffectImpl(PassiveEffect, HookPassive, create, deps)
    }

    pushEffect = (
        tag: HookFlags,
        create: Effect['create'],
        destroy: Effect['destroy'],
        deps: Effect['deps']
    ) => {

        const effect: Effect = {
            tag,
            create,
            destroy,
            deps,
            next: null as any,
        }

        let componentUpdateQueue: null | FunctionComponentUpdateQueue =
            this.hooksContext.currentlyRenderingFiber.updateQueue as any

        if (componentUpdateQueue === null) {
            componentUpdateQueue = {
                lastEffect: null,
            }
            this.hooksContext.currentlyRenderingFiber.updateQueue = componentUpdateQueue
            componentUpdateQueue.lastEffect = effect.next = effect
        } else {
            const lastEffect = componentUpdateQueue.lastEffect
            if (lastEffect === null) {
                componentUpdateQueue.lastEffect = effect.next = effect
            } else {
                const firstEffect = lastEffect.next
                lastEffect.next = effect
                effect.next = firstEffect
                componentUpdateQueue.lastEffect = effect
            }
        }

        return effect
    }

    mountEffectImpl = (
        fiberFlags: FiberFlags,
        hookFlags: HookFlags,
        create: () => (() => void),
        deps: unknown[] | null
    ): void => {
        const hook = this.hooksContext.mountWorkInProgressHook()
        const nextDeps = deps === undefined ? null : deps
        this.hooksContext.currentlyRenderingFiber.flags |= fiberFlags
        hook.memoizedState = this.pushEffect(
            HookHasEffect | hookFlags,
            create,
            undefined,
            nextDeps
        )
    }

    mountEffect = (
        create: () => (() => void),
        deps: unknown[] | null
    ) => {
        return this.mountEffectImpl(PassiveEffect, HookPassive, create, deps)
    }
}
