export type IconButtonVariant =
    | "default"
    | "primary"
    | "success"
    | "error"
    | "warning"
    | "muted"

export interface IconButtonProps {
    onclick?: () => void
    variant?: IconButtonVariant
}
