import React, { useEffect, useState, useCallback } from 'react'
import Amplify, { API, graphqlOperation, Storage } from 'aws-amplify'
import { withAuthenticator } from 'aws-amplify-react'
import * as d3 from 'd3'

import awsconfig from './aws-exports'
import * as queries from './graphql/queries'
import * as subscriptions from './graphql/subscriptions'
import codes from './country-codes'
import { drawChart } from './hexabin-helper'

Amplify.configure(awsconfig)

function sqlQuery(code) {
  return `
  SELECT longitude, count(latitude) as count, sum(population) as tot_pop
  FROM "default"."hrsl"
  WHERE country='${code.trim()}'
  group by longitude
  order by longitude`
}

const App = () => {
  const [isSending, setIsSending] = useState(false)
  const [countryCode, setCountryCode] = useState('')
  const [QueryExecutionId, setQueryExecutionId] = useState(null)
  const [fileKey, setFileKey] = useState(null)

  useEffect(() => {
    if (!QueryExecutionId) return

    console.log(`Starting subscription with sub ID ${QueryExecutionId}`)
    const subscription = API.graphql(
      graphqlOperation(subscriptions.onAnnouncement, { QueryExecutionId })
    ).subscribe({
      next: result => {
        console.log('subscription:', result)
        const data = result.value.data.onAnnouncement
        console.log('subscription data:', data)
        setFileKey(data.file.key)
        setQueryExecutionId(null)
      }
    })

    return () => {
      console.log(`Unsubscribe with sub ID ${QueryExecutionId}`, subscription)
      subscription.unsubscribe()
    }
  }, [QueryExecutionId])

  const startQuery = useCallback(async () => {
    if (isSending) return
    setIsSending(true)
    setFileKey(null)
    try {
      const result = await API.graphql(
        graphqlOperation(queries.startQuery, {
          input: { QueryString: sqlQuery(countryCode) }
        })
      )
      console.log(`Setting sub ID: ${result.data.startQuery.QueryExecutionId}`)
      setIsSending(false)
      setQueryExecutionId(result.data.startQuery.QueryExecutionId)
    } catch (error) {
      setIsSending(false)
      console.log('querry failed ->', error)
    }
  }, [countryCode, isSending])

  return (
    <div className="container my-4">
      <div className="row">
        <div className="col-12">
          <h3>
            Visualizing big data queries with AWS AppSync, Amazon Athena, and
            AWS Amplify
          </h3>
        </div>
        <div className="col-12">
          <div className="bg-info p-2 rounded mb-4">
            <form className="form-inline">
              <label className="sr-only" htmlFor="inlineFormInputName2">
                Country:
              </label>
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                className="custom-select custom-select-sm mr-2"
              >
                <option>Select Code</option>
                {codes.map(([code, name]) => (
                  <option key={code} value={code}>{`${code} - ${name}`}</option>
                ))}
              </select>

              <button
                type="button"
                className="btn btn-light btn-sm"
                disabled={isSending || !countryCode}
                onClick={startQuery}
              >
                Query
              </button>
            </form>
          </div>
        </div>
        <div className="col-12">
          <div className="bg-light p-2 rounded">
            {fileKey ? (
              <Visuals {...{ fileKey }} />
            ) : (
              <div>
                {(isSending || QueryExecutionId) && (
                  <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const Visuals = ({ fileKey }) => {
  const [link, setLink] = useState(null)
  useEffect(() => {
    const go = async () => {
      const [level, identityId, _key] = fileKey.split('/')
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
  }, [fileKey])

  return (
    <div>
      <div>
        <small>
          ref: <a href={link}>{fileKey}</a>
        </small>
      </div>
      <canvas width="512" height="1" style={{ display: 'none' }} />
      <svg />
    </div>
  )
}

export default withAuthenticator(App, true)
