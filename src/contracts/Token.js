import {ERC20ABI} from "./abis";
import {utils} from "web3";

class Token {
    constructor(address, web3) {
        this.contract = new web3.eth.Contract(ERC20ABI, address)
        this.web3 = web3
        this.decimals = 1;
        this.name = null
        this.symbol = null
        this.address = address
        this.getInfo()
    }

    async getInfo() {
        try {
            await this.getDecimals()
            await this.getName()
            await this.getSymbol()
        } catch (e) {
            console.error(e)
        }
        return {
            name: this.name,
            decimals: this.decimals,
            symbol: this.symbol
        }
    }

    async getDecimals() {
        if (this.decimals === 1) {
            this.decimals = await this.contract.methods.decimals().call()
        }
        return this.decimals
    }
    async getSymbol() {
        if (!this.symbol) {
            this.symbol = await this.contract.methods.symbol().call()
        }
        return this.symbol
    }
    async getName() {
        if (!this.name) {
            this.name = await this.contract.methods.name().call()
        }
        return this.name
    }

    async balanceOf(address) {
        let _dataOnChain = await this.contract.methods.balanceOf(address).call()
        await this.getDecimals()
        return Number(_dataOnChain) / (10 ** this.decimals)
    }

    encodeTransfer(to, value) {
        return this.contract.methods.transfer(to, value).encodeABI()
    }
}

export default Token
