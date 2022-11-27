import React, { useState } from "react";
import utils from './substrate-lib/utils';
import { useSubstrateState } from './substrate-lib/SubstrateContext';
import { web3FromSource } from '@polkadot/extension-dapp';
import { Form } from 'semantic-ui-react'
import { toast, ToastContainer } from 'react-toastify';

export default function StoreAddItem() {
    const [state, setState] = useState({
        media: "",
        description: "",
        title: "",
        price: 0,
        count: 0,
        isLoading: false
    });

    const { api, currentAccount } = useSubstrateState()

    const txResHandler = ({ status }) => {
        status.isFinalized
            ? console.log(`😉 Finalized. Block hash: ${status.asFinalized.toString()}`)
            : console.log(`Current transaction status: ${status.type}`)
        if (status.type == 'InBlock') {
            toast.success("Item added successfully.", {
                position: toast.POSITION.TOP_RIGHT
            });
            setState((prevProps) => ({
                ...prevProps,
                media: "",
                description: "",
                title: "",
                price: 0,
                count: 0,
                isLoading: false
            }));
            document.getElementById("addForm").reset();
        }

    }




    const txErrHandler = err => {
        console.log(`😞 Transaction Failed: ${err.toString()}`)
        toast.success("Error: Transaction Failed..", {
            position: toast.POSITION.TOP_RIGHT
        });
    }
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setState((prevProps) => ({
            ...prevProps,
            [name]: value
        }));
    };

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
    const handleSubmit = async (event) => {
        setState((prevProps) => ({
            ...prevProps,
            isLoading: true
        }));
        event.preventDefault();

        let paramFields = ["media", "description", "title", "price", "count"];
        let inputParams = [{ type: "Bytes", value: state.media }, { type: "Bytes", value: state.description }, { type: "Bytes", value: state.title }, { type: "u32", value: state.price }, { type: "u32", value: state.count }];

        const fromAcct = await getFromAcct()
        const transformed = transformParams(paramFields, inputParams)
        // // transformed can be empty parameters

        const txExecute = transformed
            ? api.tx["bussines"]["addItem"](...transformed)
            : api.tx["bussines"]["addItem"]()


        const unsub = await txExecute
            .signAndSend(...fromAcct, txResHandler)
            .catch(txErrHandler)
        console.log(unsub)
        // setUnsub(() => unsub)

    };
    const isNumType = type =>
        utils.paramConversion.num.some(el => type.indexOf(el) >= 0);

    const transformParams = (
        paramFields,
        inputParams,
        opts = { emptyAsNull: true }
    ) => {
        // if `opts.emptyAsNull` is true, empty param value will be added to res as `null`.
        //   Otherwise, it will not be added
        const paramVal = inputParams.map(inputParam => {
            // To cater the js quirk that `null` is a type of `object`.
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

            // Deal with a vector
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

            // Deal with a single value
            if (isNumType(type)) {
                converted =
                    converted.indexOf('.') >= 0
                        ? Number.parseFloat(converted)
                        : Number.parseInt(converted)
            }
            return [...memo, converted]
        }, [])
    }

    return (
        <div className="App">
            <Form onSubmit={handleSubmit} id="addForm">
                <Form.Field>
                    <label>Media</label>
                    <input type="text"
                        name="media"
                        value={state.media}
                        onChange={handleInputChange} />
                </Form.Field>


                <Form.Field>
                    <label>Title</label>
                    <input type="text"
                        name="title"
                        value={state.title}
                        onChange={handleInputChange} />
                </Form.Field>

                <Form.Field>
                    <label>Description</label>
                    <input type="text"
                        name="description"
                        value={state.description}
                        onChange={handleInputChange} />
                </Form.Field>

                <Form.Field>
                    <label>Price</label>
                    <input type="text"
                        name="price"
                        value={state.price}
                        onChange={handleInputChange} />
                </Form.Field>

                <Form.Field>
                    <label>Count</label>
                    <input type="text"
                        name="count"
                        value={state.count}
                        onChange={handleInputChange} />
                </Form.Field>
                <Form.Button color="blue" type="submit" loading={state.isLoading}>Add Item</Form.Button>

            </Form>
            <ToastContainer />
        </div>
    );



}