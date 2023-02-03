import {FiberRoot} from "../../react-reconciler-oop/types/ReactInternalTypes";


export type Container =
    | (Element & { _reactRootContainer?: FiberRoot })
    | (Document & { _reactRootContainer?: FiberRoot })
