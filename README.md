# Wiki Mixer

This site displays cocktails scraped from Wikipedia. View it here:

[https://recognition101.github.io/wiki-mixer/](https://recognition101.github.io/wiki-mixer/)

## Features

 1. **Ingredients** - Input the ingredients on hand, and it will display which cocktails can be made.
 2. **Filters** - Create complex filters to find cocktails with specific ingredients or drinkware.
 3. **Storage** - All ingredients and filters are saved locally between closes/refreshes.
 4. **Offline** - The page is cached and can be displayed even with no internet connection.
 5. **Dark Mode** - Respects your device's dark mode settings.

## Scripts

### Scraper

Run with: `./data/download.js`.

It does the following:

1. Spiders Wikipedia, caching each cocktail page in the `./data/cache.json` file.
2. For each cocktail, get a common name per ingredient.
    1. Example: `2 dashes scotch whiskey` would become `Scotch Whisky`
    2. Example: `1cl herbsaint` would become `Anise Liqueur`
3. Downloads all associated images (if not already downloaded) into the `./data/images/` directory.
4. For each image, use [k-means clustering](https://en.wikipedia.org/wiki/K-means_clustering) in HSV space to pick 4 representative colors.
5. Write all downloaded and computed data (cocktails, common ingredient names, image references, and colors) into the `./data/drinks.js` file.

### Build / Verification Scripts

Each script can be run with `npm run <TaskName>`:

| Task Name      | Purpose                                                    |
| -------------- | ---------------------------------------------------------- |
| `lint-types`   | Uses TypeScript to strictly static-type-check all JS.      |
| `build-lib`    | Builds `./src/lib/*` by running all `build-lib-*` tasks.   |
| `build-lib-js` | Bundles `./build/lib-entry.js` &rarr; `./src/lib/lib.js`.  |
| `build-lib-cp` | Copies `./build/lib-entry.js` &rarr; `./src/lib/lib.d.ts`. |

