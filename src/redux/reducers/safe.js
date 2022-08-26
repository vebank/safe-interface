const _init = {
    tokens: {},
    address: null,
    owners: null,
    threshold: 0,
    transactions: []
}
export const ADD_TOKEN = 'ADD_TOKEN';
export const SAVE_INFO = 'SAVE_INFO';
export const UPDATE_TOKEN = 'UPDATE_TOKEN';
export const UPDATE_TRANSACTION = 'UPDATE_TRANSACTION'
const _handler = {
    [UPDATE_TRANSACTION]: (state, {payload}) => ({
        ...state,
        transactions: {
            ...state.transactions,
            [payload.txHash]: {
                ...(state.transactions[payload.txHash] || {}),
                ...payload.tx,
                txHash: payload.txHash
            }
        }
    }),
    [ADD_TOKEN]: (state, {payload}) => ({
        ...state,
        tokens: {
            ...state.tokens,
            [payload.address]: {
                ...payload.info,
                address: payload.address
            }
        }
    }),
    [UPDATE_TOKEN]: (state, {payload}) => ({
        ...state,
        tokens: {
            ...state.tokens,
            [payload.address]: {
                ...(state.tokens[payload.address] || {}),
                ...payload.update,
                address: payload.address
            }
        }
    }),
    [SAVE_INFO]: (state, action) => ({
        ...state,
        ...state.safe,
        ...action.payload
    }),
}

export default (state = _init, action) => {
    const handler = action?.type && _handler[action?.type]
    return handler ? handler(state, action) : state
}
