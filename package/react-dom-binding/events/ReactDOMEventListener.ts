import {DOMEventName} from "./DOMEventNames";
import {AnyNativeEvent} from "./PluginModuleType";
import {Container} from "../shared/ContainerType";
import {getEventTarget} from "./getEventTarget";
import {dispatchEventForPluginEventSystem} from "./DOMPluginEventSystem";
import {EventSystemFlags} from "./EventSystemFlags";
import {getClosestInstanceFromNode} from "./ReactDOMComponentTree";

const attemptToDispatchEvent = (
    domEventName: DOMEventName,
    eventSystemFlags: EventSystemFlags,
    targetContainer: EventTarget,
    nativeEvent: AnyNativeEvent
): null | Container => {
    const nativeEventTarget = getEventTarget(nativeEvent)
    const targetInst = getClosestInstanceFromNode(nativeEventTarget!)

    dispatchEventForPluginEventSystem(
        domEventName,
        eventSystemFlags,
        nativeEvent,
        targetInst,
        targetContainer
    )

    return null
}

export const dispatchEvent = (
    domEventName: DOMEventName,
    eventSystemFlags: EventSystemFlags,
    targetContainer: EventTarget,
    nativeEvent: AnyNativeEvent
): void => {
    attemptToDispatchEvent(
        domEventName,
        eventSystemFlags,
        targetContainer,
        nativeEvent
    )
}
