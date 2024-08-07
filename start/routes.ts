/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

const UsersController = () => import('#controllers/games_controller')
router.get('game', [UsersController, 'board'])
router.get('pregame', [UsersController, 'pregame'])
router.get('/', [UsersController, 'pregame'])
router.get('matchmaking', [UsersController, 'matchmaking'])

const DeckValidateController = () => import('#controllers/api/deck_validate_controller')
router.post('api/deck-validate', [DeckValidateController, 'index'])

const MatchmakingController = () => import('#controllers/api/matchmaking_controller')
router.post('api/matchmaking', [MatchmakingController, 'index'])
router.delete('api/matchmaking', [MatchmakingController, 'delete'])

const GameConnectController = () => import('#controllers/api/game_connect_controller')
router.post('api/game-connect', [GameConnectController, 'index'])

const ActionController = () => import('#controllers/api/action_controller')
router.post('api/action', [ActionController, 'index'])
