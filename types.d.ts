export interface Drink {
    name: string;
    url: string;
    isIba: boolean;
    ingredients: string[];
    ingredientHashes: string[][];
    preparation: string;
    imageUrl?: string|null;
    imageColors?: number[][];
    imageWikiUrl?: string|null;
    vessel?: string|null;
    vesselHash?: string|null;
    vesselUrl?: string|null;
    vesselWikiUrl?: string|null;
    notes?: string|null;
    served?: string|null;
    garnish?: string|null;
    isRejected?: boolean|null;
}

export interface DrinkManifest {
    drinks: Drink[];
    nameToUrl: { [name: string]: string };
    ingredientHashes: string[];
    vesselHashes: string[];
    vesselEmoji: { [vesselHash: string]: number[] };
}

export interface DrinkUi extends Drink {
}

export interface DrinkManifestUi extends DrinkManifest {
    drinks: DrinkUi[];
}

export interface EventLike {
    type: string;
    target: EventTarget | null;
    noPropagation?: boolean;
}

type VNode = import("./lib/snabbdom/vnode").VNode;

type MaybeArray<T> = T | T[];

type HtmlHandler<T extends keyof HTMLElementTagNameMap> =
    (ev: EventLike, target: HTMLElementTagNameMap[T]) =>
        boolean | void | Promise<boolean|void>;

type HtmlStyle = { [ key in keyof CSSStyleDeclaration & string ]?: string };

/** Extra attributes our `h` DOM-construction function can set. */
type HtmlAdditionExtras<T extends keyof HTMLElementTagNameMap> = {
    /** Special Snabbdom Properties */
    key: string;
    class: {[key: string]: boolean};
    focused: boolean;
    style: HtmlStyle;
    onRootUpdate: HtmlHandler<T>;

    /** Missing HTML Properties */
    placeholder: string;
    disabled: "disabled";
    selected: boolean;
    checked: boolean;
    for: string;

    /** Aria attributes */
    role:
        | "alert" | "application" | "article" | "banner" | "button"
        | "cell" | "checkbox" | "comment" | "complementary"
        | "contentinfo" | "dialog" | "document" | "feed" | "figure"
        | "form" | "grid" | "gridcell" | "heading" | "img" | "list"
        | "listbox" | "listitem" | "main" | "mark" | "navigation"
        | "region" | "row" | "rowgroup" | "search" | "suggestion"
        | "switch" | "tab" | "table" | "tabpanel" | "text" | "textbox"
        | "timer" | "combobox";
    ariaLabel: string;
    ariaHidden: boolean;
    ariaChecked: "true" | "false";
    ariaDescribedby: string;
    ariaLabelledby: string;
    ariaAutocomplete: string;
    ariaOwns: string;
};

type GetEventNames<T extends string> = T extends `on${infer N}` ? N : never;
type HtmlAllElements = HTMLElementTagNameMap[keyof HTMLElementTagNameMap];
type HtmlAllEventNames = GetEventNames<keyof HtmlAllElements>;
type HtmlAdditionLocalHandlers<T extends keyof HTMLElementTagNameMap> = {
    [key in `on${Capitalize<HtmlAllEventNames>}`]: HtmlHandler<T>;
};
type HtmlAdditionGlobalHandlers<T extends keyof HTMLElementTagNameMap> = {
    [key in `onRoot${Capitalize<HtmlAllEventNames>}`]: HtmlHandler<T>;
};
type HtmlAdditions<T extends keyof HTMLElementTagNameMap> =
    HtmlAdditionExtras<T> &
    HtmlAdditionLocalHandlers<T> &
    HtmlAdditionGlobalHandlers<T>;

type HtmlOmissions<T extends keyof HTMLElementTagNameMap> =
    keyof HtmlAdditions<T> | `on${HtmlAllEventNames}`;

/** All attributes that the DOM-construction function `h` can set. */
export type HtmlAttributeSet<T extends keyof HTMLElementTagNameMap> =
    Partial<Omit<HTMLElementTagNameMap[T], HtmlOmissions<T>>> &
    Partial<HtmlAdditions<T>>;

/** The types of children `h` can append to a created HTML Element. */
export type HtmlOptions<T extends keyof HTMLElementTagNameMap> =
    MaybeArray<HtmlAttributeSet<T> | VNode | string | null | undefined>;

