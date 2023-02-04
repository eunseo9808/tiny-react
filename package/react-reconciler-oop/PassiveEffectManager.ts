import {HasEffect, HookFlags, Passive} from "./types/ReactHookEffectTags";
import {ChildDeletion, NoFlags, PassiveMask} from "./types/ReactFiberFlags";
import {singleton} from "tsyringe";
import {FunctionComponentUpdateQueue} from "./types/ReactHooksTypes";
import {FunctionComponent} from "./types/ReactWorkTags";
import {Fiber} from "./ReactFiber";
import {FiberRoot} from "./ReactFiberRoot";


@singleton()
export class PassiveEffectManager {
    nextEffect: Fiber | null = null

    commitHookEffectListUnmount(flags: HookFlags, finishedWork: Fiber): void {
        const updateQueue: FunctionComponentUpdateQueue | null =
            finishedWork.updateQueue as any

        const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null

        if (lastEffect !== null) {
            const firstEffect = lastEffect.next
            let effect = firstEffect
            do {
                if ((effect.tag & flags) === flags) {
                    const destroy = effect.destroy
                    effect.destroy = undefined
                    if (destroy !== undefined) {
                        destroy()
                    }
                }

                effect = effect.next
            } while (effect !== firstEffect)
        }
    }

    ensureCorrectReturnPointer = (
        fiber: Fiber,
        expectedReturnFiber: Fiber
    ): void => {
        fiber.return = expectedReturnFiber
    }

    commitPassiveUnmountEffects = (firstChild: Fiber): void => {
        this.nextEffect = firstChild
        this.commitPassiveUnmountEffects_begin()
    }

    commitPassiveUnmountInsideDeletedTreeOnFiber = (
        current: Fiber,
        nearestMountedAncestor: Fiber | null
    ): void => {
        switch (current.tag) {
            case FunctionComponent:
                this.commitHookEffectListUnmount(Passive, current)
                break
            default:
                break
        }
    }

    detachFiberAfterEffects = (fiber: Fiber) => {
        const alternate = fiber.alternate
        if (alternate !== null) {
            fiber.alternate = null
            this.detachFiberAfterEffects(alternate)
        }

        fiber.child = null
        fiber.deletions = null
        fiber.memoizedProps = null
        fiber.memoizedState = null
        fiber.pendingProps = null
        fiber.sibling = null
        fiber.stateNode = null
        fiber.updateQueue = null
    }

    commitPassiveUnmountEffectsInsideOfDeletedTree_complete = (
        deletedSubtreeRoot: Fiber
    ) => {
        while (this.nextEffect !== null) {
            const fiber = this.nextEffect
            const sibling = fiber.sibling
            const returnFiber = fiber.return

            if (fiber === deletedSubtreeRoot) {
                this.detachFiberAfterEffects(fiber)
                this.nextEffect = null
                return
            }

            if (sibling !== null) {
                this.ensureCorrectReturnPointer(sibling, returnFiber!)
                this.nextEffect = sibling
                return
            }

            this.nextEffect = returnFiber
        }
    }

    commitPassiveUnmountEffectsInsideOfDeletedTree_begin = (
        deletedSubtreeRoot: Fiber,
        nearestMountedAncestor: Fiber | null
    ) => {
        while (this.nextEffect !== null) {
            const fiber = this.nextEffect
            this.commitPassiveUnmountInsideDeletedTreeOnFiber(fiber, nearestMountedAncestor)

            const child = fiber.child
            if (child !== null) {
                this.ensureCorrectReturnPointer(child, fiber)
                this.nextEffect = child
            } else {
                this.commitPassiveUnmountEffectsInsideOfDeletedTree_complete(
                    deletedSubtreeRoot
                )
            }
        }
    }

    commitPassiveUnmountEffects_begin = () => {
        while (this.nextEffect !== null) {
            const fiber = this.nextEffect
            const child = fiber.child

            if ((this.nextEffect.flags & ChildDeletion) !== NoFlags) {
                const deletions = fiber.deletions
                if (deletions !== null) {
                    for (let i = 0; i < deletions.length; ++i) {
                        const fiberToDelete = deletions[i]
                        this.nextEffect = fiberToDelete
                        this.commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
                            fiberToDelete,
                            fiber
                        )
                    }
                    const previousFiber = fiber.alternate

                    if (previousFiber !== null) {
                        let detachedChild = previousFiber.child
                        if (detachedChild !== null) {
                            previousFiber.child = null
                            do {
                                const detachedSibling: Fiber | null = detachedChild.sibling
                                detachedChild.sibling = null
                                detachedChild = detachedSibling
                            } while (detachedChild !== null)
                        }
                    }

                    this.nextEffect = fiber
                }

                if ((fiber.subtreeFlags & PassiveMask) !== NoFlags && child !== null) {
                    this.ensureCorrectReturnPointer(child, fiber)
                    this.nextEffect = child
                } else {
                    this.commitPassiveUnmountEffects_complete()
                }
            }

            if ((fiber.subtreeFlags & PassiveMask) !== NoFlags && child !== null) {
                this.ensureCorrectReturnPointer(child, fiber)
                this.nextEffect = child
            } else {
                this.commitPassiveUnmountEffects_complete()
            }
        }
    }

    commitPassiveUnmountEffects_complete = () => {
        while (this.nextEffect !== null) {
            const fiber = this.nextEffect
            if ((fiber.flags & Passive) !== NoFlags) {
                this.commitPassiveUnmountOnFiber(fiber)
            }

            const sibling = fiber.sibling
            if (sibling !== null) {
                this.ensureCorrectReturnPointer(sibling, fiber.return!)
                this.nextEffect = sibling
                return
            }

            this.nextEffect = fiber.return
        }
    }

    commitPassiveUnmountOnFiber = (finishedWork: Fiber): void => {
        switch (finishedWork.tag) {
            case FunctionComponent:
                this.commitHookEffectListUnmount(HasEffect | Passive, finishedWork)
                break
            default: {
                console.log('commitPassiveUnmountOnFiber')
                throw new Error('Not Implement')
            }
        }
    }

    commitHookEffectListMount = (tag: number, finishedWork: Fiber): void => {
        const updateQueue: FunctionComponentUpdateQueue | null =
            finishedWork.updateQueue as any
        const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null
        if (lastEffect !== null) {
            const firstEffect = lastEffect.next

            let effect = firstEffect

            do {
                if ((effect.tag & tag) === tag) {
                    const create = effect.create
                    effect.destroy = create()
                }

                effect = effect.next
            } while (effect !== firstEffect)
        }
    }

    commitPassiveMountOnFiber = (
        finishedRoot: FiberRoot,
        finishedWork: Fiber
    ): void => {
        switch (finishedWork.tag) {
            case FunctionComponent:
                this.commitHookEffectListMount(Passive | HasEffect, finishedWork)
                break
            default: {
                console.log('commitPassiveMountOnFiber')
                throw new Error('Not Implement')
            }
        }
    }

    commitPassiveMountEffects_complete = (
        subtreeRoot: Fiber,
        root: FiberRoot
    ) => {
        while (this.nextEffect !== null) {
            const fiber = this.nextEffect

            if ((fiber.flags & Passive) !== NoFlags) {
                this.commitPassiveMountOnFiber(root, fiber)
            }

            if (fiber === subtreeRoot) {
                this.nextEffect = null
                return
            }

            const sibling = fiber.sibling
            if (sibling !== null) {
                this.ensureCorrectReturnPointer(sibling, fiber.return!)
                this.nextEffect = sibling
                return
            }

            this.nextEffect = fiber.return
        }
    }

    commitPassiveMountEffects_begin = (
        subtreeRoot: Fiber,
        root: FiberRoot
    ): void => {
        while (this.nextEffect !== null) {
            const fiber = this.nextEffect
            const firstChild = fiber.child

            if ((fiber.subtreeFlags & PassiveMask) !== NoFlags && firstChild !== null) {
                this.ensureCorrectReturnPointer(firstChild, fiber)
                this.nextEffect = firstChild
            } else {
                this.commitPassiveMountEffects_complete(subtreeRoot, root)
            }
        }
    }

    commitPassiveMountEffects = (
        root: FiberRoot,
        finishedWork: Fiber
    ): void => {
        this.nextEffect = finishedWork
        this.commitPassiveMountEffects_begin(finishedWork, root)
    }

}
