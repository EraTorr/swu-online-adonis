import { sorCard } from '../data/sor.js'
import { v4 as uuidv4 } from 'uuid'
import { Card, MoveCardType } from '#types/card.type.js'
import { broadcastResponse } from './action.js'
import { shdCard } from '../data/shd.js'

export type GameType = {
  gameId: string
  p1: string
  p2: string
  connected: {
    p1: boolean
    p2: boolean
  }
  decks: {
    p1: {
      fullDeck: Array<Card>
      playDeck: Array<Card>
    }
    p2: {
      fullDeck: Array<Card>
      playDeck: Array<Card>
    }
  }
  discards: {
    p1: {
      cards: Array<Card>
    }
    p2: {
      cards: Array<Card>
    }
  }
  hands: {
    p1: {
      cards: Array<Card>
    }
    p2: {
      cards: Array<Card>
    }
  }
  resources: {
    p1: {
      cards: Array<Card>
    }
    p2: {
      cards: Array<Card>
    }
  }
  grounds: {
    p1: {
      cards: Array<Card>
    }
    p2: {
      cards: Array<Card>
    }
  }
  spaces: {
    p1: {
      cards: Array<Card>
    }
    p2: {
      cards: Array<Card>
    }
  }
  leaders: {
    p1: Card | null
    p2: Card | null
  }
  bases: {
    p1: Card | null
    p2: Card | null
  }
}

export default class GameService {
  private static instance: GameService
  private constructor() {}

  // public controllers = new Set();

  static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService()
    }
    return GameService.instance
  }

  private games: Map<string, GameType> = new Map()

  getGame(uuid: string): GameType | null {
    return this.games.get(uuid) ?? null
  }

  setGame(uuid: string, game: GameType): void {
    this.games.set(uuid, game)
  }
}

export const getGame = (gameId: string): GameType | null => {
  return GameService.getInstance().getGame(gameId)
}

export const setGame = (game: GameType): void => {
  GameService.getInstance().setGame(game.gameId, game)
}

export const startPhase = (gameId: string) => {
  const game = getGame(gameId) as GameType

  const drawResultP1 = draw(6, game.decks.p1?.playDeck ?? [])
  const drawResultP2 = draw(6, game.decks.p2?.playDeck ?? [])

  const updatedGame = {
    ...game,
    decks: {
      p1: {
        ...game.decks.p1,
        playDeck: drawResultP1.deck,
      },
      p2: {
        ...game.decks.p2,
        playDeck: drawResultP2.deck,
      },
    },
    hands: {
      p1: {
        cards: [...(game.hands.p1?.cards ?? []), ...drawResultP1.hand],
      },
      p2: {
        cards: [...(game.hands.p2?.cards ?? []), ...drawResultP2.hand],
      },
    },
  }

  setGame(updatedGame)
  const decksCount = { p1: drawResultP1.deck.length, p2: drawResultP2.deck.length }
  const leaders = { p1: updatedGame.leaders.p1, p2: updatedGame.leaders.p2 }
  const bases = { p1: updatedGame.bases.p1, p2: updatedGame.bases.p2 }

  const handsP1 = {
    p1: updatedGame.hands.p1?.cards,
    p2: updatedGame.hands.p2?.cards.map(
      (card): Card => hiddenCard(card.id, card.owner, card.type, card.exhaust)
    ),
  }
  const handsP2 = {
    p2: updatedGame.hands.p2?.cards,
    p1: updatedGame.hands.p1?.cards.map(
      (card): Card => hiddenCard(card.id, card.owner, card.type, card.exhaust)
    ),
  }
  const resourcesP1 = {
    p1: updatedGame.resources.p1?.cards,
    p2: updatedGame.resources.p2?.cards.map(
      (card): Card => hiddenCard(card.id, card.owner, card.type, card.exhaust)
    ),
  }
  const resourcesP2 = {
    p2: updatedGame.resources.p2?.cards,
    p1: updatedGame.resources.p1?.cards.map(
      (card): Card => hiddenCard(card.id, card.owner, card.type, card.exhaust)
    ),
  }
  const discards = { p1: game.discards.p1?.cards, p2: game.discards.p2?.cards }
  const spaces = { p1: game.spaces.p1?.cards, p2: game.spaces.p2?.cards }
  const grounds = { p1: game.grounds.p1?.cards, p2: game.grounds.p2?.cards }

  const dataP1 = {
    step: 'initGame',
    decksCount,
    hands: handsP1,
    leaders,
    bases,
    resources: resourcesP1,
    grounds,
    spaces,
    discards,
  }
  const dataP2 = {
    step: 'initGame',
    decksCount,
    hands: handsP2,
    leaders,
    bases,
    resources: resourcesP2,
    grounds,
    spaces,
    discards,
  }

  broadcastResponse(game, dataP1, dataP2)
}

export const reconnect = (gameId: string, playerUuid: string) => {
  const game = getGame(gameId) as GameType

  const decksCount = {
    p1: game.decks.p1?.playDeck?.length ?? 0,
    p2: game.decks.p2?.playDeck?.length ?? 0,
  }
  const leaders = { p1: game.leaders.p1, p2: game.leaders.p2 }
  const bases = { p1: game.bases.p1, p2: game.bases.p2 }
  const grounds = { p1: game.grounds.p1?.cards, p2: game.grounds.p2?.cards }
  const spaces = { p1: game.spaces.p1?.cards, p2: game.spaces.p2?.cards }
  const discards = { p1: game.discards.p1?.cards, p2: game.discards.p2?.cards }

  if (game.p1 === playerUuid) {
    const dataP1 = {
      step: 'initGame',
      decksCount,
      hands: {
        p1: game.hands.p1?.cards,
        p2: game.hands.p2?.cards.map(
          (card): Card => hiddenCard(card.id, card.owner, card.type, card.exhaust)
        ),
      },
      leaders,
      bases,
      resources: {
        p1: game.resources.p1?.cards,
        p2: game.resources.p2?.cards.map(
          (card): Card => hiddenCard(card.id, card.owner, card.type, card.exhaust)
        ),
      },
      grounds,
      spaces,
      discards,
    }
    broadcastResponse(game, dataP1, null)
  } else {
    const dataP2 = {
      step: 'initGame',
      decksCount,
      hands: {
        p2: game.hands.p2?.cards,
        p1: game.hands.p1?.cards.map(
          (card): Card => hiddenCard(card.id, card.owner, card.type, card.exhaust)
        ),
      },
      leaders,
      bases,
      resources: {
        p2: game.resources.p2?.cards,
        p1: game.resources.p1?.cards.map(
          (card): Card => hiddenCard(card.id, card.owner, card.type, card.exhaust)
        ),
      },
      grounds,
      spaces,
      discards,
    }

    broadcastResponse(game, null, dataP2)
  }
}

export const prepareDeckCard = (id: string, owner: string) => {
  let tempCard
  const [set, number] = id.split('_')
  if (set === 'SOR') {
    tempCard = sorCard[Number.parseInt(number) - 1]
  } else if (set === 'SHD') {
    tempCard = shdCard[Number.parseInt(number) - 1]
  } else {
    tempCard = sorCard[Number.parseInt(number) - 1]
  }
  let card = initCard({ id: uuidv4(), owner, side: owner, ...tempCard })

  return card
}

export const moveCard = (gameId: string, moveData: MoveCardType) => {
  const game = getGame(gameId) as GameType
  const { card, side, area, fromArea, playerUuid } = moveData

  const fromSide = card.side === game.p1 ? 'p1' : 'p2'
  const player = playerUuid === game.p1 ? 'p1' : 'p2'
  const toSide = side === 'player' ? (player === 'p1' ? 'p1' : 'p2') : player === 'p1' ? 'p2' : 'p1'
  if (fromArea === area && fromSide === toSide) return

  switch (fromArea) {
    case 'hand': {
      const from = game.hands[fromSide].cards as Array<Card>
      const newFrom = from.filter((cardFrom) => cardFrom.id !== card.id)
      game.hands[fromSide].cards = newFrom
      break
    }
    case 'resource': {
      const from = game.resources[fromSide].cards as Array<Card>
      const newFrom = from.filter((cardFrom) => cardFrom.id !== card.id)
      game.resources[fromSide].cards = newFrom
      break
    }
    case 'display':
    case 'deck': {
      const from = game.decks[fromSide].playDeck as Array<Card>
      const newFrom = from.filter((cardFrom) => cardFrom.id !== card.id)
      game.decks[fromSide].playDeck = newFrom
      break
    }
    case 'discard': {
      const from = game.discards[fromSide].cards as Array<Card>
      const newFrom = from.filter((cardFrom) => cardFrom.id !== card.id)
      game.discards[fromSide].cards = newFrom
      break
    }
    case 'ground': {
      const from = game.grounds[fromSide].cards as Array<Card>
      const newFrom = from.filter((cardFrom) => cardFrom.id !== card.id)
      game.grounds[fromSide].cards = newFrom
      break
    }
    case 'space': {
      const from = game.spaces[fromSide].cards as Array<Card>
      const newFrom = from.filter((cardFrom) => cardFrom.id !== card.id)
      game.spaces[fromSide].cards = newFrom
      break
    }
    case 'leader': {
      break
    }
  }

  const newCard = {
    ...card,
    side: game[toSide],
  }

  switch (area) {
    case 'hand': {
      newCard.modifiedHp = newCard.hp
      newCard.modifiedPower = newCard.power
      newCard.shield = 0
      newCard.experience = 0
      unequipOnLeavePlay(newCard, gameId, playerUuid)
      const from = game.hands[toSide].cards as Array<Card>
      newCard.equipment = []
      game.hands[toSide].cards = [...from, newCard]
      break
    }
    case 'resource': {
      newCard.modifiedHp = newCard.hp
      newCard.modifiedPower = newCard.power
      newCard.shield = 0
      newCard.experience = 0
      unequipOnLeavePlay(newCard, gameId, playerUuid)
      const from = game.resources[toSide].cards as Array<Card>
      game.resources[toSide].cards = [...from, newCard]
      break
    }
    case 'deckbottom': {
      newCard.modifiedHp = newCard.hp
      newCard.modifiedPower = newCard.power
      newCard.shield = 0
      newCard.experience = 0
      unequipOnLeavePlay(newCard, gameId, playerUuid)
      const from = game.decks[toSide].playDeck as Array<Card>
      game.decks[toSide].playDeck = [...from, newCard]
      break
    }
    case 'decktop': {
      newCard.modifiedHp = newCard.hp
      newCard.modifiedPower = newCard.power
      newCard.shield = 0
      newCard.experience = 0
      unequipOnLeavePlay(newCard, gameId, playerUuid)
      const from = game.decks[toSide].playDeck as Array<Card>
      game.decks[toSide].playDeck = [newCard, ...from]
      break
    }
    case 'discard': {
      newCard.modifiedHp = newCard.hp
      newCard.modifiedPower = newCard.power
      newCard.shield = 0
      newCard.experience = 0
      unequipOnLeavePlay(newCard, gameId, playerUuid)
      const from = game.discards[toSide].cards as Array<Card>
      game.discards[toSide].cards = [...from, newCard]
      break
    }
    case 'ground': {
      const from = game.grounds[toSide].cards as Array<Card>
      game.grounds[toSide].cards = [...from, newCard]
      break
    }
    case 'space': {
      const from = game.spaces[toSide].cards as Array<Card>
      game.spaces[toSide].cards = [...from, newCard]
      break
    }
    case 'leader': {
      break
    }
  }

  const newEquipementCards: Array<Card> = []
  newCard.equipment.forEach((equippedCard) => {
    const newEquippedCard = {
      ...equippedCard,
      side: game[toSide],
    }
    newEquipementCards.push(newEquippedCard)
  })

  newCard.equipment = newEquipementCards

  setGame(game)

  buildDataPlayer(gameId, playerUuid)
  buildDataPlayer(gameId, playerUuid, true)
}

export const unequipOnLeavePlay = (newCard: Card, gameId: string, playerUuid: string) => {
  newCard.equipment.forEach((equippedCard) => {
    unequipCard(gameId, { card: equippedCard, playerUuid })
    let s = 'player'
    let a = 'discard'
    if (equippedCard.type === 'Unit') {
      s = 'opponent'
      const arena = equippedCard.arenas?.[0]
      a = arena ? arena.toLowerCase() : 'ground'
    }
    moveCard(gameId, {
      card: equippedCard,
      side: s,
      area: a,
      fromArea: 'equip',
      playerUuid,
    })
  })
  newCard.equipment = []
}

export const equipCard = (gameId: string, data: any) => {
  const game = getGame(gameId) as GameType
  const { playerUuid, card, cardArea, cardToEquip, cardToEquipArea } = data

  const area = cardArea === 'ground' ? 'grounds' : 'spaces'
  const cardToEquipSide = (cardToEquip as Card).side === playerUuid ? 'player' : 'opponent'
  const cardSide = (card as Card).side === playerUuid ? 'player' : 'opponent'

  const moveData = {
    card: cardToEquip,
    side: cardToEquipSide,
    area: 'card',
    fromArea: cardToEquipArea,
    playerUuid,
  }
  const player = playerUuid === game.p1 ? 'p1' : 'p2'
  const cardToEditSide =
    cardSide === 'player' ? (player === 'p1' ? 'p1' : 'p2') : player === 'p1' ? 'p2' : 'p1'

  const cardIndex = game[area][cardToEditSide].cards.findIndex(
    (groundCard) => groundCard.id === card.id
  )

  if (cardIndex > -1 && game[area][cardToEditSide].cards[cardIndex]) {
    const cardToEdit = game[area][cardToEditSide].cards[cardIndex]

    if (cardToEdit.id === cardToEquip.id) {
      return
    }
    cardToEdit.equipment = [...cardToEdit.equipment, cardToEquip]
  } else {
    return
  }

  setGame(game)
  moveCard(gameId, moveData)
  cardToEquip.side = game[area][cardToEditSide].cards[cardIndex].side
  setGame(game)
}

export const unequipCard = (gameId: string, data: any) => {
  const game = getGame(gameId) as GameType
  const { card: card, playerUuid: playerUuid } = data

  const player = playerUuid === game.p1 ? 'p1' : 'p2'
  const cardSide = (card as Card).side === playerUuid ? 'player' : 'opponent'
  const cardFromSide =
    cardSide === 'player' ? (player === 'p1' ? 'p1' : 'p2') : player === 'p1' ? 'p2' : 'p1'

  let areaCard: 'grounds' | 'spaces' = 'grounds'

  let cardIndex = game.grounds[cardFromSide].cards.findIndex(
    (groundCard) =>
      groundCard.equipment.filter((equippedCard) => equippedCard.id === card.id).length
  )

  if (cardIndex === -1) {
    cardIndex = game.spaces[cardFromSide].cards.findIndex((groundCard) =>
      groundCard.equipment.filter((equippedCard) => equippedCard.id === card.id)
    )
    areaCard = 'spaces'
  }
  if (cardIndex > -1 && game[areaCard][cardFromSide].cards[cardIndex]) {
    const cardToEdit = game[areaCard][cardFromSide].cards[cardIndex] as Card
    cardToEdit.equipment = cardToEdit.equipment.filter(
      (equippedCard) => equippedCard.id !== card.id
    )
    game[areaCard][cardFromSide].cards[cardIndex] = cardToEdit
  } else {
    return
  }

  setGame(game)
}

export const buildDataPlayer = (gameId: string, playerUuid: string, opponent = false) => {
  const game = getGame(gameId) as GameType

  const decksCount = {
    p1: game.decks.p1?.playDeck?.length ?? 0,
    p2: game.decks.p2?.playDeck?.length ?? 0,
  }
  const leaders = { p1: game.leaders.p1, p2: game.leaders.p2 }
  const bases = { p1: game.bases.p1, p2: game.bases.p2 }
  const grounds = { p1: game.grounds.p1?.cards, p2: game.grounds.p2?.cards }
  const spaces = { p1: game.spaces.p1?.cards, p2: game.spaces.p2?.cards }
  const discards = { p1: game.discards.p1?.cards, p2: game.discards.p2?.cards }

  if ((game.p1 === playerUuid && !opponent) || (game.p2 === playerUuid && opponent)) {
    const dataP1 = {
      step: 'updateData',
      decksCount,
      hands: {
        p1: game.hands.p1?.cards,
        p2: game.hands.p2?.cards.map(
          (card): Card => hiddenCard(card.id, card.owner, card.type, card.exhaust)
        ),
      },
      leaders,
      bases,
      resources: {
        p1: game.resources.p1?.cards,
        p2: game.resources.p2?.cards.map(
          (card): Card => hiddenCard(card.id, card.owner, card.type, card.exhaust)
        ),
      },
      grounds,
      spaces,
      discards,
    }
    broadcastResponse(game, dataP1, null)
  } else {
    const dataP2 = {
      step: 'updateData',
      decksCount,
      hands: {
        p2: game.hands.p2?.cards,
        p1: game.hands.p1?.cards.map(
          (card): Card => hiddenCard(card.id, card.owner, card.type, card.exhaust)
        ),
      },
      leaders,
      bases,
      resources: {
        p2: game.resources.p2?.cards,
        p1: game.resources.p1?.cards.map(
          (card): Card => hiddenCard(card.id, card.owner, card.type, card.exhaust)
        ),
      },
      grounds,
      spaces,
      discards,
    }

    broadcastResponse(game, null, dataP2)
  }
}

export const drawCard = (gameId: string, draw: any) => {
  const game = getGame(gameId) as GameType

  const { value, playerUuid } = draw

  const player = playerUuid === game.p1 ? 'p1' : 'p2'

  // case 'deck': {
  const fromDeck = game.decks[player].playDeck as Array<Card>
  const drawnedCards = fromDeck.splice(0, value)
  game.decks[player].playDeck = fromDeck

  // hand
  const fromHand = game.hands[player].cards as Array<Card>
  const newFromHand = [...fromHand, ...drawnedCards]
  game.hands[player].cards = newFromHand

  setGame(game)
  buildDataPlayer(gameId, playerUuid)
  buildDataPlayer(gameId, playerUuid, true)
}

export const lookCard = (gameId: string, look: any) => {
  const game = getGame(gameId) as GameType

  const { value, playerUuid } = look

  const player = playerUuid === game.p1 ? 'p1' : 'p2'

  const fromDeck = game.decks[player].playDeck as Array<Card>
  const drawnedCards = fromDeck.slice(0, value)

  const data = {
    action: 'look',
    cards: drawnedCards,
  }

  if (player === 'p1') {
    broadcastResponse(game, data, null)
  } else {
    broadcastResponse(game, null, data)
  }
}

export const discardCard = (gameId: string, discard: any) => {
  const game = getGame(gameId) as GameType
  const { value, playerUuid } = discard

  const player = playerUuid === game.p1 ? 'p1' : 'p2'

  const fromDeck = game.decks[player].playDeck as Array<Card>
  const drawnedCards = fromDeck.splice(0, value)

  game.discards[player].cards = [...game.discards[player].cards, ...drawnedCards]

  setGame(game)

  buildDataPlayer(gameId, playerUuid)
  buildDataPlayer(gameId, playerUuid, true)
}

export const healCard = (gameId: string, action: any) => {
  healthCardEdit(gameId, action, true)
}

export const damageCard = (gameId: string, action: any) => {
  healthCardEdit(gameId, action)
}

export const changeExperience = (gameId: string, action: any) => {
  const game = getGame(gameId) as GameType
  const { value, playerUuid, card } = action

  const player = card.side === game.p1 ? 'p1' : 'p2'

  let area: 'grounds' | 'spaces' = 'grounds'
  let cardIndex = game.grounds[player].cards.findIndex((groundCard) => groundCard.id === card.id)

  if (cardIndex === -1) {
    area = 'spaces'
    cardIndex = game.spaces[player].cards.findIndex((groundCard) => groundCard.id === card.id)
  }

  if (cardIndex > -1 && game[area][player].cards[cardIndex].modifiedHp) {
    const cardToEdit = game[area][player].cards[cardIndex]
    const currentExp = cardToEdit.experience
    const diff = currentExp - value
    cardToEdit.experience = value
    cardToEdit.modifiedHp = Math.max(0, (cardToEdit.modifiedHp ?? 0) - diff)
    cardToEdit.modifiedPower = Math.max(0, (cardToEdit.modifiedPower ?? 0) - diff)
  }
  setGame(game)

  buildDataPlayer(gameId, playerUuid)
  buildDataPlayer(gameId, playerUuid, true)
}

export const changeShield = (gameId: string, action: any) => {
  const game = getGame(gameId) as GameType
  const { value, playerUuid, card } = action

  const player = card.side === game.p1 ? 'p1' : 'p2'

  let area: 'grounds' | 'spaces' = 'grounds'
  let cardIndex = game.grounds[player].cards.findIndex((groundCard) => groundCard.id === card.id)

  if (cardIndex === -1) {
    area = 'spaces'
    cardIndex = game.spaces[player].cards.findIndex((groundCard) => groundCard.id === card.id)
  }

  if (cardIndex > -1 && game[area][player].cards[cardIndex].modifiedHp) {
    const cardToEdit = game[area][player].cards[cardIndex]

    cardToEdit.shield = value
  }
  setGame(game)

  buildDataPlayer(gameId, playerUuid)
  buildDataPlayer(gameId, playerUuid, true)
}

export const healthCardEdit = (gameId: string, action: any, heal = false) => {
  const game = getGame(gameId) as GameType
  const { value, playerUuid, card } = action

  const player = card.side === game.p1 ? 'p1' : 'p2'

  let area: 'grounds' | 'spaces' = 'grounds'
  let cardIndex = game.grounds[player].cards.findIndex((groundCard) => groundCard.id === card.id)

  if (cardIndex === -1) {
    area = 'spaces'
    cardIndex = game.spaces[player].cards.findIndex((groundCard) => groundCard.id === card.id)
  }

  if (cardIndex > -1 && game[area][player].cards[cardIndex].modifiedHp) {
    const cardToEdit = game[area][player].cards[cardIndex]

    cardToEdit.modifiedHp = heal
      ? (cardToEdit.modifiedHp as number) + value
      : (cardToEdit.modifiedHp as number) - value
  }
  setGame(game)

  buildDataPlayer(gameId, playerUuid)
  buildDataPlayer(gameId, playerUuid, true)
}

export const addUpgrade = () => {}

export const removeUpgrade = () => {}

export const shuffleCard = (gameId: string, shuffle: any) => {
  const game = getGame(gameId) as GameType
  const { playerUuid } = shuffle

  const player = playerUuid === game.p1 ? 'p1' : 'p2'

  game.decks[player].playDeck = shuffleDeck(game.decks[player].playDeck as Array<Card>)

  setGame(game)
}

export const shuffleBottomCard = (gameId: string, shuffle: any) => {
  const game = getGame(gameId) as GameType
  const { playerUuid, value } = shuffle

  const player = playerUuid === game.p1 ? 'p1' : 'p2'

  game.decks[player].playDeck = shuffleDeckPart(game.decks[player].playDeck as Array<Card>, value)

  setGame(game)
}

export const hiddenCard = (
  cardUuid: string,
  ownerUuid: string,
  type: string,
  exhaust = false
): Card => {
  return initCard({
    id: cardUuid,
    cost: 0,
    set: 'no',
    number: '000',
    name: 'card_back',
    type,
    frontText: 'card_back',
    rarity: 'no',
    unique: false,
    owner: ownerUuid,
    side: ownerUuid,
    exhaust,
  })
}

export const initCard = (data: any): Card => {
  return {
    shield: 0,
    experience: 0,
    modifiedCost: data.cost ?? 0,
    modifiedPower: data.power ?? 0,
    modifiedHp: data.hp ?? 0,
    exhaust: false,
    equipment: [],
    ...data,
  }
}

export const draw = (amount: number, deck: Array<Card>) => {
  if (deck.length < amount) {
    // TODO implement life reducing system + mange
    return { hand: deck.slice(0, amount), deck: [], minusLife: deck.length - amount }
  }
  return { hand: deck.slice(0, amount), deck: deck.slice(amount), minusLife: 0 }
}

export const shuffleDeck = (deck: Array<Card>) => {
  const deckCopy = deck.slice(0)
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deckCopy[i], deckCopy[j]] = [deckCopy[j], deckCopy[i]]
  }
  return deckCopy
}

export const shuffleDeckPart = (deck: Array<Card>, number: number) => {
  const deckCopy = deck.slice(0)
  const deckCopyToShuffle = deckCopy.splice(deckCopy.length - number)
  for (let i = deckCopyToShuffle.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deckCopyToShuffle[i], deckCopyToShuffle[j]] = [deckCopyToShuffle[j], deckCopyToShuffle[i]]
  }
  return [...deckCopy, ...deckCopyToShuffle]
}

export const changeStats = (gameId: string, action: any) => {
  const game = getGame(gameId) as GameType
  const { hp, power, playerUuid, card } = action
  const player: 'p1' | 'p2' = card.side === game.p1 ? 'p1' : 'p2'

  if (card.type === 'Base') {
    const base = game.bases[player] as Card
    base.modifiedHp = hp
    game.bases[player] = base
  } else {
    let area: 'grounds' | 'spaces' = 'grounds'
    let cardIndex = game.grounds[player].cards.findIndex((groundCard) => groundCard.id === card.id)

    if (cardIndex === -1) {
      area = 'spaces'
      cardIndex = game.spaces[player].cards.findIndex((groundCard) => groundCard.id === card.id)
    }

    if (cardIndex > -1 && game[area][player].cards[cardIndex].modifiedHp) {
      const cardToEdit = game[area][player].cards[cardIndex]

      cardToEdit.modifiedHp = hp
      cardToEdit.modifiedPower = power
    }
  }

  setGame(game)

  buildDataPlayer(gameId, playerUuid)
  buildDataPlayer(gameId, playerUuid, true)
}

export const exhaustCard = (gameId: string, action: any) => {
  const game = getGame(gameId) as GameType

  const { playerUuid, card } = action

  const player = card.side === game.p1 ? 'p1' : 'p2'

  let area: 'grounds' | 'spaces' | 'leaders' | 'bases' | 'resources'

  let cardIndex = -1
  if (card.type === 'Base') {
    area = 'bases'
  } else if (card.type === 'Leader') {
    area = 'leaders'

    cardIndex = game.grounds[player].cards.findIndex((c) => c.id === card.id)
    if (cardIndex > -1) {
      area = 'grounds'
    }
  } else {
    area = 'grounds'
    cardIndex = game.grounds[player].cards.findIndex((c) => c.id === card.id)

    if (cardIndex === -1) {
      area = 'spaces'
      cardIndex = game.spaces[player].cards.findIndex((c) => c.id === card.id)
    }

    if (cardIndex === -1) {
      area = 'resources'
      cardIndex = game.resources[player].cards.findIndex((c) => c.id === card.id)
    }
  }

  if (area === 'bases' || area === 'leaders' || cardIndex > -1) {
    let cardToEdit: Card
    if (area === 'bases' || area === 'leaders') {
      cardToEdit = game[area][player] as Card
    } else {
      cardToEdit = game[area][player].cards[cardIndex]
    }

    cardToEdit.exhaust = !cardToEdit.exhaust
  }

  setGame(game)

  buildDataPlayer(gameId, playerUuid)
  buildDataPlayer(gameId, playerUuid, true)
}
