export function getElementSize<T extends HTMLDivElement>(ref: React.RefObject<T | null>) {
    return ref.current?.getBoundingClientRect();
}