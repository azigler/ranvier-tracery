const tracery = require('tracery-grammar')
const sprintf = require('sprintf-js').sprintf

module.exports = class TraceryUtil {
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
    if (!entity.__flattened) this.flattenEntityProps(entity)

    const multiple = amount > 1
    const property = multiple ? [entity[prop].replace(/!(.*?)!/, '%% #noun.s#')] : [entity[prop].replace(/!(.*?)!/, '#noun#')]

    // TODO: clean up for ansi parsing

    const grammarObj = {
      [prop]: property,
      origin: [`#${prop}#`]
    }
    if (entity[prop].match(/!(.*?)!/)) {
      grammarObj.noun = [`${entity[prop].match(/!(.*?)!/)[0].replace(/!/g, '')}`]
    // if entity is a Player
    } else {
      grammarObj.noun = [entity[prop]]
    }

    let grammar = tracery.createGrammar(grammarObj)
    grammar.addModifiers(tracery.baseEngModifiers)

    const noun = grammar.flatten(`${proper ? 'the ' : ''}#noun${!multiple && !proper ? '.a' : ''}#`)
    grammarObj.noun = noun

    grammar = tracery.createGrammar(grammarObj)
    grammar.addModifiers(tracery.baseEngModifiers)

    let str = grammar.flatten('#origin#')

    // TODO: improve pluralizing for other verbs
    if (amount > 1) str = str.replace(/\bis\b/g, 'are')

    return str.replace(/%%/, amount)
  }

  /**
   * Pluralize an Array of GameEntities
   *
   * @param {Array|Set} list Array of GameEntities to pluralize
   * @param {string} prop Property to pluralize
   * @param {boolean} formatted Whether or not to align the list with padding
   * @return {string|string[]} Broadcastable string (or Array of strings) of pluralized GameEntities
   */
  static pluralizeEntityList (list, prop = 'name', formatted = true) {
    const entities = []
    const entityCounts = {}

    for (let entity of list) {
      // handle if list is a Set
      if (Array.isArray(entity)) {
        entity = entity[1]
      }
      entities.push(entity)
      entityCounts[entity[prop]] = (entityCounts[entity[prop]] || 0) + 1
    }

    const toPrint = []

    for (const entity of Object.keys(entityCounts)) {
      const x = entities.filter(elem => elem[prop] === entity)

      if (x.length === 1) {
        toPrint.push(TraceryUtil.pluralizeEntity(x[0], entityCounts[entity], prop))
      } else {
        for (const i of x) {
          toPrint.push(TraceryUtil.pluralizeEntity(i, entityCounts[entity], prop))
          break
        }
      }
    }

    if (formatted) {
      const toPrintArray = []
      for (const print of toPrint) {
        let temp = ''
        if (print.substr(0, 2) === 'a ') {
          temp = sprintf(`%${print.length + 2}s`, print)
        } if (print.substr(0, 3) === 'an ') {
          temp = sprintf(`%${print.length + 1}s`, print)
        } if (parseInt(print.substr(0, 2)) > 9) {
          temp = sprintf(`%${print.length + 1}s`, print)
        } if (parseInt(print.substr(0, 2)) > 1) {
          temp = sprintf(`%${print.length + 2}s`, print)
        }
        if (temp.length <= 80) {
          toPrintArray.push(temp)
        } else {
          toPrintArray.push(temp.replace(/([\w\s]{76,}?)\s?\b/g, '$1\n     '))
        }
      }
      return toPrintArray
    } else {
      return toPrint
    }
  }

  /**
   * Flatten a GameEntity's properties
   *
   * @param {GameEntity} entity GameEntity to flatten
   */
  static flattenEntityProps (entity) {
    if (entity.__flattened) return

    if (!entity.metadata.grammar) entity.metadata.grammar = {}

    // build Tracery grammar from metadata
    const props = {}
    for (const prop in entity.metadata.grammar) {
      const checkGrammarSource = (property, fromDefinition = true, parentProp) => {
        if (property.substr(0, 1) === '$') {
        // if the grammar property was set on the entity's definition
          if (fromDefinition) {
            // if '...', fetch remote grammar and add to it
            if (entity.metadata.grammar[property]['...'] === true) {
              entity.metadata.grammar[property] = [...entity.__manager.grammar[property.slice(1)], ...entity.metadata.grammar[property].value]
              // otherwise, fetch remote grammar and use it
            } else {
              entity.metadata.grammar[property] = entity.__manager.grammar[prop.slice(1)]
            }
          // otherwise, if the grammar property was imported from metadatabase
          } else {
            entity.metadata.grammar[property] = entity.__manager.grammar[property.slice(1)]
            entity.metadata.grammar[parentProp][entity.metadata.grammar[parentProp].indexOf(property)] = `#${property}#`
          }
        }
      }

      // pull required metadatabase grammars for entity definition
      checkGrammarSource(prop)

      // pull required metadatabase grammars for any previously-pulled grammars
      for (const grammarProperty of entity.metadata.grammar[prop]) {
        checkGrammarSource(grammarProperty, false, prop)
      }

      const grammar = tracery.createGrammar({
        ...entity.metadata.grammar,
        origin: [`#${prop}#`]
      })
      props[prop] = [grammar.flatten('#origin#')]
    }

    // save flattened grammar for later use
    entity.metadata.flattenedGrammar = props

    const grammar = tracery.createGrammar({
      ...entity.metadata.grammar,
      ...props,
      name: [entity.name],
      roomDesc: [entity.roomDesc],
      description: [entity.description],
      title: [entity.title]
    })

    grammar.addModifiers(tracery.baseEngModifiers)

    // flatten grammar to get results
    if (entity.name) {
      entity.name = grammar.flatten('#name#')
    }
    if (entity.title) {
      entity.title = grammar.flatten('#title#')
    }
    if (entity.roomDesc) {
      entity.roomDesc = grammar.flatten('#roomDesc#')
    }
    if (entity.description) {
      entity.description = grammar.flatten('#description#')
    }

    if (entity.keywords) {
      // handle special grammar properties
      const givenName = grammar.flatten('#_name#')
      if (givenName !== '((_name))') {
        entity.keywords.push(givenName)
      }

      // start determining keywords
      const keywordGrammars = entity.keywords.join(' ').match(/(#.+?#)/gi) || ''

      // TODO: clean up for ansi parsing
      entity.keywords = [...entity.keywords.join(' ').replace(/(<.+?>|!|,|#)/gi, '').split(' '), ...entity.name.replace(/(<.+?>|!|,|#)/gi, '').split(' ')]

      for (const key of entity.keywords) {
        // split hyphenated keywords
        if (key.includes('-')) {
          const [key1, key2] = key.split('-')
          entity.keywords.push(key1, key2)
        }

        // filter out keywords matching grammar property names
        if (entity.metadata.grammar && Object.keys(entity.metadata.grammar).join(' ').includes(key)) {
          entity.keywords[entity.keywords.indexOf(key)] = ''
        }

        // filter out keywords matching grammar markers in properties
        for (const kwGr of keywordGrammars) {
          if (key.includes(kwGr.replace(/(<.+?>|!|,|#)/gi, ''))) {
            entity.keywords[entity.keywords.indexOf(key)] = ''
          }
        }

        // filter out common articles and prepositions
        if (key.match(/(with|the|is|are|its)/gi)) {
          entity.keywords[entity.keywords.indexOf(key)] = ''
        }

        // handle quoted words with and without quotation marks
        if (key.match(/"(.*)"/gi)) {
          entity.keywords.push(key.match(/"(.*)"/i)[1])
        }

        // lowercase all keywords
        entity.keywords[entity.keywords.indexOf(key)] = key.toLowerCase()
      }

      // filter out empty keywords
      entity.keywords = entity.keywords.filter(key => key.length > 0)

      // filter out extra keywords
      entity.keywords = [...new Set(entity.keywords)]
    }

    entity.__flattened = true
  }
}
