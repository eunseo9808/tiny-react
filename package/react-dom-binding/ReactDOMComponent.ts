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

    if (tag === 'input') {
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


export const diffProperties = (
    domElement: Element,
    tag: string,
    lastRawProps: Record<string, any>,
    nextRawProps: Record<string, any>
): null | Array<unknown> => {
    let updatePayload: any[] = []

    let lastProps: Record<string, any>
    let nextProps: Record<string, any>

    lastProps = lastRawProps
    nextProps = nextRawProps

    let propKey
    let styleName
    let styleUpdates: Record<string, any> | null = null

    for (propKey in lastProps) {
        if (
            nextProps.hasOwnProperty(propKey) ||
            (!lastProps.hasOwnProperty(propKey) && lastProps[propKey] == null)
        ) {
            continue
        }
        if (propKey === STYLE) {
            const lastStyle = lastProps[propKey];
            for (styleName in lastStyle) {
                if (lastStyle.hasOwnProperty(styleName)) {
                    if (!styleUpdates) {
                        styleUpdates = {};
                    }
                    styleUpdates[styleName] = '';
                }
            }
        } else if (propKey === CHILDREN) {
        } else {
            updatePayload.push(propKey, null)
        }
    }

    for (propKey in nextProps) {
        const nextProp = nextProps[propKey]
        const lastProp = lastProps !== null ? lastProps[propKey] : undefined

        if (
            !nextProps.hasOwnProperty(propKey) ||
            nextProp === lastProp ||
            (nextProp === null && lastProp === null)
        ) {
            continue
        }

        if (propKey === STYLE) {
            if (lastProp) {
                for (styleName in lastProp) {
                    if (
                        lastProp.hasOwnProperty(styleName) &&
                        (!nextProp || !nextProp.hasOwnProperty(styleName))
                    ) {
                        if (!styleUpdates) {
                            styleUpdates = {}
                        }
                        styleUpdates[styleName] = ''
                    }
                }

                for (styleName in nextProp) {
                    if (
                        nextProp.hasOwnProperty(styleName) &&
                        lastProp[styleName] !== nextProp[styleName]
                    ) {
                        if (!styleUpdates) {
                            styleUpdates = {}
                        }
                        styleUpdates[styleName] = nextProp[styleName]
                    }
                }
            } else {
                if (!styleUpdates) {
                    if (!updatePayload) {
                        updatePayload = []
                    }
                    updatePayload.push(propKey, styleUpdates)
                }
                styleUpdates = nextProp
            }
            // } else if (registrationNameDependencies.hasOwnProperty(propKey)) {
            //     if (!updatePayload) updatePayload = []
        } else if (propKey === CHILDREN) {
            if (typeof nextProp === 'string' || typeof nextProp === 'number') {
                updatePayload.push(propKey, '' + nextProp)
            }
        } else {
            updatePayload.push(propKey, nextProp)
        }
    }

    if (styleUpdates) {
        updatePayload.push(STYLE, styleUpdates)
    }

    return updatePayload
}
