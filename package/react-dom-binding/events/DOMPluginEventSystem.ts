import {allNativeEvents} from "./EventRegistry";
import {DOMEventName} from "./DOMEventNames";
import {
    addEventBubbleListener,
    addEventBubbleListenerWithPassiveFlag,
    addEventCaptureListener,
    addEventCaptureListenerWithPassiveFlag
} from "./EventListener";
import {AnyNativeEvent} from "./PluginModuleType";
import {Fiber} from "../../react-reconciler/ReactInternalTypes";
import {getEventTarget} from "./getEventTarget";
import {ReactSyntheticEvent} from "./ReactSyntheticEventType";
import {EventSystemFlags, IS_CAPTURE_PHASE} from "./EventSystemFlags";
import * as SimpleEventPlugin from './plugins/SimpleEventPlugin'
import * as ChangeEventPlugin from './plugins/ChangeEventPlugin'
import {dispatchEvent} from './ReactDOMEventListener'
import {HostComponent} from "../../react-reconciler/ReactWorkTags";
import {getListener} from "./getListener";

SimpleEventPlugin.registerEvents()
ChangeEventPlugin.registerEvents()

type DispatchListener = {
    instance: Fiber | null
    listener: Function
    currentTarget: EventTarget
}
type DispatchEntry = {
    event: ReactSyntheticEvent
    listeners: DispatchListener[]
}

export type DispatchQueue = DispatchEntry[]

export const nonDelegatedEvents: Set<DOMEventName> = new Set([
    'cancel' as DOMEventName,
    'close' as DOMEventName,
    'invalid' as DOMEventName,
    'load' as DOMEventName,
    'scroll' as DOMEventName,
    'toggle' as DOMEventName,
])

const addTrappedEventListener = (
    targetContainer: EventTarget,
    domEventName: DOMEventName,
    eventSystemFlags: EventSystemFlags,
    isCapturePhaseListener: boolean
) => {
    const listener = dispatchEvent.bind(null, domEventName, eventSystemFlags, targetContainer)

    let isPassiveListener: undefined | boolean = undefined

    if (
        domEventName === 'wheel' ||
        domEventName === 'touchmove' ||
        domEventName === 'touchstart'
    ) {
        isPassiveListener = true
    }

    let unsubscribeListener

    if (isCapturePhaseListener) {
        if (isPassiveListener !== undefined) {
            unsubscribeListener = addEventCaptureListenerWithPassiveFlag(
                targetContainer,
                domEventName,
                listener,
                isPassiveListener
            )
        } else {
            unsubscribeListener = addEventCaptureListener(
                targetContainer,
                domEventName,
                listener
            )
        }
    } else {
        if (isPassiveListener !== undefined) {
            unsubscribeListener = addEventBubbleListenerWithPassiveFlag(
                targetContainer,
                domEventName,
                listener,
                isPassiveListener
            )
        } else {
            unsubscribeListener = addEventBubbleListener(
                targetContainer,
                domEventName,
                listener
            )
        }
    }
}

const listenToNativeEvent = (
    domEventName: DOMEventName,
    isCapturePhaseListener: boolean,
    target: EventTarget
) => {
    let eventSystemFlags = 0

    if (isCapturePhaseListener) {
        eventSystemFlags |= IS_CAPTURE_PHASE
    }

    addTrappedEventListener(
        target,
        domEventName,
        eventSystemFlags,
        isCapturePhaseListener
    )
}

export const listenToAllSupportedEvents = (
    rootContainerElement: EventTarget
) => {

    allNativeEvents.forEach((domEventName) => {
        if (domEventName !== 'selectionchange') {
            if (!nonDelegatedEvents.has(domEventName)) {
                listenToNativeEvent(domEventName, false, rootContainerElement)
            }

            listenToNativeEvent(domEventName, true, rootContainerElement)
        }
    })
}

export const extractEvents = (
    dispatchQueue: DispatchQueue,
    domEventName: DOMEventName,
    targetInst: null | Fiber,
    nativeEvent: AnyNativeEvent,
    nativeEventTarget: null | EventTarget,
    eventSystemFlags: EventSystemFlags,
    targetContainer: EventTarget
) => {
    SimpleEventPlugin.extractEvents(
        dispatchQueue,
        domEventName,
        targetInst,
        nativeEvent,
        nativeEventTarget,
        eventSystemFlags,
        targetContainer
    )

    const shouldProcessPolyfillPlugins =
        (eventSystemFlags & IS_CAPTURE_PHASE) === 0

    if (shouldProcessPolyfillPlugins) {
        ChangeEventPlugin.extractEvents(
            dispatchQueue,
            domEventName,
            targetInst,
            nativeEvent,
            nativeEventTarget,
            eventSystemFlags,
            targetContainer
        )
    }
}

const createDispatchListener = (
    instance: Fiber | null,
    listener: Function,
    currentTarget: EventTarget
): DispatchListener => {
    return {
        instance,
        listener,
        currentTarget,
    }
}

export const accumulateTwoPhaseListeners = (
    targetFiber: Fiber | null,
    reactName: string
): DispatchListener[] => {
    const captureName = reactName + 'Capture'
    const listeners: Array<DispatchListener> = []
    let instance = targetFiber

    while (instance !== null) {
        const {stateNode, tag} = instance

        if (tag === HostComponent && stateNode !== null) {
            const currentTarget = stateNode
            const captureListener = getListener(instance, captureName)

            if (captureListener !== null) {
                listeners.unshift(
                    createDispatchListener(instance, captureListener, currentTarget)
                )
            }

            const bubbleListener = getListener(instance, reactName)
            if (bubbleListener !== null) {
                listeners.push(
                    createDispatchListener(instance, bubbleListener, currentTarget)
                )
            }
        }

        instance = instance.return
    }

    return listeners
}

export const accumulateSinglePhaseListeners = (
    targetFiber: Fiber | null,
    reactName: string | null,
    inCapturePhase: boolean,
    accumulateTargetOnly: boolean
) => {
    const captureName = reactName !== null ? reactName + 'Capture' : null
    const reactEventName = inCapturePhase ? captureName : reactName
    let listeners: DispatchListener[] = []

    let instance = targetFiber
    let lastHostComponent = null

    while (instance !== null) {
        const {tag, stateNode} = instance

        if (tag === HostComponent && stateNode !== null) {
            lastHostComponent = stateNode
            if (reactEventName !== null) {
                const listener = getListener(instance, reactEventName)

                if (listener !== null) {
                    listeners.push(
                        createDispatchListener(instance, listener, lastHostComponent)
                    )
                }
            }
        }

        if (accumulateTargetOnly) break

        instance = instance.return
    }

    return listeners
}

const executeDispatch = (
    event: ReactSyntheticEvent,
    listener: Function
): void => {
    listener(event)
}

const processDispatchQueueItemsInOrder = (
    event: ReactSyntheticEvent,
    dispatchListeners: DispatchListener[],
    inCapturePhase: boolean
): void => {
    if (inCapturePhase) {
        for (let i = dispatchListeners.length - 1; i >= 0; --i) {
            const {listener} = dispatchListeners[i]
            executeDispatch(event, listener)
        }
    } else {
        for (let i = 0; i < dispatchListeners.length; ++i) {
            const {listener} = dispatchListeners[i]
            executeDispatch(event, listener)
        }
    }
}

export const processDispatchQueue = (
    dispatchQueue: DispatchQueue,
    eventSystemFlags: EventSystemFlags
): void => {
    const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0
    for (let i = 0; i < dispatchQueue.length; ++i) {
        const {event, listeners} = dispatchQueue[i]

        processDispatchQueueItemsInOrder(event, listeners, inCapturePhase)
    }
}
