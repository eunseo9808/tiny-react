export type Key = string | number

export interface ReactElement<P = any,
    T extends string | ReactFuntionElement<any> =
            | string
        | ReactFuntionElement<any>> {
    type: T
    props: P
    key: Key | null
}
export type ReactEmpty = null | void | boolean;
export type ReactFuntionElement<P> = (props: P) => ReactElement | null
export type ReactText = string | number
export type ReactNode = ReactElement | ReactText | ReactFragment
export type ReactFragment = ReactEmpty | Iterable<ReactNode>;
