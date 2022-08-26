import { combineReducers } from 'redux'
import safeReducer from './safe'
import accountReducer from './account'
const createRootReducer = combineReducers({
    app: (state = {}, action) => state,
    safe:safeReducer,
    account:accountReducer
})

export default createRootReducer
