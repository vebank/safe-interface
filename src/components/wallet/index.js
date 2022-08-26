import React from "react";
import {useWallet} from "../../wallets/sync";

export default () => {
    const {wallet, connectWallet} = useWallet()
    return <div>
        {
            wallet ? wallet : <button color={'red'} onClick={_ => connectWallet()}>Connect wallet</button>
        }

    </div>
}
