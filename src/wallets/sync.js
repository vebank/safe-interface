import React, {useState, useEffect, useContext, createContext} from 'react'
import {useDispatch} from 'react-redux'

import {thorify} from "thorify";
import Web3 from 'web3';
import Connex from "@vechain/connex";
import {toast} from "react-toastify";
import {setAccount} from "../redux/actions/account";

export const getWeb3 = async () => {
    let web3 = thorify(new Web3(), process.env.REACT_APP_CHAIN_NETWORK);
    return web3;
};


const walletContext = createContext()


export function ProvideWallet({children}) {
    const wallet = useProvideWallet()
    return <walletContext.Provider value={wallet}>{children}</walletContext.Provider>
}

export const useWallet = () => {
    return useContext(walletContext)
}

function useProvideWallet() {
    const [web3, setWeb3] = useState(null)
    const dispatch = useDispatch()
    const [connex, setConnex] = useState()
    const connectWeb3 = async () => {
        try {
            setWeb3(await getWeb3())
            setConnex(new Connex({
                node: process.env.REACT_APP_CHAIN_NETWORK,
                network: process.env.REACT_APP_NAME_NETWORK,
            }))
        } catch (e) {
            toast.error(e.messages)
        }
    }
    const getAccount = async () => {
        let _address = null//localStorage.getItem("address");
        let _signed = localStorage.getItem("signed");
        if (_address && _signed) {
            return _address
        }
        let loadingId = null

        await connex.vendor
            .sign("cert", {
                purpose: "identification",
                payload: {
                    type: "text",
                    content: "Please sign the certificate to continue purchase",
                },
            })
            .accepted(() => {
                loadingId = toast.loading('Connecting')
                return _address;
            })
            .request()
            .then((signer) => {
                _address = signer.annex.signer;
                _signed = JSON.stringify(signer);

                localStorage.setItem("address", _address);
                localStorage.setItem("signed", _signed);

                toast.update(loadingId, {
                    render: `Connected: ${_address} #${process.env.REACT_APP_CHAIN_NETWORK}`,
                    type: "success", isLoading: false, autoClose: true
                })
                console.log(setAccount(_address))
                dispatch(setAccount(_address))
            })
            .catch((e) => {
                console.error(e)
                toast.warning(e.messages)
            });
    }
    const connectWallet = async () => {
        try {
            await getAccount()
        } catch (e) {
            toast.error(e.messages)
        }
    }
    useEffect(() => {
        connectWeb3()
    }, [])
    return {
        web3,
        connectWallet,
        connex
    }
}
