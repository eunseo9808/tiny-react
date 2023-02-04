import {FiberRoot} from "../../react-reconciler-oop/ReactFiberRoot";


export type Container =
    | (Element & { _reactRootContainer?: FiberRoot })
    | (Document & { _reactRootContainer?: FiberRoot })
