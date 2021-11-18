![](https://images.prismic.io/andrewzigler/d9a510f3-10e1-4191-a73a-2d4e1740d88a_ranvier-tracery.jpg?ixlib=gatsbyFP&auto=compress%2Cformat&fit=max&q=50&rect=0%2C0%2C1200%2C628&w=1200&h=628)

# ranvier-tracery *\*\*(deprecated)\*\**

> Generate and manipulate text in Ranvier with Tracery

[Tracery](https://github.com/galaxykate/tracery) is a JavaScript library by [GalaxyKate](https://twitter.com/GalaxyKate) that uses grammars to generate surprising new text. This bundle includes utility functions that allow you to easily manipulate Ranvier entities with customizable grammars. By using this bundle, you can procedurally generate game content with flexibility and ease. This bundle also includes a setup for a centralized grammar that can be shared between entities.

To use this bundle, you will need a specific checkout of Ranvier. You __MUST__ use my experimental fork ([azigler/zigmud](https://github.com/azigler/zigmud)) alongside a checkout of my experimental core:develop branch ([azigler/core:develop](https://github.com/azigler/core/tree/develop)).

This bundle __WILL NOT WORK__ with a [regular Ranvier checkout](https://github.com/RanvierMUD/ranviermud).

As of now, this bundle has only been tested with [ranvier-datasource-couchdb](https://github.com/azigler/ranvier-datasource-couchdb).

### Instructions

1. Install this bundle in your Ranvier repository.

2. Update `entityLoaders` in your `ranvier.json` to include a loader for the metadatabase:

```
"metadata": {
  "source": "CouchDb",
  "config": {
    "db": "metadata"
  }
}
```

3. In the metadatabase that you're now loading, create a `grammar` object (whether it's a flat file or a database document) and add all of your desired grammar symbols and their values. Here's an example CouchDB document containing a centralized grammar:

```
{
  "_id": "grammar",
  "_rev": "2-ed5180be502a96db1bbc7c751ff4f035",
  "color": [
    "red",
    "green",
    "blue"
  ],
  "yellow": [
    "sunflower yellow",
    "golden yellow",
    "honey yellow",
    "lemon yellow"
  ]
}
```
For example, you could use `#$yellow#` to reference the `yellow` entry in this grammar (more on this below).


### Usage

To use the tools in `TraceryUtil`, you need to correctly mark the `name`/`title`, `roomDesc`, and `description` properties. Surround the noun (e.g., `!pair!`) or the noun phrase (e.g., `!rusty windchime! with wooden pegs`) with `!`. To reference a grammar within one of those properties, include the grammar property's name between `#` symbols (e.g., `#material#`). You can then specify the grammar in `metadata`.

To reference a grammar property in the centralized grammar loaded from the metadatabase, prepend a `$` symbol before the name (e.g., `$color`). Here is an example:

```
{
      "id": "boots",
      "type": "EQUIPMENT",
      "name": "!pair! of #material# boots with #$color# laces",
      "roomDesc": "!pair! of #material# boots is together on the ground here",
      "description": "These boots are for utility rather than fashion, featuring chunky soles and stiff, rounded toes. The boots are made from #material#. The laces are #$color#.",
      "metadata": {
        "grammar": {
          "material": [
            "leather",
            "pleather",
            "plastic",
            "rubber",
            "nylon"
          ]
        }
      }
}
```


Programmatically, you can use this bundle to manipulate the data set above. For example, here is a message that will return the right noun and article for a single instance of the specified entity: ```B.sayAt(player, `You look at ${TraceryUtil.pluralizeEntity(entity)}.`)```. This might print as `You look at an orangutan.` or `You look at a zebra.` You can also specify multiple instances: ```B.sayAt(player, `You see ${TraceryUtil.pluralizeEntity(entity, 5)}.`)``` might print as `You see 5 wizards.`

This bundle's `lib` directory includes `TraceryUtil` and its collection of helper functions listed below:


##### pluralizeEntity

The `pluralizeEntity` method accepts a `GameEntity` and returns a correctly pluralized version of the property you specify, based upon the marked noun in the property.

```
/**
   * Pluralize a GameEntity's property
   *
   * @param {GameEntity} entity GameEntity to pluralize
   * @param {number} amount number of items
   * @param {string} prop property to pluralize
   * @param {boolean} proper whether or not the noun is proper (the vs. a/an)
   * @return {string} pluralized entity property
   */
  static pluralizeEntity (entity, amount = 1, prop = 'name', proper = false) {
    ...
  }
```


##### pluralizeEntityList

The `pluralizeEntityList` method accepts an `Array` or `Set` of `GameEntity` objects and returns a correctly pluralized and formatted list using the `pluralizeEntity` method. This can be used to print `Inventory` contents, for example.

```  
/**
   * Pluralize an array of GameEntities
   *
   * @param {Array|Set} list Array of GameEntities to pluralize
   * @param {string} prop Property to pluralize
   * @param {boolean} formatted Whether or not to align the list with padding
   * @return {string} Broadcastable string of pluralized GameEntities
   */
  static pluralizeEntityList (list, prop = 'name', formatted = true) {
      ...
  }
```

##### flattenEntityProps

The `flattenEntityProps` method accepts a `GameEntity`, iterates through all of its grammar-capable properties (`name`, `title`, `description`, and `roomDesc`) and flattens them, stores the grammar results within `metadata.flattenedGrammar` on the `GameEntity` (for potential use by behaviors, scripts, and commands), and assigns keywords based on the results. You can call `pluralizeEntity` without first using this method, as that method will call this one if the `GameEntity` has not yet been flattened.
  
```
/**
   * Flatten a GameEntity's properties
   *
   * @param {GameEntity} entity GameEntity to flatten
   */
  static flattenEntityProps (entity) {
      ...
  }
```

### Resources

To learn more about using Tracery, check out the links below:

[Tracery Homepage](https://tracery.io/)

[Tracery Tutorial](http://www.crystalcodepalace.com/traceryTut.html)

[galaxykate/tracery on GitHub](https://github.com/galaxykate/tracery/tree/tracery2)

[tracery-grammar npm package](https://www.npmjs.com/package/tracery-grammar)

[Sculpting Generative Text with Tracery](https://www.andrewzigler.com/blog/sculpting-generative-text-with-tracery/)

[Subverting Historical Cause & Effect: Generation of Mythic Biographies in Caves of Qud](http://www.freeholdgames.com/papers/Generation_of_mythic_biographies_in_Cavesofqud.pdf)
