import React, { useEffect, useState } from 'react'
import Amplify, { API, graphqlOperation, Storage, Auth } from 'aws-amplify'
import { withAuthenticator } from 'aws-amplify-react'
import * as d3 from 'd3'
import moment from 'moment'

import awsconfig from './aws-exports'
import * as queries from './graphql/queries'
import * as subscriptions from './graphql/subscriptions'
import codes from './country-codes'
import { drawChart } from './hexabin-helper'

import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Spinner from 'react-bootstrap/Spinner'

import './App.css'

Amplify.configure(awsconfig)

const App = () => {
  const [isSending, setIsSending] = useState(false)
  const [user, setUser] = useState(null)
  const [countryCode, setCountryCode] = useState('')
  const [currentQuery, setCurrentQuery] = useState(null)
  const [pastQueries, setpastQueries] = useState({ items: [] })

  // get current user
  useEffect(() => {
    if (user) return
    const getUser = async () => {
      const _user = await Auth.currentAuthenticatedUser()
      setUser(_user)
      console.log(JSON.stringify(_user.attributes, null, 2))
    }
    getUser()
  }, [user])

  // subscribe to athena operation
  useEffect(() => {
    if (!currentQuery || !user) return

    console.log(`Starting subscription. Current query id: ${currentQuery.id}`)
    const subscription = API.graphql(
      graphqlOperation(subscriptions.onUpdateAthenaOperation, {
        owner: user.attributes.sub
      })
    ).subscribe({
      next: result => {
        console.log('subscription:', result)
        const data = result.value.data.onUpdateAthenaOperation
        setpastQueries(pq => ({ items: [data, ...pq.items].slice(0, 10) }))
        setCurrentQuery(q => ({ ...q, ...data }))
        console.log('subscription data:', data)
      }
    })

    return () => {
      console.log(`Unsubscribe. Current query id: ${currentQuery.id}`)
      console.log(subscription)
      subscription.unsubscribe()
    }
  }, [currentQuery, user])

  // fetch user's previous queries
  useEffect(() => {
    if (!user) return
    console.log('Fetch user queries')

    const go = async () => {
      const result = await API.graphql(
        graphqlOperation(queries.queryByOwner, {
          owner: user.attributes.sub,
          sortDirection: 'DESC',
          limit: 10
        })
      )
      setpastQueries(result.data.queryByOwner)
    }
    go()
  }, [user])

  // start a query
  const startQuery = async () => {
    if (isSending || !countryCode) return
    setIsSending(true)
    setCurrentQuery(null)
    try {
      const result = await API.graphql(
        graphqlOperation(queries.startQuery, {
          countryCode
        })
      )
      console.log(`Setting sub ID: ${result.data.startQuery.id}`)
      setIsSending(false)
      setCurrentQuery(result.data.startQuery)
    } catch (error) {
      setIsSending(false)
      console.log('querry failed ->', error)
    }
  }

  const showPastQuery = (e, q) => {
    e.preventDefault()
    setCountryCode('')
    setCurrentQuery(q)
  }

  const signOut = () => {
    Auth.signOut()
      .then(data => console.log(data))
      .catch(err => console.log(err))
  }

  return (
    <>
      <Navbar
        as="header"
        expand="lg"
        bg="dark"
        variant="dark"
        className="flex-column flex-md-row"
      >
        <Navbar.Brand href="#home">
          Bins of population density across longitudes
        </Navbar.Brand>
      </Navbar>
      <Container fluid>
        <Row className="flex-xl-nowrap bg-light">
          <Col xl={2} md={3}>
            <Navbar
              collapseOnSelect
              className="bg-light justify-content-between"
              expand={false}
            >
              <section className="d-flex flex-grow-1 flex-no-wrap">
                <Form className="flex-grow-1">
                  <Row>
                    <Col className="d-flex">
                      <Form.Control
                        as="select"
                        className="custom-select mr-2"
                        value={countryCode}
                        onChange={e => setCountryCode(e.target.value)}
                      >
                        <option>Select Code</option>
                        {codes.map(([code, name]) => (
                          <option
                            key={code}
                            value={code}
                          >{`${code} - ${name}`}</option>
                        ))}
                      </Form.Control>
                      <Button
                        type="submit"
                        disabled={isSending || !countryCode}
                        onClick={startQuery}
                      >
                        Query
                      </Button>
                    </Col>
                  </Row>
                </Form>
                <Navbar.Toggle
                  aria-controls="basic-navbar-nav"
                  className="button-collapse ml-2"
                />
              </section>
              <Navbar.Collapse
                id="basic-navbar-nav"
                className="sidemenu-collapse"
              >
                <Nav className="mr-auto">
                  <Nav.Item className="sep-button pt-2 mt-2">
                    <strong>Last 10 Queries</strong>
                  </Nav.Item>
                  {pastQueries.items.map(q => (
                    <Nav.Link
                      href="#"
                      className="small"
                      key={q.id}
                      onClick={e => showPastQuery(e, q)}
                    >
                      {q.countryCode} - {moment(q.createdAt).fromNow()}
                    </Nav.Link>
                  ))}
                </Nav>
                <div className="pt-2 mt-2 sep-button">
                  <Button variant="warning" size="lg" block onClick={signOut}>
                    Sign Out
                  </Button>
                </div>
              </Navbar.Collapse>
            </Navbar>
          </Col>
          <Col xl={10} md={9} className="bg-white">
            <section className="p-2 rounded">
              {currentQuery && currentQuery.file ? (
                <BinView {...{ currentQuery }} />
              ) : (
                <div>
                  {(isSending || currentQuery) && (
                    <Spinner
                      animation="border"
                      variant={currentQuery ? 'success' : 'warning'}
                    />
                  )}
                </div>
              )}
            </section>
          </Col>
        </Row>
      </Container>
    </>
  )
}

const BinView = ({ currentQuery: query }) => {
  const [link, setLink] = useState(null)
  useEffect(() => {
    const go = async () => {
      const [level, identityId, _key] = query.file.key.split('/')
      const link = await Storage.get(_key, { level, identityId })
      setLink(link)

      const data = Object.assign(
        await d3.csv(link, ({ longitude, tot_pop, count }) => ({
          x: parseFloat(longitude),
          y: parseFloat(tot_pop),
          count: parseInt(count)
        })),
        { x: 'Longitude', y: 'Population', title: 'Pop bins by Longitude' }
      )
      drawChart(data)
    }
    go()
  }, [query])

  return (
    <div>
      <div>
        <small>
          {query.countryCode} - ref: <a href={link}>{query.file.key}</a>
        </small>
      </div>
      <canvas width="512" height="1" style={{ display: 'none' }} />
      <svg />
    </div>
  )
}

export default withAuthenticator(App)
