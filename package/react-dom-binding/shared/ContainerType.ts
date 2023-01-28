import {FiberRoot} from "../../react-reconciler/ReactInternalTypes";


export type Container =
    | (Element & { _reactRootContainer?: FiberRoot })
    | (Document & { _reactRootContainer?: FiberRoot })
