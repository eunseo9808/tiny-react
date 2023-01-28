export type Key = string | number

export interface ReactElement<P = any,
    T extends string | ReactFuntionElement<any> =
            | string
        | ReactFuntionElement<any>> {
    type: T
    props: P
    key: Key | null
}

export type ReactFuntionElement<P> = (props: P) => ReactElement | null
