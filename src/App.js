import React from 'react';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {ProvideWallet} from "./wallets/sync";
import 'antd/dist/antd.css';
import {ProvideContracts} from "./contracts";
import Layout from './shell/layout'
import {Provider} from 'react-redux'
import store from './redux'
import {ViewTxs} from "./components/transaction";

function App() {
    return (
        <div className="App">
            <Provider store={store}>
                <ProvideWallet>
                    <ProvideContracts>
                        <Layout>
                            <ViewTxs/>
                        </Layout>
                    </ProvideContracts>
                </ProvideWallet>
                <ToastContainer/>
            </Provider>
        </div>
    );
}

export default App;
