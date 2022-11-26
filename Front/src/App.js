import React from 'react'
import {
  Dimmer,
  Loader,
  Grid,
  Message,
  Container
} from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'
import { Link, Route, Routes } from "react-router-dom";

import { SubstrateContextProvider, useSubstrateState } from './substrate-lib'
// import { DeveloperConsole } from './substrate-lib/components'

// import AccountSelector from './AccountSelector'
// import Balances from './Balances'
// import BlockNumber from './BlockNumber'
// import Events from './Events'
// import Interactor from './Interactor'
// import Metadata from './Metadata'
// import NodeInfo from './NodeInfo'
// import RegisterStore from './RegisterStore'
// import StoreAddItem from './StoreAddItem';
import ItemList from './ItemList';
import RegisterStore from './RegisterStore';
import StoreAddItem from './StoreAddItem';

// import TemplateModule from './TemplateModule'
// import Transfer from './Transfer'
// import Upgrade from './Upgrade'

function Main() {
  const { apiState, apiError, keyringState } = useSubstrateState()

  const loader = text => (
    <Dimmer active>
      <Loader size="small">{text}</Loader>
    </Dimmer>
  )

  const message = errObj => (
    <Grid centered columns={2} padded>
      <Grid.Column>
        <Message
          negative
          compact
          floating
          header="Error Connecting to Substrate"
          content={`Connection to websocket '${errObj.target.url}' failed.`}
        />
      </Grid.Column>
    </Grid>
  )

  if (apiState === 'ERROR') return message(apiError)
  else if (apiState !== 'READY') return loader('Connecting to Substrate')

  if (keyringState !== 'READY') {
    return loader(
      "Loading accounts (please review any extension's authorization)"
    )
  }

  // const contextRef = createRef()

  return (
    <div>
    <div>
      <nav>
        <ul>
          <li>
          <Link to="/itemList">About</Link>
          </li>
          <li>
          <Link to="/register-store">RegisterStore</Link>
          </li>
          <li>
          <Link to="/store-add-item">StoreAddItem</Link>
          </li>
      
        </ul>
      </nav>
      <Container>
      <Routes>
        <Route path="/itemList" element={<ItemList />} />
        <Route path="/register-store" element={<RegisterStore />} />
        <Route path="/store-add-item" element={<StoreAddItem />} />
      </Routes>
      </Container>
  
    </div>
  </div>
  )
}

export default function App() {
  return (
    <SubstrateContextProvider>
      <Main />
    </SubstrateContextProvider>
  )
}

