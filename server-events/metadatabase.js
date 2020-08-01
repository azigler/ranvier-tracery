const { Logger } = require('ranvier')

module.exports = {
  listeners: {
    startup: state => async function (commander) {
      const grammar = await state.EntityLoaderRegistry.get('metadata').fetch('grammar')
      delete grammar._id
      delete grammar._rev

      Logger.log('[Tracery] Metadatabase grammar loaded!')

      state.RoomManager.grammar = grammar
      state.MobManager.grammar = grammar
      state.ItemManager.grammar = grammar
    },

    shutdown: state => function () {
    }
  }
}
