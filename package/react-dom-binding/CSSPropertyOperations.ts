import dangerousStyleValue from "./shared/dangerousStyleValue";


export const setValueForStyles = (node: HTMLElement, styles: Record<string, any>) => {
    const style = node.style;
    for (let styleName in styles) {
        if (!styles.hasOwnProperty(styleName)) {
            continue;
        }

        const styleValue = dangerousStyleValue(
            styleName,
            styles[styleName],
        );

        if (styleName === 'float') {
            styleName = 'cssFloat';
        }

        style[styleName] = styleValue;
    }
}
