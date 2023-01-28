import {Key} from "../shared/ReactTypes";
import {REACT_ELEMENT_TYPE} from "../shared/ReactSymbols";

type ReactElement = {
    $$typeof: Symbol
    type: any
    key: Key | null
    props: any
}

const RESERVED_PROPS = {
    key: true
}

export function createElement(
    type: any,
    config?: Record<string, any>,
    ...children: any[]
): ReactElement {
    const props: Record<string, any> = {}
    let key: Key | null = null

    for (const propName in config) {
        if (!RESERVED_PROPS.hasOwnProperty(propName)) {
            props[propName] = config[propName]
        }
    }

    if (config?.key !== undefined) {
        key = '' + config?.key
    }

    if (children.length === 1) {
        props.children = children[0]
    } else if (children.length > 1) {
        props.children = children
    }

    const element: ReactElement = {
        $$typeof: REACT_ELEMENT_TYPE,
        type: type,
        key: key,
        props,
    }

    return element
}
