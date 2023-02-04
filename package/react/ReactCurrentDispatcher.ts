import {Dispatcher} from "../react-reconciler-oop/types/ReactHooksTypes";

const ReactCurrentDispatcher: {
    current: null | Dispatcher
} = {
    current: null,
}

export { ReactCurrentDispatcher }
