import {container, singleton} from "tsyringe";
import {ReactComponent} from "./components/ReactComponent";
import {FragmentComponent} from "./components/FragmentComponent";
import {FunctionComponent} from "./components/FunctionComponent";
import {HostComponent} from "./components/HostComponent";
import {HostRootComponent} from "./components/HostRootComponent";
import {HostTextComponent} from "./components/HostTextComponent";

@singleton()
export class ComponentProvider {
    getComponent(tag): ReactComponent {
        switch (tag) {
            case FragmentComponent.tag:
                return container.resolve(FragmentComponent)

            case FunctionComponent.tag:
                return container.resolve(FunctionComponent)

            case HostComponent.tag:
                return container.resolve(HostComponent)

            case HostRootComponent.tag:
                return container.resolve(HostRootComponent)

            case HostTextComponent.tag:
                return container.resolve(HostTextComponent)
        }
    }
}
