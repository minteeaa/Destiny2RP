require('dotenv').config()
let presence = {}
let displayPresence = {}
let ddp = {}
const prompts = require('prompts')
const got = require('got')
const apiKey = process.env.apiKey
const _ = require('underscore')
let verbose
let response
let done = false
let mid
let mtype
let hashtec
let charIds
let filteredActivity
let filteredDestination
let filteredActivityType
let startTime

async function searchPlayers (platform, name) {
  try {
    console.log('Searching player...')
    let res = await got(`/Destiny2/SearchDestinyPlayer/${platform}/${name}/?lc=en`, {
      baseUrl: 'https://www.bungie.net/Platform',
      headers: {
        'X-API-Key': apiKey
      }
    })
    mid = await JSON.parse(res.body).Response[0].membershipId
    mtype = await JSON.parse(res.body).Response[0].membershipType
    done = true
  } catch (e) {
    console.log(e)
  }
}

async function findCurrentActivity (charId, membershipId, membershipType) {
  // Finds the current activity and activityMode hashes
  // If 0, then no activity is in progress
  try {
    if (verbose === true) console.log('Finding player activity...')
    let res = await got(`/Destiny2/${membershipType}/Profile/${membershipId}/Character/${charId}?components=204`, {
      baseUrl: 'https://www.bungie.net/Platform',
      headers: {
        'X-API-Key': apiKey
      }
    })
    if (JSON.parse(res.body).Response.activities.data.currentActivityHash !== 0) {
      startTime = JSON.parse(res.body).Response.activities.data.dateActivityStarted
      hashtec = JSON.parse(res.body).Response.activities.data.currentActivityHash
    }
  } catch (e) {
    console.log(e)
  }
}

async function getRecentCharacter (id, type) {
  try {
    if (verbose === true) console.log('Getting recent character...')
    let res = await got(`/Destiny2/${type}/Profile/${id}?components=100`, {
      baseUrl: 'https://www.bungie.net/Platform',
      headers: {
        'X-API-Key': apiKey
      }
    })
    charIds = JSON.parse(res.body).Response.profile.data.characterIds
  } catch (e) {
    console.log(e)
  }
}

async function identifyHash (hash, table) {
  try {
    if (verbose === true) console.log(`Identifying Hash... ${hash} in table ${table}`)
    let res = await got(`/Destiny2/Manifest/Destiny${table}Definition/${hash}/`, {
      baseUrl: 'https://www.bungie.net/Platform',
      headers: {
        'X-API-Key': apiKey
      }
    })
    return JSON.parse(res.body).Response
  } catch (e) {
    console.log(e)
  }
}

async function updatePresence (id, type) {
  if (verbose === true) console.log('Updating presence...')
  presence = {}
  while (done === true) {
    await getRecentCharacter(id, type)
    done = false
    for (let x = 0; x < charIds.length; x++) {
      await findCurrentActivity(charIds[x], mid, mtype)
    }
    if (hashtec != null) {
      filteredActivity = await identifyHash(hashtec, 'Activity')
      filteredDestination = await identifyHash(filteredActivity.destinationHash, 'Destination')
      filteredActivityType = await identifyHash(filteredActivity.activityTypeHash, 'ActivityType')
      if (filteredDestination.displayProperties.name === '') presence.activity = 'In Orbit'
      else {
        if (filteredActivityType.displayProperties.description != null) {
          if (filteredActivityType.displayProperties.description.length > 128) presence.altText = filteredActivityType.displayProperties.description.substring(0, 125) + '...'
          else presence.altText = filteredActivityType.displayProperties.description
        }
        presence.activity = filteredActivityType.displayProperties.name
        presence.location = filteredDestination.displayProperties.name
      }
    } else if (hashtec == null) {
      presence.activity = 'Offline'
      presence.location = 'Rich presence disabled'
      presence.offline = true
    }
    if (presence.time == null) {
      presence.time = new Date(startTime)
    }
  }
}

const DiscordRPC = require('discord-rpc')
const rpc = new DiscordRPC.Client({ transport: 'ipc' })
const clientId = '489959127448027136'
DiscordRPC.register(clientId)

async function setActivity () {
  try {
    await updatePresence(mid, mtype)
    if (presence.offline) {
      return console.log('Player offline... returning.')
    }
    if (_.isEqual(displayPresence, presence) === false) {
      displayPresence = presence
      ddp = { activity: displayPresence.activity, location: displayPresence.location, altText: displayPresence.altText }
      if (ddp.activity == null) ddp.activity = 'None'
      if (ddp.location == null) ddp.location = 'None'
      if (ddp.altText == null) ddp.altText = 'None'
      console.log('Updated Presence:\n' +
                  `Details: ${ddp.activity}\n` +
                  `State: ${ddp.location}\n` +
                  `Image Text: ${ddp.altText}`)
    }
    if (verbose === true) console.log('Setting activity...')
    done = true
    rpc.setActivity({
      details: presence.activity,
      state: presence.location,
      startTimestamp: presence.time,
      largeImageKey: 'destiny_logo',
      largeImageText: presence.altText,
      instance: false
    })
  } catch (e) {
    console.log(e)
  }
}

const questions = [
  {
    type: 'text',
    name: 'name',
    message: 'Battle.net username (<name>#<discriminator>)'
  },
  {
    type: 'text',
    name: 'verbose',
    message: 'Enable verbose? (y/n)'
  }
]

rpc.on('ready', () => {
  (async () => {
    response = await prompts(questions)
    searchPlayers(4, response.name.replace('#', '%23'))
    if (response.verbose === 'y') verbose = true
    else if (response.verbose === 'n') verbose = false
    setInterval(() => setActivity(), 15000)
  })()
})

rpc.login({ clientId }).catch(console.error)
