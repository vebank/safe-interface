import React, {useEffect, useState} from "react";
import {Avatar, Card, Divider, List, Skeleton, Typography, Tag, Tooltip, Modal, Input} from "antd";
import {EditOutlined, EllipsisOutlined, PlusCircleOutlined, CheckCircleOutlined} from '@ant-design/icons';
import {useContract} from "../../contracts";
import {useDispatch, useSelector} from "react-redux";
import {addToken, saveSafe, updateToken} from "../../redux/actions/safe";
import {toast} from "react-toastify";

const {Paragraph} = Typography;

const {Meta} = Card;

export default () => {
    const {safe} = useContract()
    const {safeInfo} = useSelector(({safe}) => ({safeInfo: safe}))

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [_addTokenAddress, setAddToken] = useState('')
    const dispatch = useDispatch()
    const _addToken = async () => {
        setIsModalVisible(false);
        try {
            let token = await safe.addToken(_addTokenAddress)
            let balance = await token.balanceOf(safe.address)
            let info = await token.getInfo() || {}
            dispatch(addToken(_addTokenAddress, {
                balance: balance,
                ...info
            }))
        } catch (e) {
            toast.error(e.messages)
        }
        setAddToken('')
    }

    const handleCancel = () => {
        setIsModalVisible(false);

    }
    const _loadInfo = async () => {
        let _info = await safe.loadInfo()
        if (_info) {
            dispatch(saveSafe({
                threshold: _info.threshold,
                owners: _info.owners,
                assets: _info.assets,
                nonce: _info.nonce
            }))
        }
        _loadTokenInfo()
    }
    const _loadTokenInfo = async () => {
        if (safeInfo.assets) {
            for (let asset of safeInfo?.assets) {
                let balance = await safe.getToken(asset)?.balanceOf(safe.address) || 0
                let info = await safe.getToken(asset)?.getInfo() || {}
                dispatch(addToken(asset, {
                    balance: balance,
                    ...info
                }))
            }
        }
    }
    useEffect(() => {
        if (safeInfo.assets) {
            _loadTokenInfo()
        }
    }, [safeInfo.assets])
    useEffect(() => {
        if (safe) {
            _loadInfo()
        }
    }, [safe])
    return <div><Card
        style={{width: 'fit-content', marginTop: 16}}
        actions={[
            <Tooltip title={"Add token"}>
                <PlusCircleOutlined onClick={_ => setIsModalVisible(true)} key="setting"/>
            </Tooltip>
        ]}
    >
        <Skeleton loading={!safe} avatar active>
            <Meta
                avatar={<Avatar src="https://joeschmoe.io/api/v1/random"/>}
                title={<Paragraph
                    copyable={{
                        text: safe?.address
                    }}
                >{'...' + safe?.address?.slice(safe?.address.length - 18, safe?.address.length)}</Paragraph>}
                description={safeInfo.threshold ?
                    <Tag icon={<CheckCircleOutlined/>} color="success">
                        {safeInfo.threshold + '/' + safeInfo.owners?.length}
                    </Tag>
                    : 'NA'}
            />
        </Skeleton>
        <div style={{marginTop: 10}}>
            <Divider orientation="left">Owners</Divider>
            <List
                bordered
                dataSource={safeInfo?.owners || []}
                renderItem={item => (
                    <List.Item>
                        ...{item.slice(item.length - 18, item.length)}
                    </List.Item>
                )}
            />
        </div>
        <div style={{marginTop: 10}}>
            <Divider orientation="left">Assets</Divider>
            <List
                bordered
                dataSource={Object.values(safeInfo?.tokens) || []}
                renderItem={token => (
                    <List.Item>
                        {token?.name}: {token.balance}
                    </List.Item>
                )}
            />
        </div>
    </Card>
        <Modal title="Add token" visible={isModalVisible} onOk={_addToken} onCancel={handleCancel}>
            <Input placeholder="Address" onChange={e => {
                setAddToken(e.target.value)
            }}/>
        </Modal>
    </div>
}
