import {
    createContainer, updateContainer
} from '../react-reconciler/ReactFiberReconciler'
import {FiberRoot} from '../react-reconciler/ReactInternalTypes'
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

}

export const createRoot = (container: Container): ReactDOMRoot => {
    return new ReactDOMRoot(container)
}

const createRootImpl = (container: Container): FiberRoot => {
    const root = createContainer(container)
    // listenToAllSupportedEvents(container)
    return root
}

