/// <reference path="./generatedTypes.d.ts" />

interface Drink {
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

interface DrinkManifest {
    drinks: Drink[];
    nameToUrl: { [name: string]: string };
    ingredientHashes: string[];
    vesselHashes: string[];
    vesselEmoji: { [vesselHash: string]: number[] };
}

interface DrinkUi extends Drink {
}

interface DrinkManifestUi extends DrinkManifest {
    drinks: DrinkUi[];
}

