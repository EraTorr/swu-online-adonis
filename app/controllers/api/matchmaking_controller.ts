import { v4 as uuidv4 } from 'uuid'
import { HttpContext } from '@adonisjs/core/http'
import MatchmakingService from '#services/matchmaking'
import { redis } from '#services/redis'

export default class MatchmakingController {
  async index(ctx: HttpContext) {
    if (ctx.request.header('Content-Type') === 'application/json') {
      let { uuid, matchmakingId } = ctx.request.body()

      try {
        uuid = typeof uuid === 'string' ? uuid : uuidv4()
        const opponentFound = await getOpponent(uuid, matchmakingId)

        if (opponentFound) {
          const game = MatchmakingService.getInstance().createGame(uuid, opponentFound)
          return ctx.response.status(200).send(JSON.stringify({ uuid, game }))
        }

        if (matchmakingId?.length) {
          await redis.hSet('matchmakingId', matchmakingId, uuid)
        } else {
          const randNumber = Math.floor(Math.random() * 5) + 1
          await redis.zAdd('matchmaking', { score: randNumber, value: uuid }, { NX: true })
        }
      } catch (error) {
        console.error(error)
      }

      return ctx.response.status(200).send(JSON.stringify({ uuid }))
    }
    return ctx.response.status(400)
  }

  async delete(ctx: HttpContext) {
    redis.zRem('matchmaking', ctx.request.qs().uuid)

    return ctx.response.status(200)
  }
}

const getOpponent = async (uuidP1: string, matchmakingId: string) => {
  if (matchmakingId?.length) {
    const opponentUuid: string | null = (await redis.hGet('matchmakingId', matchmakingId)) ?? null
    if (opponentUuid) {
      redis.hDel('matchmakingId', matchmakingId)
    }
    return opponentUuid
  }
  let array = [1, 2, 3, 4, 5]
  let currentIndex = array.length

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--

    // And swap it with the current element.
    ;[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
  }

  let uuidP2: string | null = null
  for (const number of array) {
    const res: Array<string> = await redis.zRange('matchmaking', number - 1, number + 1)
    const filtered = res.filter((uuid) => uuid !== uuidP1)
    if (filtered.length === 0) continue
    const t = Math.floor(Math.random() * filtered.length)
    uuidP2 = filtered[t]
    await redis.zRem('matchmaking', uuidP2)

    break
  }

  if (uuidP2) {
    return uuidP2
  }
  return null
}
