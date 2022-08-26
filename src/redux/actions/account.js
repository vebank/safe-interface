import {SET_ACCOUNT} from "../reducers/account";

export const setAccount = (address) => ({
    type: SET_ACCOUNT,
    payload: {
        address: address
    }
})
