import React, { useState } from "react";
import utils from './substrate-lib/utils';
import { useSubstrateState } from './substrate-lib/SubstrateContext';
import { web3FromSource } from '@polkadot/extension-dapp';

export default function ItemList() {

    const [setUnsub] = useState(null)
    const [items, setItems] = useState(null);

    const [state, setState] = useState({
        itemId: '',
        countItem: 0,
    });

    const { api, currentAccount } = useSubstrateState()
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
        result.isNone ? console.log('None') : setItems(JSON.parse(result.toString()));



    const handleSubmit = async (event) => {

        event.preventDefault();

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


        setUnsub(() => unsub)


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

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setState((prevProps) => ({
            ...prevProps,
            [name]: value
        }));
    };

    const addItemToBasket = async ( event) => {
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

    return (
        <div className="App">

            <button onClick={handleSubmit}>Get Items</button>

            <ul>
                {items !== null && items.map(function (item) {
                    return <li key={item.itemId}>Id : {item.itemId} - Title : {item.title} - Logo : {item.media}
                        <form  >
                            < button onClick={addItemToBasket} type="submit"> Add To Basket</button><input value={state.countItem}
                                onChange={handleInputChange} name="countItem" placeholder="countItem"></input>
                        </form>
                    </li>;
                })}
            </ul>

        </div>
    );
}