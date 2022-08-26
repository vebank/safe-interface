import Web3 from 'web3'

const web3 = new Web3()
const unit = {
    0: 'wei',
    3: 'kwei',
    6: 'mwei',
    9: 'gwei',
    12: 'szabo',
    15: 'finney',
    18: 'ether'
}

export const toWei = (value, decimals) => {
    return web3.utils.toWei(value, unit[decimals] || 'ether')
}
