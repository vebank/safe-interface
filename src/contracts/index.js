import React, {createContext, useContext, useEffect, useState} from "react";
import {toast} from "react-toastify";
import { useWallet} from "../wallets/sync";
import Safe from "./Safe";
import {useDispatch} from "react-redux";

const contractContext = createContext()


export function ProvideContracts({children}) {
    const contracts = useProvideContracts()
    return <contractContext.Provider value={contracts}>{children}</contractContext.Provider>
}

export const useContract = () => {
    return useContext(contractContext)
}

function useProvideContracts() {
    const {web3} = useWallet()
    const [safe, setSafe] = useState(null)
    const dispatch = useDispatch()
    const initContracts = async () => {
        try {
            setSafe(new Safe(process.env.REACT_APP_SAFE, web3));
        } catch (e) {
            toast.error(e.messages)
        }
    }
    useEffect(() => {
        if (web3) {
            initContracts()
        }
    }, [web3])
    useEffect(() => {
        if (safe) {
            dispatch(safe.onEvent())
        }
    }, [safe])
    return {
        safe
    }
}
