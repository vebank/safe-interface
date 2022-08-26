const _init = {
    address: null
}
export const SET_ACCOUNT = 'SET_ACCOUNT';

const _handler = {
    [SET_ACCOUNT]: (state, {payload}) => ({
        ...state,
        address: payload.address
    })
}

export default (state = _init, action) => {
    const handler = action?.type && _handler[action?.type]
    return handler ? handler(state, action) : state
}
