import React, { useState } from "react";
import utils from './substrate-lib/utils';
import { useSubstrateState } from './substrate-lib/SubstrateContext';
import { web3FromSource } from '@polkadot/extension-dapp';
import { Form } from 'semantic-ui-react'
  import { toast, ToastContainer } from 'react-toastify';
  import "react-toastify/dist/ReactToastify.css";

export default function RegisterStore() {

    const [state, setState] = useState({
        name: "",
        logo: "",
        description: "", 
        isLoading: false
    });

    const { api, currentAccount } = useSubstrateState()

    const txResHandler = ({ status }) =>{
        if(status.isFinalized){
            console.log(`😉 Finalized. Block hash: ${status.asFinalized.toString()}`);
        }else{
            console.log(`Current transaction status: ${status.type}`)
        }
        if(status.type=='InBlock'){
            setState((prevProps) => ({
                ...prevProps,
                isLoading: false
            }));
            toast.success("Store registered successfully.", {
                position: toast.POSITION.TOP_RIGHT
              });
        }
        }



    const txErrHandler = err =>
        console.log(`😞 Transaction Failed: ${err.toString()}`)

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
        let paramFields = ['name', 'pass', 'desceiption'];
        let inputParams = [{type: "Bytes", value: state.name}, {type: "Bytes", value: state.pass}, {type: "Bytes", value: state.description}];
          

        const fromAcct = await getFromAcct()
        const transformed = transformParams(paramFields, inputParams)
        // // transformed can be empty parameters

        const txExecute = transformed
            ? api.tx["bussines"]["registerStore"](...transformed)
            : api.tx["bussines"]["registerStore"]()

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
            <Form onSubmit={handleSubmit}>
                <div className="form-control">
                    <Form.Input
                        type="text"
                        name="name"
                        value={state.name}
                        onChange={handleInputChange}
                        fluid icon='user' iconPosition='left' placeholder='Store Name' />

                    <Form.Input
                        type="text"
                        name="description"
                        value={state.description}
                        onChange={handleInputChange}
                        fluid icon='file alternate' iconPosition='left' placeholder='Description' />

                    <Form.Input
                        type="text"
                        name="logo"
                        value={state.logo}
                        onChange={handleInputChange}
                        fluid icon='key' iconPosition='left' placeholder='Password' />


                    <Form.Button color="blue" type="submit" loading={state.isLoading}>Register</Form.Button>
                </div>
            </Form>
            <ToastContainer />
        </div>
        
    );



}