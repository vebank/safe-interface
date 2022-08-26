import React, {useCallback, useEffect, useState} from "react";
import {Button, Card, Form, Input, InputNumber, List, Modal, Select, Tag, Popconfirm, Progress} from "antd";
import {useDispatch, useSelector} from "react-redux";
import {useContract} from "../../contracts";
import {updateTx} from "../../redux/actions/safe";
import {useWallet} from "../../wallets/sync";
import {getTxFromBE, postTxToBE} from "../../api/tx";

const {Option} = Select;
const tags = {
    'approved': <Tag color="processing">Waiting</Tag>,
    'init': <Tag color="warning">Draft</Tag>,
    'ExecutionSuccess': <Tag color="success">Success</Tag>,
    'ExecutionFailure': <Tag color="error">Failure</Tag>
}
export default () => {
    const {safeInfo, account} = useSelector(({safe, account}) => ({safeInfo: safe, account}))
    const {safe} = useContract()
    const [isModalVisible, setIsModalVisible] = useState(false);
    const {connectWallet, connex} = useWallet()
    const dispatch = useDispatch()
    const getTx = async (status) => {
        let txs = await getTxFromBE(status)
        if (txs) {
            txs.data.transactions?.map(async v => {
                let _approved = await safe.getApproved(v.txn_hash, v.raw?.token)
                console.log('_approved', _approved)
                _approved = _approved.filter(v => v !== '0x0000000000000000000000000000000000000000')
                dispatch(updateTx(
                    v.txn_hash,
                    {
                        safeTx: v.tx,
                        txRaw: v.raw,
                        status: v.status,
                        threshold: _approved?.map(v => v.toLowerCase())
                    }
                ))
            })
        }
    }
    const onFinish = async (value) => {
        setIsModalVisible(false)
        let _txDetail = await safe.makeTx(
            value.token,
            value.to,
            value.value
        )
        let result = await postTxToBE({
            txn_hash: _txDetail.txHash,
            raw: {
                token: value.token,
                to: value.to,
                value: value.value
            },
            tx: _txDetail.tx
        })
        dispatch(updateTx(_txDetail.txHash, {
            safeTx: _txDetail.tx,
            txRaw: {
                token: value.token,
                to: value.to,
                value: value.value,
            },
            status: 'init',
            threshold: []
        }))
    };
    const confirmApprove = useCallback(async (txHash) => {
        dispatch(updateTx(txHash, {
            loading: true
        }))
        await safe.approveHash(txHash, account.address, connex)
    }, [account])
    const confirmExecute = useCallback(async (tx, txHash, users) => {
        dispatch(updateTx(txHash, {
            loading: true
        }))
        await safe.execTransaction(tx, users, txHash, connex)
    }, [account])
    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    useEffect(() => {
        if (safe) {
            getTx('init')
            getTx('approved')
            getTx('ExecutionSuccess')
            getTx('ExecutionFailure')
        }
    }, [safe])

    const getData = () => {
        let transactions = Object.values(safeInfo.transactions)
        transactions.sort((a, b) => {
            console.log(a, b)
            if (['ExecutionSuccess', 'ExecutionFailure'].indexOf(b?.status) === -1) {
                if (Number(b.safeTx?.nonce || '0') !== Number(safeInfo?.nonce || '0')) {
                    console.log('ExecutionSuccess', a, b)
                    return -1
                }
            }
            return Number(a?.safeTx?.nonce || '0') < Number(b?.safeTx?.nonce || '0') ? 1 : -1

        })
        console.log(transactions)
        return transactions
    }
    return <div>
        <Card
            style={{marginTop: 16}}
            title="Transactions" extra={account?.address ? safeInfo.owners.indexOf(account.address) !== -1 ? <Button
            onClick={e => {
                setIsModalVisible(true)
            }}
        >Create</Button> : 'Only owner' : <Button onClick={connectWallet}>Connect Sync (Create tx)</Button>}>
            <List
                className="demo-loadmore-list"
                itemLayout="horizontal"
                dataSource={getData()}
                renderItem={({txRaw, status, safeTx, txHash, threshold, loading}) => (
                    <List.Item

                        actions={[tags[status], status === 'ExecutionSuccess' || status === 'ExecutionFailure' ? <div
                            style={{minWidth: 115}}></div> : account?.address ? <>
                            {
                                threshold?.length === safeInfo.threshold ? <>
                                        <Popconfirm

                                            title="Confirm execute this transaction"
                                            onConfirm={_ => confirmExecute(safeTx, txHash, threshold)}
                                        >
                                            <Button loading={loading} type="danger">Execute</Button>
                                        </Popconfirm>

                                    </>
                                    : <>
                                        {
                                            safeInfo.owners.indexOf(account.address) !== -1 ? <>
                                                {
                                                    threshold.indexOf(account.address) !== -1 ?
                                                        <Tag color="#87d068">You have approved</Tag>
                                                        : <Popconfirm
                                                            title="Confirm approve this transaction"
                                                            onConfirm={_ => confirmApprove(txHash)}
                                                        >
                                                            <Button loading={loading} type="primary">Approve</Button>
                                                        </Popconfirm>
                                                }
                                            </> : 'Only owner'
                                        }
                                    </>
                            }
                        </> : ['ExecutionSuccess', 'ExecutionFailure'].indexOf(status) !== -1 ?
                            null : <Button onClick={connectWallet}>Connect Sync</Button>]}
                    >
                        <Progress style={{width: 100}} percent={(threshold?.length / safeInfo.threshold) * 100}
                                  format={percent => `${threshold?.length}/${safeInfo.threshold} approved`}
                                  steps={safeInfo.threshold}/>
                        <div>
                            <p style={{width: 'fit-content', textAlign: 'left'}}>
                                #{safeTx.nonce} Transfer <b>{`${txRaw?.value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} {safe.getToken(txRaw?.token)?.symbol}</b> --
                                to -- <i>{txRaw?.to} </i>
                            </p>
                        </div>
                    </List.Item>
                )}
            />
        </Card>
        <Modal
            footer={null}
            onCancel={_ => setIsModalVisible(false)}
            title="Create transfer token" visible={isModalVisible}>
            <Form
                name="basic"
                labelCol={{span: 8}}
                wrapperCol={{span: 16}}
                initialValues={{remember: true}}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
            >
                <Form.Item
                    label="Token"
                    name="token"
                    rules={[{required: true}]}
                >
                    <Select
                        placeholder="Select a token"
                        allowClear
                    >
                        {
                            Object.values(safeInfo.tokens)?.map(token => (<Option key={token.address}
                                                                                  value={token.address}>{token.name} - {token.balance}</Option>))
                        }

                    </Select>
                </Form.Item>
                <Form.Item
                    label="To address"
                    name="to"
                    rules={[{required: true}]}
                >
                    <Input placeholder="Address"/>
                </Form.Item>
                <Form.Item
                    label="Value"
                    name="value"
                    rules={[{required: true}]}
                >
                    <InputNumber
                        style={{
                            width: '100%'
                        }}
                        min={0}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value?.replace(/\$\s?|(,*)/g, '')}
                    />
                </Form.Item>
                <Form.Item wrapperCol={{offset: 8, span: 16}}>
                    <Button type="primary" htmlType="submit">
                        Create hash
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    </div>
}
