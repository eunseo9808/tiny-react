import {REACT_ELEMENT_TYPE} from '../shared/ReactSymbols'
import {ReactElement} from '../shared/ReactTypes'
import {
    createFiberFromElement, createFiberFromFragment,
    createFiberFromText,
    createWorkInProgress,
} from './ReactFiber'
import {ChildDeletion, Placement} from './ReactFiberFlags'
import {Fiber} from './ReactInternalTypes'
import {Fragment, HostText} from './ReactWorkTags'

const isArray = Array.isArray

const createChildReconciler = (shouldTrackSideEffects: boolean) => {
    const placeSingleChild = (newFiber: Fiber): Fiber => {
        if (shouldTrackSideEffects && newFiber.alternate === null) {
            newFiber.flags |= Placement
        }

        return newFiber
    }

    const reconcileSingleElement = (
        returnFiber: Fiber,
        currentFirstChild: Fiber | null,
        element: ReactElement,
    ): Fiber => {
        const key = element.key
        let child = currentFirstChild

        while (child !== null) {
            if (child.key === key) {
                if (child.tag === Fragment) {
                    deleteRemainingChildren(returnFiber, child.sibling);
                    var existing = useFiber(child, element.props.children);
                    existing.return = returnFiber;
                    return existing;
                } else if (child.elementType === element.type) {
                    deleteRemainingChildren(returnFiber, child.sibling)
                    const existing = useFiber(child, element.props)
                    existing.return = returnFiber
                    return existing
                }
                deleteRemainingChildren(returnFiber, child)
                break
            } else {
                deleteChild(returnFiber, child)
            }

            child = child.sibling
        }

        const created = createFiberFromElement(element)
        created.return = returnFiber
        return created
    }

    const deleteRemainingChildren = (
        returnFiber: Fiber,
        currentFirstChild: Fiber | null
    ): null => {
        if (!shouldTrackSideEffects) {
            return null
        }

        let childToDelete = currentFirstChild

        while (childToDelete !== null) {
            deleteChild(returnFiber, childToDelete)
            childToDelete = childToDelete.sibling
        }

        return null
    }

    const updateElement = (
        returnFiber: Fiber,
        current: Fiber | null,
        element: ReactElement
    ): Fiber => {
        if (current !== null) {
            if (current.elementType === element.type) {
                const existing = useFiber(current, element.props)
                existing.return = returnFiber
                return existing
            }
        }

        const created = createFiberFromElement(element)
        created.return = returnFiber

        return created
    }

    const useFiber = (fiber: Fiber, pendingProps: unknown): Fiber => {
        const clone = createWorkInProgress(fiber, pendingProps)
        clone.index = 0
        clone.sibling = null
        return clone
    }

    const updateTextNode = (
        returnFiber: Fiber,
        current: Fiber | null,
        textContent: string,
    ) => {
        if (current === null || current.tag !== HostText) {
            const created = createFiberFromText(textContent)
            created.return = returnFiber
            return created
        } else {
            const existing = useFiber(current, textContent)
            existing.return = returnFiber
            return existing
        }
    }

    const updateSlot = (
        returnFiber: Fiber,
        oldFiber: Fiber | null,
        newChild: any,
    ): Fiber | null => {
        const key = oldFiber ? oldFiber.key : null

        if (typeof newChild === 'number' || typeof newChild === 'string') {
            if (key !== null) {
                throw new Error('Not Implement')
            }

            return updateTextNode(returnFiber, oldFiber, '' + newChild)
        }

        if (typeof newChild === 'object' && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE: {
                    if (newChild.key === key) {
                        return updateElement(returnFiber, oldFiber, newChild)
                    } else return null
                }
            }
            throw new Error('Not Implement')
        }

        if (newChild == null) return null

        throw new Error('Invalid Object type')
    }


    const placeChild = (
        newFiber: Fiber,
        lastPlacedIndex: number,
        newIndex: number
    ): number => {
        newFiber.index = newIndex

        if (!shouldTrackSideEffects) return lastPlacedIndex

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

    const createChild = (
        returnFiber: Fiber,
        newChild: any,
    ): Fiber | null => {
        if (typeof newChild === 'string' || typeof newChild === 'number') {
            const created = createFiberFromText(
                '' + newChild,
            )

            created.return = returnFiber

            return created
        }

        if (typeof newChild === 'object' && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE: {
                    const created = createFiberFromElement(
                        newChild
                    )

                    created.return = returnFiber
                    return created
                }
            }
        }

        if (isArray(newChild)) {
            const created = createFiberFromFragment(
                newChild,
                null,
            );
            created.return = returnFiber;
            return created;
        }

        if (newChild == null) return null

        throw new Error('Not Implement')
    }

    const deleteChild = (returnFiber: Fiber, childToDelete: Fiber): void => {
        if (!shouldTrackSideEffects) {
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

    const mapRemainingChildren = (
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

    const updateFromMap = (
        existingChildren: Map<string | number, Fiber>,
        returnFiber: Fiber,
        newIdx: number,
        newChild: any,
    ): Fiber | null => {
        if (typeof newChild === 'string' || typeof newChild === 'number') {
            const matchedFiber = existingChildren.get(newIdx) || null

            return updateTextNode(returnFiber, matchedFiber, '' + newChild)
        }

        if (typeof newChild === 'object' && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE: {
                    const matchedFiber =
                        existingChildren.get(
                            newChild.key === null ? newIdx : newChild.key
                        ) ?? null

                    return updateElement(returnFiber, matchedFiber, newChild)
                }
            }

            throw new Error('Not Implement')
        }

        return null
    }

    const reconcileChildrenArray = (
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

            const newFiber = updateSlot(
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

            if (shouldTrackSideEffects) {

                if (oldFiber && newFiber.alternate === null) {
                    deleteChild(returnFiber, oldFiber)
                }
            }

            lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)

            if (!previousNewFiber) {
                resultingFirstChild = newFiber
            } else {
                previousNewFiber.sibling = newFiber
            }

            previousNewFiber = newFiber
            oldFiber = nextOldFiber
        }

        if (newIdx === newChildren.length) {
            deleteRemainingChildren(returnFiber, oldFiber)

            return resultingFirstChild
        }

        if (oldFiber === null) {
            for (; newIdx < newChildren.length; ++newIdx) {
                const newFiber = createChild(returnFiber, newChildren[newIdx])
                if (newFiber === null) continue

                lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)
                if (previousNewFiber === null) {
                    resultingFirstChild = newFiber
                } else {
                    previousNewFiber.sibling = newFiber
                }

                previousNewFiber = newFiber
            }

            return resultingFirstChild
        }

        const existingChildren = mapRemainingChildren(returnFiber, oldFiber)

        for (; newIdx < newChildren.length; ++newIdx) {
            const newFiber = updateFromMap(
                existingChildren,
                returnFiber,
                newIdx,
                newChildren[newIdx]
            )

            if (newFiber !== null) {
                if (shouldTrackSideEffects) {
                    if (newFiber.alternate !== null) {
                        existingChildren.delete(
                            newFiber.key === null ? newIdx : newFiber.key
                        )
                    }
                }

                lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)

                if (previousNewFiber === null) {
                    resultingFirstChild = newFiber
                } else {
                    previousNewFiber.sibling = newFiber
                }
                previousNewFiber = newFiber
            }
        }

        if (shouldTrackSideEffects) {
            existingChildren.forEach((child) => deleteChild(returnFiber, child))
        }

        return resultingFirstChild
    }

    const reconcileChildFibers = (
        returnFiber: Fiber,
        currentFirstChild: Fiber | null,
        newChild: any
    ): Fiber | null => {

        const isObject = typeof newChild === 'object' && newChild !== null

        if (isObject) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE: {
                    return placeSingleChild(
                        reconcileSingleElement(
                            returnFiber,
                            currentFirstChild,
                            newChild,
                        )
                    )
                }
            }
        }

        if (isArray(newChild)) {
            return reconcileChildrenArray(
                returnFiber,
                currentFirstChild,
                newChild,
            )
        }

        if (typeof newChild === 'string' || typeof newChild === 'number') {
            throw new Error('Not Implement')
        }

        return deleteRemainingChildren(returnFiber, currentFirstChild)
    }

    return reconcileChildFibers
}

export const cloneChildFibers = (
    current: Fiber | null,
    workInProgress: Fiber
): void => {
    if (workInProgress.child === null) return

    let currentChild = workInProgress.child

    let newChild = createWorkInProgress(currentChild, currentChild.pendingProps)
    workInProgress.child = newChild

    newChild.return = workInProgress

    while (currentChild.sibling !== null) {
        currentChild = currentChild.sibling
        newChild = newChild.sibling = createWorkInProgress(
            currentChild,
            currentChild.pendingProps
        )
        newChild.return = workInProgress
    }

    newChild.sibling = null
}

export const mountChildFibers = createChildReconciler(false)
export const reconcileChildFibers = createChildReconciler(true)
