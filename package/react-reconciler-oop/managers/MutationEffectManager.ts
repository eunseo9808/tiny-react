import {
    BeforeMutationMask,
    ContentReset,
    MutationMask,
    Placement,
    PlacementAndUpdate,
    Update
} from "../types/ReactFiberFlags";
import {HookFlags, NoFlags} from "../types/ReactHookEffectTags";
import {
    appendChild,
    appendChildToContainer, insertBefore,
    insertInContainerBefore,
    removeChild,
    resetTextContent
} from "../../react-dom-binding/ReactDOMHostConfig";
import {inject, injectable} from "tsyringe";
import {CommitWorkManager} from "./CommitWorkManager";
import {Container} from "../../react-dom-binding/shared/ContainerType";
import {Fiber} from "../ReactFiber";
import {FiberRoot} from "../ReactFiberRoot";
import {HostComponent, HostRoot, HostText} from "../types/ReactWorkTags";
import {ComponentProvider} from "../ComponentProvider";


@injectable()
export class MutationEffectManager {
    nextEffect: Fiber | null = null

    constructor(private componentProvider?: ComponentProvider) {
    }

    ensureCorrectReturnPointer(
        fiber: Fiber,
        expectedReturnFiber: Fiber
    ): void {
        fiber.return = expectedReturnFiber
    }

    commitMutationEffects = (
        root: FiberRoot,
        firstChild: Fiber
    ): void => {
        this.nextEffect = firstChild

        this.commitMutationEffects_begin(root)
    }

    commitMutationEffectsOnFiber = (
        finishedWork: Fiber,
        root: FiberRoot
    ): void => {
        const flags = finishedWork.flags

        const primaryFlags = flags & (Placement | Update)

        const component = this.componentProvider.getComponent(finishedWork.tag)

        switch (primaryFlags) {
            case Placement: {
                this.commitPlacement(finishedWork)
                finishedWork.flags &= ~Placement
                break
            }
            case NoFlags: {
                break
            }
            case PlacementAndUpdate: {
                this.commitPlacement(finishedWork)
                finishedWork.flags &= ~Placement
                const current = finishedWork.alternate
                component.commitWork(current, finishedWork)
                break
            }
            case Update: {
                const current = finishedWork.alternate
                component.commitWork(current, finishedWork)
                break
            }
            default: {
                throw new Error('Not Implement')
            }
        }
    }

    commitMutationEffects_begin = (root: FiberRoot): void => {
        while (this.nextEffect !== null) {
            const fiber = this.nextEffect

            const deletions = fiber.deletions
            if (deletions !== null) {
                for (let i = 0; i < deletions.length; ++i) {
                    const childToDelete = deletions[i]

                    this.commitDeletion(root, childToDelete, fiber)
                }
            }

            const child = fiber.child

            if ((fiber.subtreeFlags & MutationMask) !== NoFlags && child !== null) {
                this.ensureCorrectReturnPointer(child, fiber)
                this.nextEffect = child
            } else {
                this.commitMutationEffects_complete(root)
            }
        }
    }

    commitMutationEffects_complete = (root: FiberRoot) => {
        while (this.nextEffect !== null) {
            const fiber = this.nextEffect

            this.commitMutationEffectsOnFiber(fiber, root)

            const sibling = fiber.sibling
            if (sibling !== null) {
                this.ensureCorrectReturnPointer(sibling, fiber.return!)
                this.nextEffect = sibling
                return
            }

            this.nextEffect = fiber.return
        }
    }


    commitNestedUnmounts = (
        finishedRoot: FiberRoot,
        root: Fiber,
        nearestMountedAncestor: Fiber
    ) => {
        let node: Fiber = root

        while (true) {
            if (node.child !== null) {
                node.child.return = node
                node = node.child
                continue
            }

            if (node === root) return

            while (node.sibling === null) {
                if (node.return === null || node.return === root) {
                    return
                }

                node = node.return
            }

            node.sibling.return = node.return
            node = node.sibling
        }
    }


    detachFiberMutation = (fiber: Fiber) => {
        const alternate = fiber.alternate
        if (alternate !== null) {
            alternate.return = null
        }
        fiber.return = null
    }

    commitDeletion = (
        finishedRoot: FiberRoot,
        current: Fiber,
        nearestMountedAncestor: Fiber
    ): void => {
        let node: Fiber = current

        let currentParentIsValid = false

        let currentParent
        let currentParentIsContainer

        while (true) {
            if (!currentParentIsValid) {
                let parent = node.return

                findParent: while (true) {
                    const parentStateNode = parent?.stateNode
                    switch (parent?.tag) {
                        case HostComponent:
                            currentParent = parentStateNode
                            currentParentIsContainer = false
                            break findParent
                        case HostRoot:
                            currentParent = parentStateNode.containerInfo
                            currentParentIsContainer = true
                            break findParent
                    }
                    parent = parent!.return
                }

                currentParentIsValid = true
            }

            if (node.tag === HostComponent || node.tag === HostText) {
                this.commitNestedUnmounts(finishedRoot, node, nearestMountedAncestor)
                removeChild(currentParent, node.stateNode)

            } else {

                if (node.child !== null) {
                    node.child.return = node
                    node = node.child
                    continue
                }
            }

            if (node === current) return

            while (node.sibling === null) {
                if (node.return === null || node.return === current) return

                node = node.return
            }
            node.sibling.return = node.return
            node = node.sibling
        }

        this.detachFiberMutation(current)
    }


    commitPlacement = (finishedWork: Fiber): void => {
        const parentFiber = this.getHostParentFiber(finishedWork)

        let parent
        let isContainer

        const parentStateNode = parentFiber.stateNode

        switch (parentFiber.tag) {
            case HostComponent:
                parent = parentStateNode
                isContainer = false
                break

            case HostRoot:
                parent = parentStateNode.containerInfo
                isContainer = true
                break
            default: {
                throw new Error('Invalid host parent fiber')
            }
        }

        if (parentFiber.flags & ContentReset) {
            resetTextContent(parent)
            parentFiber.flags &= ~ContentReset
        }

        const before = this.getHostSibling(finishedWork)

        if (isContainer) {
            this.insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent)
        } else {
            this.insertOrAppendPlacementNode(finishedWork, before, parent)
        }
    }

    isHostParent = (fiber: Fiber): boolean => {
        return fiber.tag === HostComponent || fiber.tag === HostRoot
    }

    getHostParentFiber = (fiber: Fiber): Fiber => {
        let parent = fiber.return

        while (parent !== null) {
            if (this.isHostParent(parent)) {
                return parent
            }

            parent = parent.return
        }

        throw new Error('Expected to find a host parent')
    }

    getHostSibling = (fiber: Fiber): Element | null => {
        let node: Fiber = fiber

        siblings: while (true) {
            while (node.sibling === null) {
                if (node.return === null || this.isHostParent(node.return)) return null
                node = node.return
            }

            node.sibling.return = node.return
            node = node.sibling

            while (node.tag !== HostComponent) {
                if (node.flags & Placement) {
                    continue siblings
                }

                if (node.child === null) {
                    continue siblings
                } else {
                    node.child.return = node
                    node = node.child
                }
            }

            if (!(node.flags & Placement)) {
                return node.stateNode
            }
        }
    }

    insertOrAppendPlacementNode = (
        node: Fiber,
        before: Element | null,
        parent: Element
    ): void => {
        const { tag } = node

        const isHost = tag === HostComponent || tag === HostText

        if (isHost) {
            const stateNode = isHost ? node.stateNode : node.stateNode.instance
            if (before) {
                insertBefore(parent, stateNode, before)
            } else {
                appendChild(parent, stateNode)
            }
        } else {
            const child = node.child
            if (child !== null) {
                this.insertOrAppendPlacementNode(child, before, parent)

                let sibling = child.sibling

                while (sibling !== null) {
                    this.insertOrAppendPlacementNode(sibling, before, parent)
                    sibling = sibling.sibling
                }
            }
        }
    }

    insertOrAppendPlacementNodeIntoContainer = (
        node: Fiber,
        before: Element | null,
        parent: Container
    ): void => {
        const { tag } = node
        const isHost = tag === HostComponent || tag === HostText

        if (isHost) {
            const stateNode = node.stateNode

            if (before) {
                insertInContainerBefore(parent, stateNode, before)
            } else {
                appendChildToContainer(parent, stateNode)
            }
        } else {
            const child = node.child

            if (child !== null) {
                this.insertOrAppendPlacementNodeIntoContainer(child, before, parent)
                let sibling = child.sibling
                while (sibling !== null) {
                    this.insertOrAppendPlacementNodeIntoContainer(sibling, before, parent)
                    sibling = sibling.sibling
                }
            }
        }
    }
}
