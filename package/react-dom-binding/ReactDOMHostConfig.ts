import {Fiber} from "../react-reconciler/ReactInternalTypes";
import {Container} from "./shared/ContainerType";
import {diffProperties, setInitialProperties, updateProperties} from "./ReactDOMComponent";
import setTextContent from "./setTextContent";
import {precacheFiberNode, updateFiberProps} from "./events/ReactDOMComponentTree";

const STYLE = 'style'
const CHILDREN = 'children'

export type Props = {
    autoFocus?: boolean
    children?: unknown
    disabled?: boolean
    hidden?: boolean
    suppressHydrationWarning?: boolean
    dangerouslySetInnerHTML?: unknown
    style?: object & { display?: string }
    bottom?: null | number
    left?: null | number
    right?: null | number
    top?: null | number
}

export type UpdatePayload = unknown[]

export const shouldSetTextContent = (type: string, props: Props): boolean => {
    return (
        type === 'textarea' ||
        type === 'option' ||
        type === 'noscript' ||
        typeof props.children === 'string' ||
        typeof props.children === 'number' ||
        (typeof props.dangerouslySetInnerHTML === 'object' &&
            props.dangerouslySetInnerHTML !== null &&
            (props.dangerouslySetInnerHTML as any).__html !== null)
    )
}

export const createInstance = (
    type: string,
    props: Props,
    internalInstanceHandle: Fiber
) => {
    const domElement: Element = document.createElement(type)

    precacheFiberNode(internalInstanceHandle, domElement)
    updateFiberProps(domElement, props)

    return domElement
}

export const appendInitialChild = (
    parentInstance: Element,
    child: Element | Text
) => {
    parentInstance.appendChild(child)
}

export const insertBefore = (
    parentInstance: Element,
    child: Element,
    beforeChild: Element
): void => {
    parentInstance.insertBefore(child, beforeChild)
}

export const appendChild = (parentInstance: Element, child: Element): void => {
    parentInstance.appendChild(child)
}

export const insertInContainerBefore = (
    container: Container,
    child: Element,
    beforeChild: Element
) => {
    container.insertBefore(child, beforeChild)
}

export const appendChildToContainer = (
    container: Container,
    child: Element
): void => {
    container.appendChild(child)
}

export const finalizeInitialChildren = (
    domElement: Element,
    type: string,
    props: Props
): boolean => {
    setInitialProperties(domElement, type, props)
    return false
}

export const createTextInstance = (text: string): Text => {
    const instance = document.createTextNode(text)

    return instance
}

export const prepareUpdate = (
    domElement: Element,
    type: string,
    oldProps: Props,
    newProps: Props
): null | unknown[] => {
    return diffProperties(domElement, type, oldProps, newProps)
}

export const commitTextUpdate = (
    textInstance: Text,
    oldText: string,
    newText: string
): void => {
    textInstance.nodeValue = newText
}

export const commitUpdate = (
    domElement: Element,
    updatePayload: unknown[],
    type: string,
    oldProps: Props,
    newProps: Props,
    internalInstanceHandle: Object
): void => {
    updateFiberProps(domElement, newProps)
    updateProperties(domElement, updatePayload, type, oldProps, newProps)
}

export const removeChild = (
    parentInstance: HTMLElement,
    child: HTMLElement | Text
) => {
    parentInstance.removeChild(child)
}

export const resetTextContent = (domElement: Element): void => {
    setTextContent(domElement, '')
}

export const scheduleMicrotask = queueMicrotask
