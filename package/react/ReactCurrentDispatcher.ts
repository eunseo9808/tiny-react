import {Dispatcher} from "../react-reconciler-oop/types/RectHooksTypes";

const ReactCurrentDispatcher: {
    current: null | Dispatcher
} = {
    current: null,
}

export { ReactCurrentDispatcher }
