const botWebsocket = require('../modules/botWebsocket')
module.exports = class BehaviorGetClosestEnemy {
  constructor (bot, targets, mode, distance) {
    this.bot = bot
    this.targets = targets
    this.stateName = 'getClosestEnemy'

    this.mode = mode
    this.distance = distance

    this.entities = []
    this.currentEntity = false
  }

  onStateEntered () {
    if (this.mode === 'none') {
      this.targets.entity = undefined
    } else {
      if (!this.currentEntity || this.entities.length <= this.currentEntity) {
        this.entities = this.sortEntitiesDistance()
        this.currentEntity = 0
      }

      if (this.entities.length > 0) {
        const validEntity = this.getValidPath(this.entities[this.currentEntity])
        if (validEntity) {
          const blockPosition = {
            position: this.entities[this.currentEntity].position.offset(0, this.entities[this.currentEntity].height, 0)
          }
          if (this.bot.canSeeBlock(blockPosition)) {
            this.targets.entity = this.entities[this.currentEntity]
          }
        }

        this.currentEntity++
      }
    }
  }

  getValidPath (entity) {
    if (entity.type === 'mob' && (
      entity.mobType === 'Phantom' ||
      entity.mobType === 'Blaze' ||
      entity.mobType === 'Ender Dragon'
    )) { return true }
    const mcData = require('minecraft-data')(this.bot.version)
    const mineflayerPathfinder = require('mineflayer-pathfinder')
    this.movements = new mineflayerPathfinder.Movements(this.bot, mcData)
    this.movements.digCost = 100
    this.movements.canDig = false

    const goal = new mineflayerPathfinder.goals.GoalNear(entity.position.x, entity.position.y, entity.position.z, 2)

    const result = this.bot.pathfinder.getPathTo(this.movements, goal, 40)

    return result.status === 'success'
  }

  sortEntitiesDistance () {
    const entities = this.getAllEntities()
    entities.sort(function (a, b) {
      return a.distance - b.distance
    })
    return entities
  }

  getAllEntities () {
    const entities = []
    for (const entityName of Object.keys(this.bot.entities)) {
      const entity = this.bot.entities[entityName]
      if (entity === this.bot.entity) { continue }

      if (!this.filter(entity)) { continue }

      const dist = entity.position.distanceTo(this.bot.entity.position)
      entity.distance = dist

      entities.push(entity)
    }
    return entities
  }

  filter (entity) {
    if (this.mode === 'pvp') {
      if (
        (entity.position.distanceTo(this.bot.player.entity.position) <= this.distance) &&
        (entity.type === 'mob' || entity.type === 'player') &&
        (entity.mobType !== 'Armor Stand') &&
        (entity.kind !== 'Passive mobs') &&
        (entity.isValid)
      ) {
        const botFriends = botWebsocket.getFriends()
        const bFriend = botFriends.find(b => b.name === entity.username)
        if (bFriend !== undefined) {
          return false
        }

        const masters = botWebsocket.getMasters()
        const mFriend = masters.find(b => b.name === entity.username)
        if (mFriend !== undefined) {
          return false
        }

        return true
      }
    }

    if (this.mode === 'pve') {
      return (entity.position.distanceTo(this.bot.player.entity.position) <= this.distance) &&
        (entity.type === 'mob') &&
        (entity.mobType !== 'Armor Stand') &&
        (entity.kind !== 'Passive mobs') &&
        (entity.isValid)
    }

    return false
  }
}
