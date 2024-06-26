import type { Component, JSXElement } from 'solid-js'
import { mergeProps, createSignal, onMount, Show, For } from 'solid-js'
import { GameCard } from './game_card.js'

import '../css/game.scss'
import { newListener } from '../helpers/app.helper.js'
import { Actions, type ActionsData } from './actions.js'
import { hiddenCard, type Card } from '../helpers/card.js'
import { Deck } from './deck.js'
import { OpponentHiddenCard } from './opponent_hidden_card.js'
import { DiscardPile } from './discard_pile.js'
import type { MoveCardType } from '#types/card.type.ts'
import { CentralDisplay } from './central_display.js'
import axios from 'axios'
import { transmit } from '~/js/transmit_client.js'

export const GameComponent: Component = (props) => {
  let element!: HTMLDivElement
  let myuuid: string
  let gameId: string
  let opponentUuid: string

  const [base, setBase] = createSignal<Card>()
  const [opponentBase, setOpponentBase] = createSignal<Card>()
  const [leader, setLeader] = createSignal<Card>()
  const [opponentLeader, setOpponentLeader] = createSignal<Card>()

  const [actionsData, setActionsData] = createSignal<ActionsData | null>(null)
  // const [actionsArea, setActionsArea] = createSignal<string>('');
  // const [actionsCard, setActionsCard] = createSignal<string>('');
  const [cards, setCards] = createSignal<Array<Card>>([])
  const [opponentHandCount, setOpponentHandCount] = createSignal<number>(0)
  const [opponentHandCards, setOpponentHandCards] = createSignal<Array<Card>>([])
  const [opponentResourcesCards, setOpponentResourcesCards] = createSignal<Array<Card>>([])

  const [opponentResourcesCount, setOpponentResourcesCount] = createSignal<number>(11)
  const [opponentExhaustedResourcesCount, setOpponentExhaustedResourcesCount] =
    createSignal<number>(1)
  const [handCards, setHandCards] = createSignal<Array<Card>>([])
  const [deckCount, setDeckCount] = createSignal<number>(0)
  const [opponentDeckCount, setOpponentDeckCount] = createSignal<number>(0)
  const [discardPileCards, setDiscardPileCards] = createSignal<Array<Card>>([])
  const [opponentDiscardPileCards, setOpponentDiscardPileCards] = createSignal<Array<Card>>([])
  const [resourcesCards, setResourcesCards] = createSignal<Array<Card>>([])
  const [groundCards, setGroundCards] = createSignal<Array<Card>>([])
  const [spaceCards, setSpaceCards] = createSignal<Array<Card>>([])
  const [opponentGroundCards, setOpponentGroundCards] = createSignal<Array<Card>>([])
  const [opponentSpaceCards, setOpponentSpaceCards] = createSignal<Array<Card>>([])
  const [centralDisplayCards, setCentralDisplayCards] = createSignal<Array<Card>>([])
  const [centralDisplayChildren, setCentralDisplayChildren] = createSignal<JSXElement>(null)

  const updateData = (data: any) => {
    console.log(data.bases.p1, data.bases.p2)
    if (myuuid === data.leaders.p1.owner) {
      setLeader(data.leaders.p1)
      setBase(undefined)
      setBase(data.bases.p1)
      setDeckCount(data.decksCount.p1)
      setResourcesCards(data.resources.p1)
      setHandCards(data.hands.p1)
      setGroundCards(data.grounds.p1)
      setSpaceCards(data.spaces.p1)
      setDiscardPileCards(data.discards.p1)

      setOpponentLeader(data.leaders.p2)
      setOpponentBase(undefined)
      setOpponentBase(data.bases.p2)
      setOpponentDeckCount(data.decksCount.p2)
      setOpponentResourcesCards(data.resources.p2)
      setOpponentHandCards(data.hands.p2)
      setOpponentGroundCards(data.grounds.p2)
      setOpponentSpaceCards(data.spaces.p2)
      setOpponentDiscardPileCards(data.discards.p2)
    } else {
      setLeader(data.leaders.p2)
      setBase(undefined)
      setBase(data.bases.p2)
      setDeckCount(data.decksCount.p2)
      setResourcesCards(data.resources.p2)
      setHandCards(data.hands.p2)
      setGroundCards(data.grounds.p2)
      setSpaceCards(data.spaces.p2)
      setDiscardPileCards(data.discards.p2)

      setOpponentLeader(data.leaders.p1)
      setOpponentBase(undefined)
      setOpponentBase(data.bases.p1)
      setOpponentDeckCount(data.decksCount.p1)
      setOpponentResourcesCards(data.resources.p1)
      setOpponentHandCards(data.hands.p1)
      setOpponentGroundCards(data.grounds.p1)
      setOpponentSpaceCards(data.spaces.p1)
      setOpponentDiscardPileCards(data.discards.p1)
    }
  }

  onMount(async () => {
    const game = JSON.parse(sessionStorage.getItem('game') as string)
    myuuid = localStorage.getItem('myuuid') as string
    gameId = game.gameId
    opponentUuid = game.p1 === myuuid ? game.p2 : game.p1

    const gameExistResponse = await axios.post('/api/game-connect', JSON.stringify({ gameId }), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (gameExistResponse.status === 400) {
      window.location.replace('pregame')
    }

    const subscription = transmit.subscription('game/' + gameId + '/' + myuuid)
    await subscription.create()

    subscription.onMessage(async (event: any) => {
      console.log('game-' + gameId, event)

      const eventParsed = await JSON.parse(event)
      const data = eventParsed.data
      console.log('message', data)
      if (data.step) {
        executeStep(data)
      } else {
        if (data.action) {
          if (data.action === 'sendDeck') {
            // send deck
            const deckParsed = JSON.parse(localStorage.getItem('deck') as string)
            axios.post(
              '/api/action',
              JSON.stringify({
                action: 'sendDeck',
                data: { gameId: gameId, uuid: myuuid, deck: deckParsed },
              }),
              {
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            )
          }
          if (data.action === 'reconnect') {
            // send deck
            const deckParsed = JSON.parse(localStorage.getItem('deck') as string)
            axios.post(
              '/api/action',
              JSON.stringify({
                action: 'reconnect',
                data: { gameId: gameId, uuid: myuuid, deck: deckParsed },
              }),
              {
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            )
          }
          if (data.action === 'look') {
            setCentralDisplay(data.cards)
          }
        }
      }
    })

    newListener(document, 'sendMessage', (event: CustomEvent) => {
      const e = event as CustomEvent
      console.log('sendMessage', e.detail)
      axios.post(
        '/api/action',
        JSON.stringify({
          action: 'action',
          data: JSON.stringify(e.detail),
        }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    })

    window.addEventListener('unload', async function (e) {
      await subscription.delete()
    })

    axios.post(
      '/api/action',
      JSON.stringify({ action: 'acknowledge', data: { uuid: myuuid, gameId } }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  })

  const setCentralDisplay = (cardList: Array<Card>) => {
    setCentralDisplayCards(cardList)
    setCentralDisplayChildren(
      cardList.length ? (
        <For each={cardList}>
          {(card, index) => {
            return (
              <GameCard
                name={card.id}
                cardData={card}
                pathFront={card.number === '000' ? 'card_back' : 'SOR/' + card.number}
                pathBack={card.type === 'Leader' ? 'SOR/' + card.number + '-b' : undefined}
                openActions={openActions}
                area="display"
                pushNewPosition={cardPushNewPosition}
              ></GameCard>
            )
          }}
        </For>
      ) : null
    )
  }

  const openActions = (e: ActionsData) => {
    setActionsData(e)
  }

  const sendEvent = (e: string, value?: any) => {
    const actionData = actionsData() as ActionsData
    const card = actionsData()?.card as Card
    console.log(actionsData())

    if (e.includes('moveto')) {
      setActionsData({
        ...actionData,
        type: 'moveto',
      })
    } else if (e.startsWith('to')) {
      const split = e.split('_')

      if (actionData.area === 'display') {
        const cardsList = centralDisplayCards()
        const index = cardsList.findIndex((c: Card) => c.id === card.id)
        cardsList.splice(index, 1)
        setCentralDisplay(cardsList)
      }
      cardPushNewPosition(card, split[2], split[1], actionData.area)
      setActionsData(null)
      // TODO
    } else if (['draw', 'look', 'discard', 'heal', 'damage', 'changeStats'].includes(e) && !value) {
      setActionsData({
        ...actionData,
        type: e,
      })
    } else if (['draw', 'look', 'discard', 'heal', 'damage'].includes(e)) {
      sendXAction(e, value, card)
      setActionsData(null)
    } else if (e === 'changestats') {
      const data: any = {
        hp: value.hp,
        power: value.power,
        playerUuid: myuuid,
        card: card,
      }

      sendAction('changestats', { action: data })
      setActionsData(null)
    } else {
      const data: any = {
        playerUuid: myuuid,
      }
      sendAction(e, { action: data })

      setActionsData(null)
    }

    console.log(card, e, actionsData())
  }

  const executeStep = (data: any) => {
    const step = data.step

    switch (step) {
      case 'initGame':
        updateData(data)
        break
      case 'updateData':
        updateData(data)
        break
      case 'show':
        show(data)
        break
    }
  }

  const show = (data: any) => {
    if (data.type === 'cards') {
      let display = (
        <>
          <For each={data.cards}>
            {(card, index) => {
              return (
                <GameCard
                  name={card.id}
                  cardData={card}
                  pathFront={'SOR/' + card.number}
                  openActions={openActions}
                  area="resource"
                  pushNewPosition={cardPushNewPosition}
                ></GameCard>
              )
            }}
          </For>
        </>
      )
      setCentralDisplayChildren(display)
    }
  }

  const cardPushNewPosition = (card: Card, side: string, area: string, fromArea: string): void => {
    const move: MoveCardType = {
      card,
      side,
      area,
      fromArea,
      playerUuid: myuuid,
    }
    console.log('sendWS', 'moveCard', { move })
    sendAction('moveCard', { move })
  }

  const sendXAction = (action: string, count: number, card: Card): void => {
    const data: any = {
      value: count,
      playerUuid: myuuid,
      card: card,
    }

    sendAction(action, { action: data })
    return
  }

  const sendAction = (action: string, data: any) => {
    axios.post(
      '/api/action',
      JSON.stringify({
        action: action,
        data: {
          gameId: gameId,
          ...data,
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }

  const showDiscardPile = (side: string): void => {
    if (side === 'player') {
      setCentralDisplayChildren(
        <For each={discardPileCards()}>
          {(card, index) => {
            return (
              <GameCard
                name={card.id}
                cardData={card}
                pathFront={card.number === '000' ? 'card_back' : 'SOR/' + card.number}
                pathBack={card.type === 'Leader' ? 'SOR/' + card.number + '-b' : undefined}
                openActions={openActions}
                area="discard"
                pushNewPosition={cardPushNewPosition}
              ></GameCard>
            )
          }}
        </For>
      )
    } else {
      setCentralDisplayChildren(
        <For each={opponentDiscardPileCards()}>
          {(card, index) => {
            return (
              <GameCard
                name={card.id}
                cardData={card}
                pathFront={card.number === '000' ? 'card_back' : 'SOR/' + card.number}
                pathBack={card.type === 'Leader' ? 'SOR/' + card.number + '-b' : undefined}
                openActions={openActions}
                area="hand"
                pushNewPosition={cardPushNewPosition}
              ></GameCard>
            )
          }}
        </For>
      )
    }
  }

  const hideCentralDisplay = (): void => {
    setCentralDisplayChildren(null)
  }

  return (
    <div ref={element} class="game">
      <div class="top">
        <div class="hand flex" data-action="top-hand">
          <For each={opponentHandCards()}>
            {(card, index) => {
              return (
                <GameCard
                  name={card.id}
                  cardData={card}
                  pathFront={card.number === '000' ? 'card_back' : 'SOR/' + card.number}
                  pathBack={card.type === 'Leader' ? 'SOR/' + card.number + '-b' : undefined}
                  openActions={openActions}
                  area="hand"
                  pushNewPosition={cardPushNewPosition}
                ></GameCard>
              )
            }}
          </For>
        </div>
        <div class="board">
          <div class="area-1">
            <div class="ressource flex" data-action="top-ressource">
              <For each={opponentResourcesCards()}>
                {(card, index) => {
                  return (
                    <GameCard
                      name={card.id}
                      cardData={card}
                      pathFront={'SOR/' + card.number}
                      pathBack={card.type === 'Leader' ? 'SOR/' + card.number + '-b' : undefined}
                      openActions={openActions}
                      area="resource"
                      pushNewPosition={cardPushNewPosition}
                    ></GameCard>
                  )
                }}
              </For>
            </div>
            <div class="deck flex" data-action="top-deck">
              <Deck left={opponentDeckCount()} openActions={openActions} side="opponent"></Deck>
            </div>
            <div class="discard flex" data-action="top-discard">
              <DiscardPile
                cardList={opponentDiscardPileCards()}
                showDiscardPile={showDiscardPile}
                side="opponent"
              ></DiscardPile>
            </div>
          </div>
          <div class="area-2">
            <div class="ground flex" data-action="top-ground">
              <For each={opponentGroundCards()}>
                {(card, index) => {
                  return (
                    <GameCard
                      name={card.id}
                      cardData={card}
                      pathFront={'SOR/' + card.number}
                      pathBack={card.type === 'Leader' ? 'SOR/' + card.number + '-b' : undefined}
                      openActions={openActions}
                      area="ground"
                      pushNewPosition={cardPushNewPosition}
                    ></GameCard>
                  )
                }}
              </For>
            </div>
            <div class="middle">
              <div class="leader flex" data-action="top-leader">
                <Show when={opponentLeader()}>
                  {(c) => {
                    const card = c()
                    return (
                      <GameCard
                        name={card.id}
                        cardData={card}
                        pathFront={'SOR/' + card.number}
                        pathBack={card.type === 'Leader' ? 'SOR/' + card.number + '-b' : undefined}
                        openActions={openActions}
                        area="leader"
                        pushNewPosition={cardPushNewPosition}
                      ></GameCard>
                    )
                  }}
                </Show>
              </div>
              <div class="base flex" data-action="top-base">
                <Show when={opponentBase()}>
                  {(c) => {
                    const card = c()
                    return (
                      <GameCard
                        name={card.id}
                        cardData={card}
                        pathFront={'SOR/' + card.number}
                        pathBack={card.type === 'Leader' ? 'SOR/' + card.number + '-b' : undefined}
                        openActions={openActions}
                        area="base"
                        pushNewPosition={cardPushNewPosition}
                      ></GameCard>
                    )
                  }}
                </Show>
              </div>
            </div>
            <div class="space flex" data-action="top-space">
              <For each={opponentSpaceCards()}>
                {(card, index) => {
                  return (
                    <GameCard
                      name={card.id}
                      cardData={card}
                      pathFront={'SOR/' + card.number}
                      pathBack={card.type === 'Leader' ? 'SOR/' + card.number + '-b' : undefined}
                      openActions={openActions}
                      area="space"
                      pushNewPosition={cardPushNewPosition}
                    ></GameCard>
                  )
                }}
              </For>
            </div>
          </div>
        </div>
      </div>
      <div class="bottom">
        <div class="board">
          <div class="area-2">
            <div class="ground flex" data-action="bottom-ground">
              <For each={groundCards()}>
                {(card, index) => {
                  return (
                    <GameCard
                      name={card.id}
                      cardData={card}
                      pathFront={'SOR/' + card.number}
                      pathBack={card.type === 'Leader' ? 'SOR/' + card.number + '-b' : undefined}
                      openActions={openActions}
                      area="ground"
                      pushNewPosition={cardPushNewPosition}
                    ></GameCard>
                  )
                }}
              </For>
            </div>
            <div class="middle">
              <div class="base flex" data-action="bottom-base">
                <Show when={base()}>
                  {(c) => {
                    const card = c()
                    return (
                      <GameCard
                        name={card.id}
                        cardData={card}
                        pathFront={'SOR/' + card.number}
                        pathBack={card.type === 'Leader' ? 'SOR/' + card.number + '-b' : undefined}
                        openActions={openActions}
                        area="base"
                        pushNewPosition={cardPushNewPosition}
                      ></GameCard>
                    )
                  }}
                </Show>
              </div>
              <div class="leader flex" data-action="bottom-leader">
                <Show when={leader()}>
                  {(c) => {
                    const card = c()
                    return (
                      <GameCard
                        name={card.id}
                        cardData={card}
                        pathFront={'SOR/' + card.number}
                        pathBack={card.type === 'Leader' ? 'SOR/' + card.number + '-b' : undefined}
                        openActions={openActions}
                        area="leader"
                        pushNewPosition={cardPushNewPosition}
                      ></GameCard>
                    )
                  }}
                </Show>
              </div>
            </div>
            <div class="space flex" data-action="bottom-space">
              <For each={spaceCards()}>
                {(card, index) => {
                  return (
                    <GameCard
                      name={card.id}
                      cardData={card}
                      pathFront={'SOR/' + card.number}
                      pathBack={card.type === 'Leader' ? 'SOR/' + card.number + '-b' : undefined}
                      openActions={openActions}
                      area="space"
                      pushNewPosition={cardPushNewPosition}
                    ></GameCard>
                  )
                }}
              </For>
            </div>
          </div>
          <div class="area-1">
            <div class="ressource flex" data-action="bottom-ressource">
              <For each={resourcesCards()}>
                {(card, index) => {
                  return (
                    <GameCard
                      name={card.id}
                      cardData={card}
                      pathFront={'SOR/' + card.number}
                      pathBack={card.type === 'Leader' ? 'SOR/' + card.number + '-b' : undefined}
                      openActions={openActions}
                      area="resource"
                      pushNewPosition={cardPushNewPosition}
                    ></GameCard>
                  )
                }}
              </For>
            </div>
            <div class="deck flex" data-action="bottom-deck">
              <Deck left={deckCount()} openActions={openActions} side="player"></Deck>
            </div>
            <div class="discard flex" data-action="bottom-discard">
              <DiscardPile
                cardList={discardPileCards()}
                showDiscardPile={showDiscardPile}
                side="player"
              ></DiscardPile>
            </div>
          </div>
        </div>
        <div class="hand flex" data-action="bottom-hand">
          <For each={handCards()}>
            {(card, index) => {
              return (
                <GameCard
                  name={card.id}
                  cardData={card}
                  pathFront={'SOR/' + card.number}
                  pathBack={card.type === 'Leader' ? 'SOR/' + card.number + '-b' : undefined}
                  openActions={openActions}
                  area="hand"
                  pushNewPosition={cardPushNewPosition}
                ></GameCard>
              )
            }}
          </For>
        </div>
      </div>

      <Show when={actionsData()}>
        <Actions data={actionsData() as ActionsData} sendEvent={sendEvent}></Actions>
      </Show>

      <Show when={centralDisplayChildren()}>
        <CentralDisplay hideCentralDisplay={hideCentralDisplay}>
          {centralDisplayChildren()}
        </CentralDisplay>
      </Show>
    </div>
  )
}
