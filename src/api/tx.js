import {makeFetch} from "./rq";

export const getTxFromBE = async (status) => {
    return await makeFetch(`/v1/transaction/approve_hash?status=${status}`, 'GET')
}
export const postTxToBE = async (body) => {
    return await makeFetch(`/v1/transaction/approve_hash`, 'POST', {
        body: JSON.stringify(body)
    })
}
