import {Tag, Button, Layout, Menu} from 'antd';
import React, {useEffect, useState} from 'react';
import {useWallet} from "../../wallets/sync";
import {useSelector} from "react-redux";
import {ViewSafe} from "../../components/safe";

const {Header, Sider} = Layout;

export default ({children}) => {
    const {account} = useSelector(({account}) => ({account}))
    const {connectWallet} = useWallet()
    const [ready, setReady] = useState(false)
    useEffect(() => {
        setTimeout(() => {
            setReady(true)
            setTimeout(() => {
                document.getElementById('splash_screen')?.remove()
            }, 400)
        }, 2000)
    }, [])
    return <div>
        <div id={"splash_screen"}
             style={{
                 position: 'fixed'
             }}
             className={ready ? 'splash_screen_remove' : ''}>
            <div style={{
                width: "100vw",
                justifyContent: "center",
                alignItems: 'center',
                alignContent: "center",
                height: '100vh',
                display: 'flex',
                background: "#98bec8",
                fontFamily: 'Inter, "Source Sans Pro", "Helvetica Neue", Arial, sans-serif'
            }}>
                <h1 style={{
                    fontSize: 60,
                    fontWeight: 600,
                    fontStyle: "italic"
                }}>Ve Safe</h1>

            </div>
        </div>
        <Layout
            style={{
                height: '100vh',
                display: ready ? 'block' : 'none'
            }}>
            <Header className="header">
                <div className="logo"/>
                <div style={{
                    float: 'right',
                    width: "fit-content",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: 'center',
                    alignContent: "center",
                    height: '100%'
                }}>
                    {
                        account.address ? <h3 style={{color: 'white'}}>{account.address}</h3>
                            : <Button type={"primary"} onClick={_ => connectWallet()}>
                                Connect Sync
                            </Button>
                    }
                    <Tag style={{height: 25}}
                         color={process.env.REACT_APP_NAME_NETWORK === 'test' ? '#f50' : '#87d068'}>{process.env.REACT_APP_NAME_NETWORK}</Tag>
                </div>
            </Header>

            <Layout>
                <Sider theme={"light"} width={300} className="site-layout-background">
                    <div>
                        <ViewSafe/>
                    </div>
                </Sider>
                <Layout
                    style={{
                        padding: '0 24px 24px',
                    }}
                >
                    {children}
                </Layout>
            </Layout>
        </Layout>
    </div>
}
