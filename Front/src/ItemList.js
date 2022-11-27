import React, { useState, useEffect } from "react";
import utils from './substrate-lib/utils';
import { useSubstrateState } from './substrate-lib/SubstrateContext';
import { web3FromSource } from '@polkadot/extension-dapp';
import { Header, Container, Segment, Form, Icon } from 'semantic-ui-react'
import QRCode from "react-qr-code";

export default function ItemList() {

    const [items, setItems] = useState(null);

    const [state, setState] = useState({
        itemId: '',
        countItem: 1,
    });

    const { api, currentAccount } = useSubstrateState();
    // setState((prevProps) => ({
    //     ...prevProps,
    //     "0": ""
    // }));
    const txResHandler = ({ status }) =>
        status.isFinalized
            ? console.log(`😉 Finalized. Block hash: ${status.asFinalized.toString()}`)
            : console.log(`Current transaction status: ${status.type}`)


    const txErrHandler = err =>
        console.log(`😞 Transaction Failed: ${err.toString()}`)

    const getFromAcct = async () => {
        const {
            address,
            meta: { source, isInjected },
        } = currentAccount

        if (!isInjected) {
            return [currentAccount]
        }

        // currentAccount is injected from polkadot-JS extension, need to return the addr and signer object.
        // ref: https://polkadot.js.org/docs/extension/cookbook#sign-and-send-a-transaction
        const injector = await web3FromSource(source)
        return [address, { signer: injector.signer }]
    }


    const queryResHandler = result =>
        result.isNone ? console.log('None') : setItems(result.toHuman());


    const handleSubmit = async (event) => {


        let item = {
            "0": currentAccount.address
        }

        let paramFields = [];
        let inputParams = [];
        Object.getOwnPropertyNames(item).forEach(data => {
            paramFields.push({
                name: data,
                optional: false,
                type: "0"
            })
        });

        Object.values(item).forEach(data => {
            inputParams.push({
                type: "0",
                value: data
            })
        })

        const transformed = transformParams(paramFields, inputParams)
        // // transformed can be empty parameters

        const unsub = await api.query["bussines"]["items"](
            ...transformed,
            queryResHandler
        )

        console.log(unsub)
        // setUnsub(() => unsub)


        // setUnsub(() => unsub)


    };


    const isNumType = type =>
        utils.paramConversion.num.some(el => type.indexOf(el) >= 0);

    const transformParams = (
        paramFields,
        inputParams,
        opts = { emptyAsNull: true }
    ) => {

        const paramVal = inputParams.map(inputParam => {

            if (
                typeof inputParam === 'object' &&
                inputParam !== null &&
                typeof inputParam.value === 'string'
            ) {
                return inputParam.value.trim()
            } else if (typeof inputParam === 'string') {
                return inputParam.trim()
            }
            return inputParam
        })
        const params = paramFields.map((field, ind) => ({
            ...field,
            value: paramVal[ind] || null,
        }))

        return params.reduce((memo, { type = 'string', value }) => {
            if (value == null || value === '')
                return opts.emptyAsNull ? [...memo, null] : memo

            let converted = value

            if (type.indexOf('Vec<') >= 0) {
                converted = converted.split(',').map(e => e.trim())
                converted = converted.map(single =>
                    isNumType(type)
                        ? single.indexOf('.') >= 0
                            ? Number.parseFloat(single)
                            : Number.parseInt(single)
                        : single
                )
                return [...memo, converted]
            }

            if (isNumType(type)) {
                converted =
                    converted.indexOf('.') >= 0
                        ? Number.parseFloat(converted)
                        : Number.parseInt(converted)
            }
            return [...memo, converted]
        }, [])
    }


    const addItemToBasket = async (event) => {
        event.preventDefault()
        setState((prevProps) => ({
            ...prevProps,
            itemId: '0xb9a4126fd469b8bd465db97efe35b57e944b3e4a628e3779601d38c773358f62'
        }));

        let paramFields = [];
        let inputParams = [];

        Object.getOwnPropertyNames(state).forEach(data => {
            paramFields.push({
                name: data,
                optional: false,
                type: data == "itemId" ? "H256" : "u32"
            })
        });

        Object.values(state).forEach(data => {
            console.log(data)
            inputParams.push({
                type: "H256",
                value: data
            })
        })
        const fromAcct = await getFromAcct()
        console.log(paramFields, inputParams)
        const transformed = transformParams(paramFields, inputParams)
        // // transformed can be empty parameters

        const txExecute = transformed
            ? api.tx["bussines"]["addStoreOwnerToBasket"](...transformed)
            : api.tx["bussines"]["addStoreOwnerToBasket"]()


        const unsub = await txExecute
            .signAndSend(...fromAcct, txResHandler)
            .catch(txErrHandler)
        console.log(unsub)
        // setUnsub(() => unsub)
    }

    useEffect(() => {
        handleSubmit();
    }, [])

    return (
        <div className="App">

            <div>
                {items !== null && items.map(function (item) {
                    return <div key={item.itemId}>

                        <Container style={{ paddingTop: '2em' }} text dividing>

                            <Header as='h1' attached='top' block>
                                {item.title}
                            </Header>
                            <Segment attached>  <h5>{item.description}</h5>

                                <p>
                                    <Form.Button color="green" ><Icon color='white' name='dollar sign' size='large' />{item.price}</Form.Button>
                                    <Form.Button style={{ marginTop: '1em' }} color="blue" onClick={addItemToBasket} content='Labeled' icon='add' labelPosition='left'><Icon color='white' name='add' size='large' />Add to basket</Form.Button>
                                    <QRCode value="aerogjerasi;ughaero;iuhga;iuerghae;ruighaeriuh" style={{ marginTop: '1em' }} />
                                </p></Segment>
                        </Container>


                    </div>;
                })}
            </div>

        </div>
    );
}