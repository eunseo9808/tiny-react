import {
    createContainer, updateContainer
} from '../react-reconciler/ReactFiberReconciler'
import {FiberRoot} from '../react-reconciler/ReactInternalTypes'
import {markContainerAsRoot} from '../react-dom-binding/ReactDOMComponentTree'
import {COMMENT_NODE} from '../react-dom-binding/shared/HTMLNodeType'
import {ReactElement} from "../shared/ReactTypes";
import {Container} from "../react-dom-binding/shared/ContainerType";

// import { listenToAllSupportedEvents } from './events/DOMPluginEventSystem'

class ReactDOMRoot {
    _internalRoot: FiberRoot

    constructor(container: Container) {
        this._internalRoot = createRootImpl(container)
    }

    render(children: ReactElement): void {
        const root = this._internalRoot
        updateContainer(children, root)
    }

    unmount() {
    }
}

export const createRoot = (container: Container): ReactDOMRoot => {
    return new ReactDOMRoot(container)
}

const createRootImpl = (container: Container): FiberRoot => {
    const root = createContainer(container)
    markContainerAsRoot(root.current, container)

    const rootContainerElement =
        container.nodeType === COMMENT_NODE ? container.parentNode! : container

    // listenToAllSupportedEvents(rootContainerElement)
    return root
}

