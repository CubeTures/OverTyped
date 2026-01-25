import { useEffect, useState } from "react";

export function useVisible() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
    }, []);

    return visible;
}