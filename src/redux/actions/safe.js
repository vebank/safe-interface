import {SAVE_INFO, UPDATE_TOKEN, UPDATE_TRANSACTION} from "../reducers/safe";
import {ADD_TOKEN} from "../reducers/safe";
export const updateTx = (txHash, tx = {}) => ({
    type: UPDATE_TRANSACTION,
    payload: {
        txHash: txHash,
        tx: tx
    }
})
export const addToken = (address, info = {}) => ({
    type: ADD_TOKEN,
    payload: {
        address: address,
        info: info
    }
})
export const updateToken = (address, info) => ({
    type: UPDATE_TOKEN,
    payload: {
        address: address,
        update: info
    }
})

export const saveSafe = (info) => ({
    type: SAVE_INFO,
    payload: info
})
