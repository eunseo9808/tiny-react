import setTextContent from "./setTextContent";
import {setValueForStyles} from "./CSSPropertyOperations";
import {track} from "./InputValueTracking";

const STYLE = 'style'
const CHILDREN = 'children'


export const setInitialProperties = (
    domElement: Element,
    tag: string,
    rawProps: Object
) => {
    let props: Object = rawProps

    for (const propKey in props) {
        if (!props.hasOwnProperty(propKey)) continue

        const nextProp = props[propKey]

        if (propKey === STYLE) {
            setValueForStyles(domElement as HTMLElement, nextProp)
        } else if (propKey === CHILDREN) {
            if (typeof nextProp === 'string') {
                const canSetTextContent = tag !== 'textarea' || nextProp !== ''

                if (canSetTextContent) {
                    setTextContent(domElement, nextProp)
                }
            } else if (typeof nextProp === 'number') {
                setTextContent(domElement, nextProp + '')
            }
        } else if (nextProp != null && propKey === 'className') {
            domElement.setAttribute('class', nextProp + '')
        }
    }

    if(tag === 'input') {
        track(domElement as HTMLInputElement)
    }
}


export const updateProperties = (
    domElement: Element,
    updatePayload: any[],
    tag: string,
    lastRawProps: Record<string, any> & Object,
    nextRawProps: Record<string, any> & Object
): void => {

    for (let i = 0; i < updatePayload.length; i += 2) {
        const propKey = updatePayload[i]
        const propValue = updatePayload[i + 1]

        if (propKey === STYLE) {
            setValueForStyles(domElement as HTMLElement, propValue)
        } else if (propKey === CHILDREN) {
            setTextContent(domElement, propValue)
        } else {
            throw new Error('Not Implement')
        }
    }
}
