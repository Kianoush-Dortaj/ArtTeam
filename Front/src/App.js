import React from 'react'
import { Menu } from 'semantic-ui-react'
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
import ItemList from './ItemList';
import RegisterStore from './RegisterStore';
import StoreAddItem from './StoreAddItem';

import Home from './Home'

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
    <Menu>
    <Menu.Item>
     <Link to="/home">Home</Link>
    </Menu.Item>
    <Menu.Item>
     <Link to="/itemList">Product list</Link>
    </Menu.Item>

    <Menu.Item>
       <Link to="/register-store">RegisterStore</Link>
    </Menu.Item>

    <Menu.Item>
    <Link to="/store-add-item">Add Product</Link>
    </Menu.Item>

   
  </Menu>
      <Container>
      <Routes>
      <Route path='/' element={<Home /> }/>
        <Route path="/home" element={<Home />} />
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

