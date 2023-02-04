import {ReactElement} from "../shared/ReactTypes";
import {REACT_ELEMENT_TYPE} from "../shared/ReactSymbols";
import {ChildDeletion, Placement} from "./types/ReactFiberFlags";
import {ReactFiberFactory} from "./ReactFiberFactory";
import {Fiber} from "./types/ReactInternalTypes";
import {Fragment, HostText} from "./types/ReactWorkTags";
import {singleton} from "tsyringe";

const isArray = Array.isArray


@singleton()
export class ChildReconciler {
    shouldTrackSideEffects: boolean = false

    constructor(private reactFiberFactory?: ReactFiberFactory) {
    }

    placeSingleChild = (newFiber: Fiber): Fiber => {
        if (this.shouldTrackSideEffects && newFiber.alternate === null) {
            newFiber.flags |= Placement
        }

        return newFiber
    }

    reconcileSingleElement = (
        returnFiber: Fiber,
        currentFirstChild: Fiber | null,
        element: ReactElement,
    ): Fiber => {
        const key = element.key
        let child = currentFirstChild

        while (child !== null) {
            if (child.key === key) {
                if (child.tag === Fragment) {
                    this.deleteRemainingChildren(returnFiber, child.sibling);
                    var existing = this.useFiber(child, element.props.children);
                    existing.return = returnFiber;
                    return existing;
                } else if (child.elementType === element.type) {
                    this.deleteRemainingChildren(returnFiber, child.sibling)
                    const existing = this.useFiber(child, element.props)
                    existing.return = returnFiber
                    return existing
                }
                this.deleteRemainingChildren(returnFiber, child)
                break
            } else {
                this.deleteChild(returnFiber, child)
            }

            child = child.sibling
        }

        const created = this.reactFiberFactory.createFiberFromElement(element)
        created.return = returnFiber
        return created
    }

    deleteRemainingChildren = (
        returnFiber: Fiber,
        currentFirstChild: Fiber | null
    ): null => {
        if (!this.shouldTrackSideEffects) {
            return null
        }

        let childToDelete = currentFirstChild

        while (childToDelete !== null) {
            this.deleteChild(returnFiber, childToDelete)
            childToDelete = childToDelete.sibling
        }

        return null
    }

    updateElement = (
        returnFiber: Fiber,
        current: Fiber | null,
        element: ReactElement
    ): Fiber => {
        if (current !== null) {
            if (current.elementType === element.type) {
                const existing = this.useFiber(current, element.props)
                existing.return = returnFiber
                return existing
            }
        }

        const created = this.reactFiberFactory.createFiberFromElement(element)
        created.return = returnFiber

        return created
    }

    useFiber = (fiber: Fiber, pendingProps: unknown): Fiber => {
        const clone = this.reactFiberFactory.createWorkInProgress(fiber, pendingProps)
        clone.index = 0
        clone.sibling = null
        return clone
    }

    updateTextNode = (
        returnFiber: Fiber,
        current: Fiber | null,
        textContent: string,
    ) => {
        if (current === null || current.tag !== HostText) {
            const created = this.reactFiberFactory.createFiberFromText(textContent)
            created.return = returnFiber
            return created
        } else {
            const existing = this.useFiber(current, textContent)
            existing.return = returnFiber
            return existing
        }
    }
    updateFragment(returnFiber, current, fragment, key) {
        if (current === null || current.tag !== Fragment) {
            var created = this.reactFiberFactory.createFiberFromFragment(fragment, key);
            created.return = returnFiber;
            return created;
        } else {
            var existing = this.useFiber(current, fragment);
            existing.return = returnFiber;
            return existing;
        }
    }

    updateSlot = (
        returnFiber: Fiber,
        oldFiber: Fiber | null,
        newChild: any,
    ): Fiber | null => {
        const key = oldFiber ? oldFiber.key : null

        if (typeof newChild === 'number' || typeof newChild === 'string') {
            if (key !== null) {
                throw new Error('Not Implement')
            }

            return this.updateTextNode(returnFiber, oldFiber, '' + newChild)
        }

        if (typeof newChild === 'object' && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE: {
                    if (newChild.key === key) {
                        return this.updateElement(returnFiber, oldFiber, newChild)
                    } else return null
                }
            }
            if (isArray(newChild)) {
                if (key !== null) {
                    return null;
                }

                return this.updateFragment(returnFiber, oldFiber, newChild, null);
            }
            throw new Error('Not Implement')
        }

        if (newChild == null) return null

        throw new Error('Invalid Object type')
    }


    placeChild = (
        newFiber: Fiber,
        lastPlacedIndex: number,
        newIndex: number
    ): number => {
        newFiber.index = newIndex

        if (!this.shouldTrackSideEffects) return lastPlacedIndex

        const current = newFiber.alternate

        if (current !== null) {
            const oldIndex = current.index

            if (oldIndex < lastPlacedIndex) {
                newFiber.flags |= Placement
                return lastPlacedIndex
            } else {
                return oldIndex
            }
        } else {
            newFiber.flags |= Placement
            return lastPlacedIndex
        }
    }

    createChild = (
        returnFiber: Fiber,
        newChild: any,
    ): Fiber | null => {
        if (typeof newChild === 'string' || typeof newChild === 'number') {
            const created = this.reactFiberFactory.createFiberFromText(
                '' + newChild,
            )

            created.return = returnFiber

            return created
        }

        if (typeof newChild === 'object' && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE: {
                    const created = this.reactFiberFactory.createFiberFromElement(
                        newChild
                    )

                    created.return = returnFiber
                    return created
                }
            }
        }

        if (isArray(newChild)) {
            const created = this.reactFiberFactory.createFiberFromFragment(
                newChild,
                null,
            );
            created.return = returnFiber;
            return created;
        }

        if (newChild == null) return null

        throw new Error('Not Implement')
    }

    deleteChild = (returnFiber: Fiber, childToDelete: Fiber): void => {
        if (!this.shouldTrackSideEffects) {
            return
        }

        const deletions = returnFiber.deletions
        if (deletions === null) {
            returnFiber.deletions = [childToDelete]
            returnFiber.flags |= ChildDeletion
        } else {
            deletions.push(childToDelete)
        }
    }

    mapRemainingChildren = (
        returnFiber: Fiber,
        currentFirstChild: Fiber
    ): Map<string | number, Fiber> => {
        const existingChildren: Map<string | number, Fiber> = new Map()

        let existingChild: Fiber | null = currentFirstChild

        while (existingChild !== null) {
            if (existingChild.key !== null) {
                existingChildren.set(existingChild.key, existingChild)
            } else {
                existingChildren.set(existingChild.index, existingChild)
            }

            existingChild = existingChild.sibling
        }

        return existingChildren
    }

    updateFromMap = (
        existingChildren: Map<string | number, Fiber>,
        returnFiber: Fiber,
        newIdx: number,
        newChild: any,
    ): Fiber | null => {
        if (typeof newChild === 'string' || typeof newChild === 'number') {
            const matchedFiber = existingChildren.get(newIdx) || null

            return this.updateTextNode(returnFiber, matchedFiber, '' + newChild)
        }

        if (typeof newChild === 'object' && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE: {
                    const matchedFiber =
                        existingChildren.get(
                            newChild.key === null ? newIdx : newChild.key
                        ) ?? null

                    return this.updateElement(returnFiber, matchedFiber, newChild)
                }
            }

            throw new Error('Not Implement')
        }

        return null
    }

    reconcileChildrenArray = (
        returnFiber: Fiber,
        currentFirstChild: Fiber | null,
        newChildren: any[],
    ): Fiber | null => {
        let resultingFirstChild: Fiber | null = null
        let previousNewFiber: Fiber | null = null

        let oldFiber: Fiber | null = currentFirstChild
        let lastPlacedIndex = 0
        let newIdx = 0
        let nextOldFiber = null

        for (; oldFiber !== null && newIdx < newChildren.length; ++newIdx) {
            if (oldFiber.index > newIdx) {
                throw new Error('Not Implement')
            } else {
                nextOldFiber = oldFiber.sibling
            }

            const newFiber = this.updateSlot(
                returnFiber,
                oldFiber,
                newChildren[newIdx]
            )

            if (newFiber === null) {
                if (oldFiber === null) {
                    oldFiber = nextOldFiber
                }
                break
            }

            if (this.shouldTrackSideEffects) {

                if (oldFiber && newFiber.alternate === null) {
                    this.deleteChild(returnFiber, oldFiber)
                }
            }

            lastPlacedIndex = this.placeChild(newFiber, lastPlacedIndex, newIdx)

            if (!previousNewFiber) {
                resultingFirstChild = newFiber
            } else {
                previousNewFiber.sibling = newFiber
            }

            previousNewFiber = newFiber
            oldFiber = nextOldFiber
        }

        if (newIdx === newChildren.length) {
            this.deleteRemainingChildren(returnFiber, oldFiber)

            return resultingFirstChild
        }

        if (oldFiber === null) {
            for (; newIdx < newChildren.length; ++newIdx) {
                const newFiber = this.createChild(returnFiber, newChildren[newIdx])
                if (newFiber === null) continue

                lastPlacedIndex = this.placeChild(newFiber, lastPlacedIndex, newIdx)
                if (previousNewFiber === null) {
                    resultingFirstChild = newFiber
                } else {
                    previousNewFiber.sibling = newFiber
                }

                previousNewFiber = newFiber
            }

            return resultingFirstChild
        }

        const existingChildren = this.mapRemainingChildren(returnFiber, oldFiber)

        for (; newIdx < newChildren.length; ++newIdx) {
            const newFiber = this.updateFromMap(
                existingChildren,
                returnFiber,
                newIdx,
                newChildren[newIdx]
            )

            if (newFiber !== null) {
                if (this.shouldTrackSideEffects) {
                    if (newFiber.alternate !== null) {
                        existingChildren.delete(
                            newFiber.key === null ? newIdx : newFiber.key
                        )
                    }
                }

                lastPlacedIndex = this.placeChild(newFiber, lastPlacedIndex, newIdx)

                if (previousNewFiber === null) {
                    resultingFirstChild = newFiber
                } else {
                    previousNewFiber.sibling = newFiber
                }
                previousNewFiber = newFiber
            }
        }

        if (this.shouldTrackSideEffects) {
            existingChildren.forEach((child) => this.deleteChild(returnFiber, child))
        }

        return resultingFirstChild
    }

    reconcileChildFibers = (
        returnFiber: Fiber,
        currentFirstChild: Fiber | null,
        newChild: any
    ): Fiber | null => {
        const isObject = typeof newChild === 'object' && newChild !== null

        if (isObject) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE: {
                    return this.placeSingleChild(
                        this.reconcileSingleElement(
                            returnFiber,
                            currentFirstChild,
                            newChild,
                        )
                    )
                }
            }
        }

        if (isArray(newChild)) {
            return this.reconcileChildrenArray(
                returnFiber,
                currentFirstChild,
                newChild,
            )
        }

        if (typeof newChild === 'string' || typeof newChild === 'number') {
            throw new Error('Not Implement')
        }

        return this.deleteRemainingChildren(returnFiber, currentFirstChild)
    }
}

