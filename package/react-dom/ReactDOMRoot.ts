import "reflect-metadata";
import {ReactElement} from "../shared/ReactTypes";
import {Container} from "../react-dom-binding/shared/ContainerType";
import {listenToAllSupportedEvents} from '../react-dom-binding/events/DOMPluginEventSystem'
import {container, singleton} from "tsyringe";
import {ContainerFactory} from "../react-reconciler-oop/ContainerFactory";
import {FiberRoot} from "../react-reconciler-oop/ReactFiberRoot";

const containerFactory = container.resolve(ContainerFactory);

class ReactDOMRoot {
    _internalRoot: FiberRoot

    constructor(container: Container) {
        this._internalRoot = createRootImpl(container)
    }

    render(children: ReactElement): void {
        const root = this._internalRoot
        containerFactory.updateContainer(children, root)
    }
}

export const createRoot = (container: Container): ReactDOMRoot => {
    return new ReactDOMRoot(container)
}

const createRootImpl = (container: Container): FiberRoot => {
    const root = containerFactory.createContainer(container)
    listenToAllSupportedEvents(container)
    return root
}
