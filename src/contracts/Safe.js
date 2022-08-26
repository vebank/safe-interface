import {SafeABI} from "./abis";
import Token from "./Token";
import {updateTx} from "../redux/actions/safe";
import {toWei} from "../utils/web3.uitils";

let AddressZero = "0x0000000000000000000000000000000000000000";

class Safe {
    constructor(address, web3) {
        this.web3 = web3
        this.contract = new web3.eth.Contract(SafeABI, address)
        this.tokens = {}
        this.assets = []
        this.address = address
        this.nonce = 0
    }

    onEvent() {
        return async (dispatch, state) => {
            this.contract.events.ExecutionSuccess?.().removeAllListeners?.();
            this.contract.events
                .ExecutionSuccess?.()
                .on("data", async (data) => {
                    console.log("🐶🐶  ~ contractVB.events.ExecutionSuccess ~ data", data);
                    let {txHash} = data.returnValues
                    dispatch(updateTx(txHash, {
                        status: 'ExecutionSuccess',
                        loading: false
                    }))
                    await that._getNonce()
                })
                .on("error", async (err) => {
                    console.log("🐶🐶  ~ contractVB.events.ExecutionSuccess ~ err", err);
                });
            this.contract.events.ExecutionFailure?.().removeAllListeners?.();
            this.contract.events
                .ExecutionFailure?.()
                .on("data", async (data) => {
                    console.log("🐶🐶  ~ contractVB.events.ExecutionFailure ~ data", data);
                    let {txHash} = data.returnValues
                    dispatch(updateTx(txHash, {
                        status: 'ExecutionFailure',
                        loading: false
                    }))
                    await that._getNonce()
                })
                .on("error", async (err) => {
                    console.log("🐶🐶  ~ contractVB.events.ExecutionFailure ~ err", err);
                });
            this.contract.events.ApproveHash?.().removeAllListeners?.();
            const that = this;
            this.contract.events
                .ApproveHash?.()
                .on("data", async (data) => {
                    console.log("🐶🐶  ~ contractVB.events.ApproveHash ~ data", data);
                    let {approvedHash} = data.returnValues
                    let _approved = await that.getApproved(approvedHash)
                    _approved = _approved.filter(v => v !== '0x0000000000000000000000000000000000000000')
                    dispatch(updateTx(
                        approvedHash,
                        {
                            threshold: _approved?.map(v => v.toLowerCase()),
                            status: 'approved',
                            loading: false
                        }
                    ))
                })
                .on("error", async (err) => {
                    console.log("🐶🐶  ~ contractVB.events.ApproveHash ~ err", err);
                });
        }
    }

    async loadInfo() {
        try {
            let _threshold = await this.contract.methods.getThreshold().call()
            if (_threshold) {
                this.threshold = Number(_threshold)
            }
            this.owners = await this.contract.methods.getOwners().call()

            await this._getNonce()

            let _assets = localStorage.getItem("assets_" + this.address)
            if (_assets) {
                this.assets = JSON.parse(_assets)
                for (let asset of this.assets) {
                    this.tokens[asset] = new Token(asset, this.web3)
                }
            }
        } catch (e) {
            console.error(e)
        }
        return {
            threshold: this.threshold,
            owners: this.owners.map(add => add.toLowerCase()),
            assets: this.assets,
            nonce: this.nonce
        }
    }

    getToken(token) {
        return this.tokens[token]
    }

    async _getNonce() {
        this.nonce = await this.contract.methods.nonce().call()
    }

    async getApproved(txHash, token = null) {
        if (token && !this.tokens[token]) {
            this.addToken(token)
        }
        return await this.contract.methods.checkApproved(txHash).call()
    }

    addToken(token) {
        if (this.assets?.indexOf(token) === -1) {
            this.assets.push(token)
            localStorage.setItem("assets_" + this.address, JSON.stringify(this.assets))
        }
        this.tokens[token] = new Token(token, this.web3)
        return this.getToken(token)
    }

    async getNonce() {
        return await this.contract.methods.nonce().call()
    }

    getSigned(owner = '') {
        return "0x000000000000000000000000" + owner.slice(2) + "0000000000000000000000000000000000000000000000000000000000000000" + "01"
    }

    buildSignatureBytes(signatures) {
        signatures.sort((left, right) => left.signer.toLowerCase().localeCompare(right.signer.toLowerCase()))
        let signatureBytes = "0x"
        for (const sig of signatures) {
            signatureBytes += sig.data.slice(2)
        }
        return signatureBytes
    }

    async execTransaction(tx, users, hash, connex) {
        let signatures = users.map(user => ({
            signer: user,
            data: this.getSigned(user)
        }))
        let signatureBytes = this.buildSignatureBytes(signatures)
        const txABI = SafeABI.find(
            ({name, type}) => name === "execTransaction" && type === "function"
        );
        const approveMethod = connex.thor
            .account(this.address)
            .method(txABI);

        const result = await approveMethod
            .transact(tx.to, tx.value, tx.data, tx.operation, tx.safeTxGas, tx.baseGas, tx.gasPrice, tx.gasToken, tx.refundReceiver, signatureBytes)
            .comment(
                `execTransaction ${hash}`
            )
            .request();
        console.log(result)
        return result
    }

    async approveHash(hash, from, connex) {
        const approveABI = SafeABI.find(
            ({name, type}) => name === "approveHash" && type === "function"
        );
        const approveMethod = connex.thor
            .account(this.address)
            .method(approveABI);

        const result = await approveMethod
            .transact(hash)
            .comment(
                `Approve ${hash}`
            )
            .request();
        return result

    }

    async makeTx(token, to, value) {
        let _token = this.web3.utils.toChecksumAddress(token)
        let _to = this.web3.utils.toChecksumAddress(to)
        let _value = toWei(value.toString(), this.getToken(token)?.decimals)
        let tx = {
            to: _token,
            nonce: await this.getNonce(),
            value: 0,
            data: await this.getToken(token)?.encodeTransfer(
                _to, _value
            ),
            operation: 0,
            baseGas: 0,
            gasPrice: 0,
            gasToken: AddressZero,
            safeTxGas: 0,
            refundReceiver: AddressZero
        }
        return {
            tx: tx,
            txHash: await this.buildTxHash(tx)
        }
    }

    async buildTxHash(tx) {
        return await this.contract.methods.getTransactionHash(tx.to, tx.value,
            tx.data, tx.operation,
            tx.safeTxGas, tx.baseGas, tx.gasPrice, tx.gasToken, tx.refundReceiver, tx.nonce).call()
    }
}

export default Safe

