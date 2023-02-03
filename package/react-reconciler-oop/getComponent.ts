import {FunctionComponent} from "./component/FunctionComponent";
import {FragmentComponent} from "./component/FragmentComponent";
import {HostComponent} from "./component/HostComponent";
import {HostTextComponent} from "./component/HostTextComponent";
import {HostRootComponent} from "./component/HostRootComponent";
import {ReactComponent} from "./component/ReactComponent";
import {container} from "tsyringe";


export const getComponent = (tag): ReactComponent => {
    let component = null
    switch (tag) {
        case FunctionComponent.tag:
            component = container.resolve(FunctionComponent)
            break

        case FragmentComponent.tag:
            component = container.resolve(FragmentComponent)
            break

        case HostComponent.tag:
            component = container.resolve(HostComponent)
            break

        case HostTextComponent.tag:
            component = container.resolve(HostTextComponent)
            break

        case HostRootComponent.tag:
            component = container.resolve(HostRootComponent)
            break
    }

    return component
}
