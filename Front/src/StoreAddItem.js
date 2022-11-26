import React from "react";
import utils from './substrate-lib/utils';
import { useSubstrateState } from './substrate-lib/SubstrateContext';
import { web3FromSource } from '@polkadot/extension-dapp';

export default function StoreAddItem() {
    
    var start = window.performance.now();
    let infoList = [];
    // let [timer, timingMonitor] = [0, () => timer = !timer ? Date.now() : `${Date.now() - timer}ms`]

    const { api, currentAccount } = useSubstrateState()

    const txResHandler = ({ status }) =>
        status.isFinalized
            ? calcTime(status.asFinalized.toString(),true)
            : calcTime(status.type,false)

    const calcTime = (hash,doagain) => {
        var ms = window.performance.now() - start;
        var d = new Date(1000 * Math.round(ms / 1000)); // round to nearest second
        function pad(i) {
            return ('0' + i).slice(-2);
        }
        var str = d.getUTCHours() + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds());
        // infoList.push({
        //     time:str,
        //     status:hash
        // })
        // setState(infoList)
            console.log(`Time : ${str} - Status : ${hash}`)
        if(doagain){

            handleSubmit();
        }
    }

    // Console output: "102ms", for example 


    const txErrHandler = err =>
        console.log(`😞 Transaction Failed: ${err.toString()}`)

    // const handleInputChange = (event) => {
    //     const { name, value } = event.target;
    //     setState((prevProps) => ({
    //         ...prevProps,
    //         [name]: value
    //     }));
    // };

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
        // Create one-liner timer function

        // Start timer


        if (event) {
            event.preventDefault();

        }


        let paramFields = [];
        let inputParams = [];
        paramFields.push({
            name: 'addressTo',
            optional: false,
            type: "Bytes"
        })
        paramFields.push({
            name: 'amount',
            optional: false,
            type: "u32"
        })

        inputParams.push({
            type: "Bytes",
            value: "5DhMq8PYcLaGEgW3urdbqSZpqoYH2vajpmL9wdSRmu35M4rf"
        })
        inputParams.push({
            type: "u32",
            value: "1000000"
        })

        const fromAcct = await getFromAcct()
        const transformed = transformParams(paramFields, inputParams)
        // // transformed can be empty parameters

        const txExecute = transformed
            ? api.tx["balances"]["transfer"](...transformed)
            : api.tx["balances"]["transfer"]()

        start = window.performance.now();

        const unsub = await txExecute
            .signAndSend(...fromAcct, txResHandler)
            .catch(txErrHandler)
        console.log('dfdfd', unsub)
            // Your code here

            // End timer 
            ;

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
            <form onSubmit={handleSubmit}>
                <div className="form-control">
                    <label></label>
                    <button type="submit">Start Test</button>
                </div>
            {
                infoList.map((time,status,index) =>
                <li key={index}>
                  <span>Time : {time}</span><span>Status : {status}</span>
                </li>
              )
            }
            </form>
            {/* <div style={{ overflowWrap: 'break-word' }}>{status}</div> */}
        </div>
    );



}