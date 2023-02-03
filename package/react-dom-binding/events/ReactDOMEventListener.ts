import {DOMEventName} from "./DOMEventNames";
import {AnyNativeEvent} from "./PluginModuleType";
import {getEventTarget} from "./getEventTarget";
import {
    DispatchQueue,
    extractEvents,
    processDispatchQueue
} from "./DOMPluginEventSystem";
import {EventSystemFlags} from "./EventSystemFlags";
import {getClosestInstanceFromNode} from "./ReactDOMComponentTree";

export const dispatchEvent = (
    domEventName: DOMEventName,
    eventSystemFlags: EventSystemFlags,
    targetContainer: EventTarget,
    nativeEvent: AnyNativeEvent
): void => {
    const nativeEventTarget = getEventTarget(nativeEvent)
    const targetInst = getClosestInstanceFromNode(nativeEventTarget!)

    const dispatchQueue: DispatchQueue = []

    extractEvents(
        dispatchQueue,
        domEventName,
        targetInst,
        nativeEvent,
        nativeEventTarget,
        eventSystemFlags,
        targetContainer
    )
    processDispatchQueue(dispatchQueue, eventSystemFlags)
}
